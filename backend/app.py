from flask import Flask, request, jsonify
import utils  # utils.py 모듈을 import 합니다.
import numpy as np
import torch
from flasgger import Swagger  # Swagger 추가

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
