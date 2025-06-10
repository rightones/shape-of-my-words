from flask import Flask, request, jsonify, Response
from flask_cors import CORS
import utils  # utils.py 모듈을 import 합니다.
import numpy as np
import torch
from flasgger import Swagger  # Swagger 추가
from services.word_generator import WordGeneratorService
import json
import time

# from langdetect import DetectorFactory # Optional: For reproducible results
# DetectorFactory.seed = 0 # Optional: Seed for reproducibility


# 한글 여부를 확인하는 함수 추가
def is_korean(text):
    """
    입력 텍스트가 한글을 포함하는지 확인하는 함수
    한글 유니코드 범위: AC00-D7A3 (가-힣)
    """
    for char in text:
        if "\uac00" <= char <= "\ud7a3":
            return True
    return False


def detect_language(text):
    """
    텍스트의 언어를 판단하는 함수
    한글이 포함되어 있으면 'ko', 그렇지 않으면 'en'으로 판단
    """
    if is_korean(text):
        return "ko"
    else:
        return "en"


app = Flask(__name__)
CORS(app)  # CORS 설정 추가

# 단어 생성 서비스 초기화
word_generator = WordGeneratorService()

# --- Flasgger (Swagger UI) Configuration ---
# Basic configuration, can be customized further
app.config["SWAGGER"] = {
    "title": "Shape of My Words API (EN/KO, Auto Lang Detect)",
    "uiversion": 3,
    "openapi": "3.0.2",
    "doc_expansion": "list",  # 'none', 'list', 'full'
    "specs_route": "/apidocs/",  # URL for the swagger.json spec
}
swagger = Swagger(app)  # Initialize Flasgger

with app.app_context():
    print(f"Using PyTorch device: {utils.device}")  # utils.device를 직접 사용
    print("Loading PyTorch-based EN/KO models on startup...")

    # 1. Load PyTorch Numberbatch embeddings
    # This can take a very long time on first run if data needs to be downloaded and processed.
    load_success = utils.load_numberbatch_pytorch()
    if not load_success or utils.embeddings_tensor is None:
        print(
            "CRITICAL: PyTorch EN/KO Numberbatch model could not be loaded. API will likely fail."
        )
    else:
        print("PyTorch EN/KO Numberbatch model loaded.")

    # 2. Load PCA model (trained on PyTorch embeddings)
    # This will also trigger PCA model training if it doesn't exist,
    # which in turn relies on the Numberbatch embeddings being loaded.
    pca_load_success = (
        utils.get_pca_model_pytorch()
    )  # Function returns the model or None
    if pca_load_success is None or utils.pca_model_pt is None:
        print(
            "CRITICAL: PCA model (EN/KO) could not be loaded or trained. API will likely fail."
        )
    else:
        print("PCA model (EN/KO) loaded or trained.")

    print("Model loading process finished.")


@app.route("/word-to-coordinates", methods=["POST"])
def get_word_coordinates():
    """
    Get 2D coordinates for a list of words (auto-detects English or Korean).
    This endpoint takes a list of words, automatically detects if each word is
    English or Korean, finds its high-dimensional embedding, and then projects
    it into 2D space using a PCA model. Language detection might not be 100% accurate.
    ---
    requestBody:
        description: A JSON object containing a list of words.
        required: true
        content:
            application/json:
                schema:
                    type: object
                    properties:
                        words:
                            type: array
                            items:
                                type: string
                            description: A list of words (English or Korean) to get coordinates for.
                            example: ["king", "apple", "사과", "사랑", "amour"]
                    required:
                        - words
    responses:
        200:
            description: A JSON object mapping each input word to its 2D coordinates (or null if language not supported/detected or word not found).
            content:
                application/json:
                    schema:
                        type: object
                        additionalProperties:
                            type: array
                            items:
                                type: number
                                format: float
                            nullable: true
                            description: "[x, y] coordinates or null."
                            example:
                                king: [0.123, -0.456]
                                사과: [-0.200, 0.500]
                                amour: null
        400:
            description: Invalid input (e.g., missing 'words' array or malformed JSON).
        500:
            description: Internal server error (e.g., models not loaded, language detection library error).
    """
    # Access models loaded at startup via the global scope of the utils module.
    # These are utils.embeddings_tensor, utils.word_to_idx, utils.pca_model_pt

    # Fallback/Re-check: In a production system, you might have more robust health checks or re-initialization logic.
    # For now, we assume they were loaded at startup, but add a basic check.
    if utils.embeddings_tensor is None or utils.word_to_idx is None:
        print("Error: PyTorch EN/KO Numberbatch embeddings not available. Reloading...")
        if not utils.load_numberbatch_pytorch() or utils.embeddings_tensor is None:
            return (
                jsonify(
                    {"error": "Word embedding model (EN/KO PyTorch) is not available"}
                ),
                500,
            )

    if utils.pca_model_pt is None or not hasattr(utils.pca_model_pt, "transform"):
        print("Error: PCA model (EN/KO) not available/invalid. Reloading/training...")
        if utils.get_pca_model_pytorch() is None or utils.pca_model_pt is None:
            return (
                jsonify({"error": "PCA model (EN/KO) is not available or invalid"}),
                500,
            )

    try:
        data = request.get_json()
        if not data or "words" not in data or not isinstance(data["words"], list):
            return (
                jsonify(
                    {
                        "error": "Invalid input. 'words' array (list of strings) is required."
                    }
                ),
                400,
            )
        # Ensure all items in words list are strings
        for word_item in data["words"]:
            if not isinstance(word_item, str):
                return (
                    jsonify({"error": "All items in 'words' array must be strings."}),
                    400,
                )

    except Exception as e:
        return jsonify({"error": f"Failed to parse JSON input: {str(e)}"}), 400

    input_words = data["words"]
    coordinates = {}

    for word in input_words:
        # langdetect 부분을 제거하고 새로운 언어 감지 함수 사용
        if len(word.strip()) <= 1:
            print(f"Word '{word}' is too short for language detection. Skipping.")
            coordinates[word] = None
            continue

        # 간단한 한글/영어 판단 함수 사용
        detected_lang = detect_language(word)

        if detected_lang in utils.SUPPORTED_LANGUAGES:
            # print(f"Word: '{word}', Detected language: {detected_lang}")
            word_vector_pt = utils.get_word_vector_pytorch(word, detected_lang)

            if word_vector_pt is not None and not torch.all(word_vector_pt.eq(0)):
                coord_2d_np = utils.transform_to_2d_pytorch(word_vector_pt)
                if coord_2d_np is not None:
                    coordinates[word] = coord_2d_np.tolist()
                else:
                    print(
                        f"PCA transformation failed for word: {word} (lang: {detected_lang})"
                    )
                    coordinates[word] = None
            else:
                print(
                    f"Word '{word}' (detected lang: {detected_lang}) resulted in a zero vector (OOV in filtered Numberbatch)."
                )
                coordinates[word] = None
        else:
            print(
                f"Word: '{word}', Detected language: '{detected_lang}' (Not supported or detection failed). Skipping."
            )
            coordinates[word] = None

    return jsonify(coordinates)


@app.route("/topics", methods=["GET"])
def get_topics():
    """
    사용 가능한 주제 목록을 반환합니다.
    ---
    responses:
        200:
            description: 주제 목록
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            topics:
                                type: array
                                items:
                                    type: object
                                    properties:
                                        id:
                                            type: string
                                            description: 주제 ID
                                        name:
                                            type: string
                                            description: 주제 이름
                                        description:
                                            type: string
                                            description: 주제 설명
                                    example:
                                        id: "nature"
                                        name: "자연"
                                        description: "자연과 관련된 단어들"
        500:
            description: 서버 오류
    """
    try:
        topics = word_generator.get_topics()
        return jsonify({"topics": topics})
    except Exception as e:
        return jsonify({"error": f"주제 목록 조회 실패: {str(e)}"}), 500


@app.route("/topics/generate", methods=["POST"])
def generate_dynamic_topics():
    """
    LLM을 통해 동적으로 주제들을 생성합니다.
    ---
    requestBody:
        description: 주제 생성 요청
        required: true
        content:
            application/json:
                schema:
                    type: object
                    properties:
                        theme:
                            type: string
                            description: 전체적인 테마 (예: "판타지", "과학", "일상생활")
                        difficulty:
                            type: string
                            enum: ["easy", "medium", "hard"]
                            description: 난이도
                        count:
                            type: integer
                            default: 6
                            description: 생성할 주제 개수
                    example:
                        theme: "판타지"
                        difficulty: "medium"
                        count: 6
    responses:
        200:
            description: 생성된 주제들
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            topics:
                                type: array
                                items:
                                    type: object
                                    properties:
                                        id:
                                            type: string
                                        name:
                                            type: string
                                        description:
                                            type: string
                                        difficulty:
                                            type: string
                                        stage:
                                            type: integer
                            theme:
                                type: string
                            generated_at:
                                type: number
        400:
            description: 잘못된 요청
        500:
            description: 서버 오류
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "요청 데이터가 필요합니다."}), 400

        theme = data.get("theme", "일반")
        difficulty = data.get("difficulty", "medium")
        count = data.get("count", 6)

        # 동적 주제 생성
        result = word_generator.generate_dynamic_topics(theme, difficulty, count)
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": f"동적 주제 생성 실패: {str(e)}"}), 500


@app.route("/words/<topic_id>", methods=["GET"])
def generate_words(topic_id):
    """
    특정 주제에 대한 단어들을 생성합니다.
    ---
    parameters:
        - name: topic_id
          in: path
          required: true
          schema:
              type: string
          description: 주제 ID
        - name: count
          in: query
          required: false
          schema:
              type: integer
              default: 500
          description: 생성할 단어 개수
        - name: use_cache
          in: query
          required: false
          schema:
              type: boolean
              default: true
          description: 캐시 사용 여부
    responses:
        200:
            description: 생성된 단어들
            content:
                application/json:
                    schema:
                        type: object
                        properties:
                            topic_id:
                                type: string
                                description: 주제 ID
                            topic_name:
                                type: string
                                description: 주제 이름
                            words:
                                type: array
                                items:
                                    type: string
                                description: 생성된 단어들
                            total_count:
                                type: integer
                                description: 총 단어 개수
                            from_cache:
                                type: boolean
                                description: 캐시에서 가져왔는지 여부
                            generated_at:
                                type: number
                                description: 생성 시간 (timestamp)
        400:
            description: 잘못된 요청
        404:
            description: 주제를 찾을 수 없음
        500:
            description: 서버 오류
    """
    try:
        # 쿼리 파라미터 처리
        count = request.args.get("count", 500, type=int)
        use_cache = request.args.get("use_cache", "true").lower() == "true"

        # 단어 생성
        result = word_generator.generate_words_for_topic(topic_id, count, use_cache)
        return jsonify(result)

    except ValueError as e:
        return jsonify({"error": str(e)}), 404
    except Exception as e:
        return jsonify({"error": f"단어 생성 실패: {str(e)}"}), 500


@app.route("/words/<topic_id>/cache", methods=["DELETE"])
def clear_topic_cache(topic_id):
    """
    특정 주제의 캐시를 삭제합니다.
    ---
    parameters:
        - name: topic_id
          in: path
          required: true
          schema:
              type: string
          description: 주제 ID
    responses:
        200:
            description: 캐시 삭제 성공
        500:
            description: 서버 오류
    """
    try:
        word_generator.clear_cache(topic_id)
        return jsonify({"message": f"주제 '{topic_id}'의 캐시가 삭제되었습니다."})
    except Exception as e:
        return jsonify({"error": f"캐시 삭제 실패: {str(e)}"}), 500


@app.route("/cache", methods=["DELETE"])
def clear_all_cache():
    """
    모든 캐시를 삭제합니다.
    ---
    responses:
        200:
            description: 캐시 삭제 성공
        500:
            description: 서버 오류
    """
    try:
        word_generator.clear_cache()
        return jsonify({"message": "모든 캐시가 삭제되었습니다."})
    except Exception as e:
        return jsonify({"error": f"캐시 삭제 실패: {str(e)}"}), 500


@app.route("/words/<topic_id>/stream", methods=["GET"])
def stream_words(topic_id):
    """
    특정 주제에 대한 단어들을 스트리밍으로 생성합니다.
    ---
    parameters:
        - name: topic_id
          in: path
          required: true
          schema:
              type: string
          description: 주제 ID
        - name: batch_size
          in: query
          required: false
          schema:
              type: integer
              default: 20
          description: 한 번에 생성할 단어 개수
        - name: total_batches
          in: query
          required: false
          schema:
              type: integer
              default: 10
          description: 총 배치 수
    responses:
        200:
            description: 스트리밍 단어 데이터
            content:
                text/event-stream:
                    schema:
                        type: string
        404:
            description: 주제를 찾을 수 없음
        500:
            description: 서버 오류
    """
    # request context 내에서 파라미터 미리 추출
    batch_size = request.args.get("batch_size", 20, type=int)
    total_batches = request.args.get("total_batches", 10, type=int)

    def generate():
        try:
            # 주제 확인
            topic = word_generator.get_topic_by_id(topic_id)
            if not topic:
                yield f"data: {json.dumps({'error': f'존재하지 않는 주제 ID: {topic_id}'})}\n\n"
                return

            # 시작 이벤트 전송
            yield f"data: {json.dumps({'type': 'start', 'topic_name': topic['name'], 'total_batches': total_batches})}\n\n"

            all_words = []

            for batch_num in range(total_batches):
                try:
                    # 배치별로 단어 생성 (배치 번호 전달)
                    for (
                        word_batch
                    ) in word_generator.generate_words_streaming_with_batch(
                        topic_id, batch_size, batch_num + 1
                    ):
                        if word_batch:
                            all_words.extend(word_batch)

                            # 배치 데이터 전송
                            batch_data = {
                                "type": "batch",
                                "batch_number": batch_num + 1,
                                "words": word_batch,
                                "total_words_so_far": len(all_words),
                                "progress": ((batch_num + 1) / total_batches) * 100,
                            }
                            yield f"data: {json.dumps(batch_data, ensure_ascii=False)}\n\n"

                            # 잠시 대기 (너무 빠른 전송 방지)
                            time.sleep(0.5)

                except Exception as e:
                    error_data = {
                        "type": "error",
                        "message": f"배치 {batch_num + 1} 생성 실패: {str(e)}",
                    }
                    yield f"data: {json.dumps(error_data)}\n\n"
                    continue

            # 완료 이벤트 전송
            complete_data = {
                "type": "complete",
                "total_words": len(all_words),
                "all_words": all_words,
            }
            yield f"data: {json.dumps(complete_data, ensure_ascii=False)}\n\n"

        except Exception as e:
            error_data = {"type": "error", "message": f"스트리밍 실패: {str(e)}"}
            yield f"data: {json.dumps(error_data)}\n\n"

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Cache-Control",
        },
    )


if __name__ == "__main__":
    # To prepare PCA training data (NumPy array from EN/KO PyTorch embeddings), run the script:
    # python backend/scripts/prepare_pca_data.py
    # This should be done once before extensively using the API for best results.
    # It relies on the PyTorch EN/KO Numberbatch embeddings being available (or generated on its first run).
    # If backend/data/word_vectors_for_pca_enko.npy does not exist,
    # the PCA model (pca_model_enko.joblib) will be trained using a fallback
    # (very small) sample of words defined in utils.py during the first API call
    # or on app startup if get_pca_model_pytorch() is called.

    # For development, host='0.0.0.0' allows access from other devices on the network.
    # Port 5001 is used to avoid conflict with other services.
    # debug=True is helpful for development but should be False in production.
    app.run(debug=True, host="0.0.0.0", port=5001)
