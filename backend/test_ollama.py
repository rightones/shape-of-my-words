#!/usr/bin/env python3
"""
Ollama API 연결 테스트 스크립트
192.168.1.10:11434에서 실행 중인 Ollama와 gemma2:4b 모델을 테스트합니다.
"""

import requests
import json

OLLAMA_BASE_URL = "http://192.168.1.10:11434"
MODEL_NAME = "gemma3:4b"


def test_ollama_connection():
    """Ollama 서버 연결 테스트"""
    print("🔍 Ollama 서버 연결 테스트...")
    try:
        response = requests.get(f"{OLLAMA_BASE_URL}/api/tags", timeout=10)
        if response.status_code == 200:
            data = response.json()
            models = [model["name"] for model in data.get("models", [])]
            print(f"✅ Ollama 서버 연결 성공!")
            print(f"   사용 가능한 모델: {', '.join(models)}")

            if MODEL_NAME in models:
                print(f"✅ {MODEL_NAME} 모델이 사용 가능합니다.")
                return True
            else:
                print(f"❌ {MODEL_NAME} 모델을 찾을 수 없습니다.")
                print(
                    f"   다음 명령으로 모델을 다운로드하세요: ollama pull {MODEL_NAME}"
                )
                return False
        else:
            print(f"❌ Ollama 서버 응답 오류: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Ollama 서버 연결 실패: {str(e)}")
        print("   192.168.1.10:11434에서 Ollama가 실행 중인지 확인하세요.")
        return False


def test_chat_api():
    """Ollama Chat API 테스트"""
    print("\n🤖 Ollama Chat API 테스트...")

    payload = {
        "model": MODEL_NAME,
        "messages": [
            {
                "role": "user",
                "content": "자연과 관련된 한국어 단어 5개를 쉼표로 구분하여 나열해주세요.",
            }
        ],
        "stream": False,
    }

    try:
        response = requests.post(
            f"{OLLAMA_BASE_URL}/v1/chat/completions",
            headers={"Content-Type": "application/json"},
            json=payload,
            timeout=30,
        )

        if response.status_code == 200:
            result = response.json()
            if "choices" in result and len(result["choices"]) > 0:
                content = result["choices"][0]["message"]["content"]
                print(f"✅ Chat API 테스트 성공!")
                print(f"   응답: {content}")
                return True
            else:
                print("❌ Chat API 응답 형식 오류")
                return False
        else:
            print(f"❌ Chat API 호출 실패: HTTP {response.status_code}")
            print(f"   응답: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Chat API 테스트 실패: {str(e)}")
        return False


def test_word_service():
    """WordService를 통한 테스트"""
    print("\n📝 WordService 통합 테스트...")

    try:
        from services.openrouter import OpenRouterClient

        client = OpenRouterClient()
        words = client.generate_words("자연과 관련된 주제", count=10)

        if words and len(words) > 0:
            print(f"✅ WordService 테스트 성공!")
            print(f"   생성된 단어 수: {len(words)}")
            print(f"   단어 예시: {', '.join(words[:5])}")
            return True
        else:
            print("❌ WordService에서 단어를 생성하지 못했습니다.")
            return False
    except Exception as e:
        print(f"❌ WordService 테스트 실패: {str(e)}")
        return False


def main():
    print("🚀 Ollama API 연결 테스트 시작\n")

    # 1. Ollama 서버 연결 테스트
    if not test_ollama_connection():
        return

    # 2. Chat API 테스트
    if not test_chat_api():
        return

    # 3. WordService 통합 테스트
    test_word_service()

    print("\n🎉 모든 테스트 완료!")


if __name__ == "__main__":
    main()
