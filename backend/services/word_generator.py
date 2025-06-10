import json
import os
from typing import List, Dict, Optional, Generator, Set
from .openrouter import OpenRouterClient
import time


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

        Args:
            topic_id: 주제 ID
            batch_size: 한 번에 생성할 단어 개수
            batch_number: 배치 번호

        Yields:
            생성된 단어들의 배치
        """
        # 주제 확인
        topic = self.get_topic_by_id(topic_id)
        if not topic:
            raise ValueError(f"존재하지 않는 주제 ID: {topic_id}")

        try:
            # OpenRouter 클라이언트를 통해 스트리밍 생성
            for word_batch in self.openrouter_client.generate_words_streaming(
                topic["prompt"], batch_size, batch_number
            ):
                yield word_batch
        except Exception as e:
            raise Exception(f"스트리밍 단어 생성 실패: {str(e)}")

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
                    "topic_name": topic["name"],
                    "words": cached_data["words"][:count],
                    "total_count": len(cached_data["words"][:count]),
                    "from_cache": True,
                    "generated_at": cached_data.get("timestamp"),
                }

        # 새로 생성
        try:
            words = self.openrouter_client.generate_words(topic["prompt"], count)

            # 캐시에 저장
            if words:
                self._save_words_to_cache(topic_id, words)

            return {
                "topic_id": topic_id,
                "topic_name": topic["name"],
                "words": words,
                "total_count": len(words),
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
    ) -> Dict:
        """
        LLM을 통해 동적으로 주제들을 생성합니다.

        Args:
            theme: 전체적인 테마 (예: "판타지", "과학", "일상생활")
            difficulty: 난이도 ("easy", "medium", "hard")
            count: 생성할 주제 개수

        Returns:
            생성된 주제들과 메타데이터를 포함한 딕셔너리
        """
        try:
            # 난이도별 설명
            difficulty_descriptions = {
                "easy": "초보자도 쉽게 이해할 수 있는 기본적인",
                "medium": "적당한 수준의 도전적인",
                "hard": "고급 수준의 복잡하고 전문적인",
            }

            difficulty_desc = difficulty_descriptions.get(difficulty, "적당한 수준의")

            # 주제 생성을 위한 프롬프트
            prompt = f"""
다음 조건에 맞는 {count}개의 게임 주제를 생성해주세요:

테마: {theme}
난이도: {difficulty_desc}

각 주제는 다음 형식으로 작성해주세요:
1. 주제명: 간단하고 명확한 한국어 이름
2. 설명: 해당 주제에 대한 간단한 설명 (1-2문장)
3. 단어 생성 프롬프트: 해당 주제와 관련된 다양한 한국어 단어들을 생성하기 위한 상세한 지시문

응답은 반드시 다음 JSON 형식으로만 작성해주세요:
{{
  "topics": [
    {{
      "name": "주제명",
      "description": "주제 설명",
      "prompt": "단어 생성을 위한 상세한 프롬프트"
    }}
  ]
}}

주제들은 서로 다르고 독창적이어야 하며, {theme} 테마와 관련이 있어야 합니다.
"""

            # OpenRouter를 통해 주제 생성
            response = self.openrouter_client.generate_text(prompt)

            # JSON 파싱
            import json
            import re

            # JSON 부분만 추출
            json_match = re.search(r"\{.*\}", response, re.DOTALL)
            if not json_match:
                raise ValueError("유효한 JSON 응답을 받지 못했습니다.")

            json_str = json_match.group()
            topics_data = json.loads(json_str)

            if "topics" not in topics_data:
                raise ValueError("응답에 'topics' 키가 없습니다.")

            # 주제들을 게임 스테이지 형태로 변환
            generated_topics = []
            for i, topic in enumerate(topics_data["topics"][:count]):
                topic_id = f"dynamic_{theme}_{difficulty}_{i+1}_{int(time.time())}"

                generated_topic = {
                    "id": topic_id,
                    "name": topic["name"],
                    "description": topic["description"],
                    "prompt": topic["prompt"],
                    "difficulty": difficulty,
                    "stage": i + 1,
                    "theme": theme,
                    "is_dynamic": True,
                }

                generated_topics.append(generated_topic)

                # 동적 주제를 임시로 메모리에 저장
                self.topics[topic_id] = generated_topic

            return {
                "topics": generated_topics,
                "theme": theme,
                "difficulty": difficulty,
                "generated_at": time.time(),
                "total_count": len(generated_topics),
            }

        except Exception as e:
            raise Exception(f"동적 주제 생성 실패: {str(e)}")

    def add_dynamic_topic(self, topic_data: Dict):
        """동적으로 생성된 주제를 메모리에 추가합니다."""
        self.topics[topic_data["id"]] = topic_data
