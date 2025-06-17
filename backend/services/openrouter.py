import requests
import json
import os
from typing import List, Optional, Generator
import re
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()


class OpenRouterClient:
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        self.base_url = "https://openrouter.ai/api/v1"
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "http://localhost:3000",  # 프론트엔드 URL
            "X-Title": "Shape of My Words",
        }

    def generate_words_streaming(
        self, topic_prompt: str, batch_size: int = 50, batch_number: int = 1
    ) -> Generator[List[str], None, None]:
        """
        주어진 주제에 대해 단어들을 스트리밍 방식으로 생성합니다.

        Args:
            topic_prompt: 주제에 대한 프롬프트
            batch_size: 한 번에 생성할 단어 개수 (기본값: 50)
            batch_number: 배치 번호 (다양성을 위해 사용)

        Yields:
            생성된 단어들의 배치 리스트
        """
        if not self.api_key:
            raise ValueError(
                "OpenRouter API 키가 설정되지 않았습니다. OPENROUTER_API_KEY 환경변수를 설정해주세요."
            )

        # 배치별로 다른 접근 방식 사용
        variety_prompts = [
            "기본적이고 일반적인",
            "구체적이고 세부적인",
            "추상적이고 감정적인",
            "행동과 동작 관련",
            "색깔과 모양 관련",
            "소리와 느낌 관련",
            "시간과 계절 관련",
            "크기와 양 관련",
        ]

        variety_prompt = variety_prompts[(batch_number - 1) % len(variety_prompts)]

        # 다양성을 위해 temperature를 높이고 더 구체적인 프롬프트 사용
        prompt = f"""
{topic_prompt}

{variety_prompt} 단어들을 중심으로 다음 조건에 맞는 단어들을 정확히 {batch_size}개 생성해주세요:

1. 한국어 단어만 생성
2. 명사, 동사, 형용사, 부사 모두 포함
3. 각 단어는 쉼표로 구분
4. 절대 중복되지 않는 완전히 다른 단어들
5. 창의적이고 독특한 단어들
6. 다양한 길이의 단어들 (1글자~5글자)
7. 한 줄에 모든 단어를 나열
8. 배치 {batch_number}번째이므로 이전과 완전히 다른 새로운 관점의 단어들

예시 형식: 단어1, 단어2, 단어3, ...

단어들:
"""

        payload = {
            "model": "google/gemma-3-27b-it:free",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 2000,
            "temperature": 0.9 + (batch_number * 0.1),  # 배치마다 temperature 증가
        }

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
                timeout=30,
            )

            response.raise_for_status()
            result = response.json()

            if "choices" in result and len(result["choices"]) > 0:
                content = result["choices"][0]["message"]["content"]
                words = self._parse_words_from_response(content)
                if words:
                    yield words[:batch_size]
            else:
                raise Exception("OpenRouter API 응답에서 단어를 찾을 수 없습니다.")

        except requests.exceptions.RequestException as e:
            raise Exception(f"OpenRouter API 호출 실패: {str(e)}")
        except Exception as e:
            raise Exception(f"단어 생성 중 오류 발생: {str(e)}")

    def generate_words(self, topic_prompt: str, count: int = 500) -> List[str]:
        """
        주어진 주제에 대해 단어들을 생성합니다.

        Args:
            topic_prompt: 주제에 대한 프롬프트
            count: 생성할 단어 개수 (기본값: 500)

        Returns:
            생성된 단어들의 리스트
        """
        if not self.api_key:
            raise ValueError(
                "OpenRouter API 키가 설정되지 않았습니다. OPENROUTER_API_KEY 환경변수를 설정해주세요."
            )

        prompt = f"""
{topic_prompt}

다음 조건에 맞는 단어들을 정확히 {count}개 생성해주세요:
1. 한국어 단어만 생성
2. 명사, 동사, 형용사 모두 포함
3. 각 단어는 쉼표로 구분
4. 중복되지 않는 단어들
5. 일반적이고 자연스러운 단어들
6. 한 줄에 모든 단어를 나열

예시 형식: 단어1, 단어2, 단어3, ...

단어들:
"""

        payload = {
            "model": "google/gemma-3-27b-it:free",  # 또는 다른 모델 선택
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": 4000,
            "temperature": 0.7,
        }

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
                timeout=60,
            )

            response.raise_for_status()
            result = response.json()

            if "choices" in result and len(result["choices"]) > 0:
                content = result["choices"][0]["message"]["content"]
                words = self._parse_words_from_response(content)
                return words[:count]  # 요청한 개수만큼만 반환
            else:
                raise Exception("OpenRouter API 응답에서 단어를 찾을 수 없습니다.")

        except requests.exceptions.RequestException as e:
            raise Exception(f"OpenRouter API 호출 실패: {str(e)}")
        except Exception as e:
            raise Exception(f"단어 생성 중 오류 발생: {str(e)}")

    def _parse_words_from_response(self, content: str) -> List[str]:
        """
        API 응답에서 단어들을 파싱합니다.
        """
        # 쉼표로 구분된 단어들을 찾기
        words = []

        # 여러 줄에 걸쳐 있을 수 있으므로 전체 텍스트에서 쉼표로 분리
        lines = content.split("\n")
        for line in lines:
            if "," in line:
                # 쉼표로 분리하고 정리
                line_words = [word.strip() for word in line.split(",")]
                for word in line_words:
                    # 한글만 포함된 단어 필터링
                    cleaned_word = re.sub(r"[^\uAC00-\uD7A3]", "", word)
                    if cleaned_word and len(cleaned_word) > 0:
                        words.append(cleaned_word)

        # 중복 제거
        unique_words = list(dict.fromkeys(words))

        return unique_words

    def generate_text(
        self, prompt: str, max_tokens: int = 2000, temperature: float = 0.7
    ) -> str:
        """
        주어진 프롬프트에 대해 텍스트를 생성합니다.

        Args:
            prompt: 생성할 텍스트에 대한 프롬프트
            max_tokens: 최대 토큰 수
            temperature: 창의성 수준 (0.0-1.0)

        Returns:
            생성된 텍스트
        """
        if not self.api_key:
            raise ValueError(
                "OpenRouter API 키가 설정되지 않았습니다. OPENROUTER_API_KEY 환경변수를 설정해주세요."
            )

        payload = {
            "model": "google/gemma-3-27b-it:free",
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": temperature,
        }

        try:
            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers=self.headers,
                json=payload,
                timeout=60,
            )

            response.raise_for_status()
            result = response.json()

            if "choices" in result and len(result["choices"]) > 0:
                return result["choices"][0]["message"]["content"]
            else:
                raise Exception("OpenRouter API 응답에서 텍스트를 찾을 수 없습니다.")

        except requests.exceptions.RequestException as e:
            raise Exception(f"OpenRouter API 호출 실패: {str(e)}")
        except Exception as e:
            raise Exception(f"텍스트 생성 중 오류 발생: {str(e)}")
