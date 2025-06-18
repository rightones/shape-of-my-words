import json
import os
from typing import List, Dict, Optional, Generator, Set
from .openrouter import OpenRouterClient
import time
import re


class WordGeneratorService:
    def __init__(self):
        self.openrouter_client = OpenRouterClient()
        self.cache_dir = "data/cache"
        self.topics_file = "data/topics.json"
        self._ensure_cache_dir()
        self._load_topics()
        # 스트리밍 세션별 생성된 단어 추적
        self._streaming_sessions: Dict[str, Set[str]] = {}

    def _ensure_cache_dir(self):
        """캐시 디렉토리가 없으면 생성합니다."""
        if not os.path.exists(self.cache_dir):
            os.makedirs(self.cache_dir)

    def _load_topics(self):
        """주제 목록을 로드합니다."""
        try:
            with open(self.topics_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.topics = {topic["id"]: topic for topic in data["topics"]}
        except FileNotFoundError:
            print(f"주제 파일을 찾을 수 없습니다: {self.topics_file}")
            self.topics = {}
        except Exception as e:
            print(f"주제 파일 로드 중 오류: {str(e)}")
            self.topics = {}

    def get_topics(self) -> List[Dict]:
        """사용 가능한 주제 목록을 반환합니다."""
        return list(self.topics.values())

    def get_topic_by_id(self, topic_id: str) -> Optional[Dict]:
        """ID로 주제를 찾습니다."""
        return self.topics.get(topic_id)

    def _get_cache_file_path(self, topic_id: str) -> str:
        """주제별 캐시 파일 경로를 반환합니다."""
        return os.path.join(self.cache_dir, f"words_{topic_id}.json")

    def _load_cached_words(self, topic_id: str) -> Optional[Dict]:
        """캐시된 단어들을 로드합니다."""
        cache_file = self._get_cache_file_path(topic_id)
        try:
            if os.path.exists(cache_file):
                with open(cache_file, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    # 캐시가 24시간 이내인지 확인
                    if time.time() - data.get("timestamp", 0) < 24 * 60 * 60:
                        return data
        except Exception as e:
            print(f"캐시 로드 중 오류: {str(e)}")
        return None

    def _save_words_to_cache(self, topic_id: str, words: List[str]):
        """단어들을 캐시에 저장합니다."""
        cache_file = self._get_cache_file_path(topic_id)
        try:
            cache_data = {
                "topic_id": topic_id,
                "words": words,
                "timestamp": time.time(),
                "count": len(words),
            }
            with open(cache_file, "w", encoding="utf-8") as f:
                json.dump(cache_data, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"캐시 저장 중 오류: {str(e)}")

    def _start_streaming_session(self, topic_id: str):
        """스트리밍 세션을 시작하고 단어 추적을 초기화합니다."""
        session_key = f"{topic_id}_{int(time.time())}"
        self._streaming_sessions[session_key] = set()
        return session_key

    def _filter_duplicate_words(
        self, session_key: str, new_words: List[str]
    ) -> List[str]:
        """중복 단어를 필터링합니다."""
        if session_key not in self._streaming_sessions:
            self._streaming_sessions[session_key] = set()

        used_words = self._streaming_sessions[session_key]
        filtered_words = []

        for word in new_words:
            if word not in used_words:
                filtered_words.append(word)
                used_words.add(word)

        return filtered_words

    def generate_words_streaming_with_batch(
        self, topic_id: str, batch_size: int = 20, batch_number: int = 1
    ) -> Generator[List[str], None, None]:
        """
        주제에 대한 단어들을 특정 배치 번호로 스트리밍 방식으로 생성합니다.
        세션 기반으로 중복 단어를 필터링합니다.

        Args:
            topic_id: 주제 ID
            batch_size: 한 번에 생성할 단어 개수
            batch_number: 배치 번호

        Yields:
            생성된 단어들의 배치
        """
        topic = self.get_topic_by_id(topic_id)
        if not topic:
            raise ValueError(f"존재하지 않는 주제 ID: {topic_id}")

        session_key = self._start_streaming_session(f"{topic_id}_batch_{batch_number}")

        try:
            for word_batch in self.openrouter_client.generate_words_streaming(
                topic["prompt"], batch_size, batch_number
            ):
                filtered_words = self._filter_duplicate_words(session_key, word_batch)
                if filtered_words:
                    yield filtered_words
        except Exception as e:
            raise Exception(f"스트리밍 단어 생성 실패: {str(e)}")
        finally:
            if session_key in self._streaming_sessions:
                del self._streaming_sessions[session_key]

    def generate_words_streaming(
        self, topic_id: str, batch_size: int = 20
    ) -> Generator[List[str], None, None]:
        """
        주제에 대한 단어들을 스트리밍 방식으로 생성합니다.

        Args:
            topic_id: 주제 ID
            batch_size: 한 번에 생성할 단어 개수

        Yields:
            생성된 단어들의 배치
        """
        # 주제 확인
        topic = self.get_topic_by_id(topic_id)
        if not topic:
            raise ValueError(f"존재하지 않는 주제 ID: {topic_id}")

        # 스트리밍 세션 시작
        session_key = self._start_streaming_session(topic_id)
        batch_number = 1

        try:
            # OpenRouter 클라이언트를 통해 스트리밍 생성
            for word_batch in self.openrouter_client.generate_words_streaming(
                topic["prompt"], batch_size, batch_number
            ):
                # 중복 단어 필터링
                filtered_words = self._filter_duplicate_words(session_key, word_batch)
                if filtered_words:
                    yield filtered_words
                batch_number += 1
        except Exception as e:
            raise Exception(f"스트리밍 단어 생성 실패: {str(e)}")
        finally:
            # 세션 정리 (메모리 절약)
            if session_key in self._streaming_sessions:
                del self._streaming_sessions[session_key]

    def generate_words_for_topic(
        self, topic_id: str, count: int = 500, use_cache: bool = True
    ) -> Dict:
        """
        주제에 대한 단어들을 생성합니다.

        Args:
            topic_id: 주제 ID
            count: 생성할 단어 개수
            use_cache: 캐시 사용 여부

        Returns:
            생성된 단어들과 메타데이터를 포함한 딕셔너리
        """
        # 주제 확인
        topic = self.get_topic_by_id(topic_id)
        if not topic:
            raise ValueError(f"존재하지 않는 주제 ID: {topic_id}")

        # 캐시 확인
        if use_cache:
            cached_data = self._load_cached_words(topic_id)
            if cached_data and len(cached_data.get("words", [])) >= count:
                return {
                    "topic_id": topic_id,
                    "topic_name": topic["topic"],
                    "words": cached_data["words"][:count],
                    "total_count": len(cached_data["words"][:count]),
                    "from_cache": True,
                    "generated_at": cached_data.get("timestamp"),
                }

        # 새로 생성
        try:
            generated_words = self.openrouter_client.generate_words(
                topic["prompt"], count
            )

            # 중복 단어 제거
            unique_words = list(dict.fromkeys(generated_words))

            # 캐시에 저장
            if unique_words:
                self._save_words_to_cache(topic_id, unique_words)

            return {
                "topic_id": topic_id,
                "topic_name": topic["topic"],
                "words": unique_words,
                "total_count": len(unique_words),
                "from_cache": False,
                "generated_at": time.time(),
            }

        except Exception as e:
            raise Exception(f"단어 생성 실패: {str(e)}")

    def clear_cache(self, topic_id: Optional[str] = None):
        """캐시를 삭제합니다."""
        if topic_id:
            # 특정 주제의 캐시만 삭제
            cache_file = self._get_cache_file_path(topic_id)
            if os.path.exists(cache_file):
                os.remove(cache_file)
        else:
            # 모든 캐시 삭제
            for filename in os.listdir(self.cache_dir):
                if filename.startswith("words_") and filename.endswith(".json"):
                    os.remove(os.path.join(self.cache_dir, filename))

    def generate_dynamic_topics(
        self, theme: str, difficulty: str, count: int = 6
    ) -> list[dict]:
        """
        LLM을 통해 동적으로 주제들을 생성합니다.
        """
        prompt = f"""
당신은 창의적인 단어 게임 주제 생성기입니다.
다음 조건에 맞춰 {count}개의 새로운 게임 주제를 생성해주세요:

1.  **전체 테마:** {theme}
2.  **난이도:** {difficulty}
3.  **출력 형식:** JSON 배열. 각 객체는 다음 키를 포함해야 합니다:
    *   `id`: 영어로 된 고유한 ID (예: `fantasy_world`, `mysterious_forest`)
    *   `topic`: 사용자가에게 보여질 주제 구절. 이름과 간단한 설명을 결합한 형태입니다. (예: "신비로운 숲 (고대 나무와 숨겨진 생물)")
    *   `prompt`: 단어 생성을 위한 LLM 프롬프트. 주제에 대한 상세한 설명과 생성할 단어의 종류를 포함합니다.

JSON 형식 예시:
```json
[
  {{
    "id": "example_topic_1",
    "topic": "예시 주제 1 (설명)",
    "prompt": "예시 주제 1에 대한 상세 설명과 함께 관련된 단어들을 생성해주세요."
  }},
  {{
    "id": "example_topic_2",
    "topic": "예시 주제 2 (설명)",
    "prompt": "예시 주제 2에 대한 상세 설명과 함께 관련된 단어들을 생성해주세요."
  }}
]
```

위의 형식에 맞춰 JSON 데이터만 생성해주세요. 설명이나 다른 텍스트는 포함하지 마세요.
"""
        try:
            response_text = self.openrouter_client.generate_text(
                prompt, max_tokens=2000, temperature=0.8
            )
            # 마크다운 코드 블록 제거 및 JSON 파싱
            clean_json_str = re.sub(r"```json\n|```", "", response_text).strip()
            generated_topics = json.loads(clean_json_str)
            
            # 생성된 주제에 현재 토픽 목록에 없는 것만 추가
            new_topics = []
            for topic in generated_topics:
                if topic.get("id") and topic.get("id") not in self.topics:
                    # 필수 필드 검사
                    if all(k in topic for k in ["id", "topic", "prompt"]):
                        new_topics.append(topic)

            return new_topics

        except json.JSONDecodeError:
            print(f"JSON 파싱 실패: {response_text}")
            return []
        except Exception as e:
            raise Exception(f"동적 주제 생성 실패: {str(e)}")

    def add_dynamic_topic(self, topic_data: Dict):
        """
        새로운 동적 주제를 topics.json에 추가하고 캐시를 생성합니다.

        Args:
            topic_data: 추가할 주제 데이터 (id, topic, prompt 포함)
        """
        # 필수 필드 확인
        if not all(k in topic_data for k in ["id", "topic", "prompt"]):
            raise ValueError("주제 데이터에 필수 필드가 누락되었습니다.")

        # 이미 존재하는 주제인지 확인
        if topic_data["id"] in self.topics:
            raise ValueError(f"이미 존재하는 주제 ID: {topic_data['id']}")

        # 새 주제 추가
        self.topics[topic_data["id"]] = topic_data

        # topics.json 파일 업데이트
        try:
            with open(self.topics_file, "r+", encoding="utf-8") as f:
                data = json.load(f)
                data["topics"].append(topic_data)
                f.seek(0)
                json.dump(data, f, ensure_ascii=False, indent=2)
                f.truncate()
        except Exception as e:
            raise Exception(f"topics.json 파일 업데이트 실패: {str(e)}")
