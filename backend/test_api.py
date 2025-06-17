#!/usr/bin/env python3
"""
API 테스트 스크립트
OpenRouter API 키 없이도 기본 기능을 테스트할 수 있습니다.
"""

import requests
import json
import time

BASE_URL = "http://localhost:5001"


def test_topics():
    """주제 목록 조회 테스트"""
    print("🔍 주제 목록 조회 테스트...")
    try:
        response = requests.get(f"{BASE_URL}/topics")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 성공: {len(data['topics'])}개의 주제를 찾았습니다.")
            for topic in data["topics"]:
                print(f"   - {topic['name']} ({topic['id']})")
            return True
        else:
            print(f"❌ 실패: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 오류: {str(e)}")
        return False


def test_word_generation(topic_id="nature"):
    """단어 생성 테스트 (API 키 필요)"""
    print(f"\n🎯 '{topic_id}' 주제 단어 생성 테스트...")
    try:
        response = requests.get(f"{BASE_URL}/words/{topic_id}?count=10")
        if response.status_code == 200:
            data = response.json()
            print(f"✅ 성공: {data['total_count']}개의 단어를 생성했습니다.")
            print(f"   주제: {data['topic_name']}")
            print(f"   캐시 사용: {data['from_cache']}")
            print(f"   단어 예시: {', '.join(data['words'][:5])}...")
            return True
        else:
            error_data = response.json()
            print(f"❌ 실패: {error_data.get('error', 'Unknown error')}")
            return False
    except Exception as e:
        print(f"❌ 오류: {str(e)}")
        return False


def test_health():
    """서버 상태 확인"""
    print("🏥 서버 상태 확인...")
    try:
        response = requests.get(f"{BASE_URL}/apidocs/")
        if response.status_code == 200:
            print("✅ 서버가 정상적으로 실행 중입니다.")
            print(f"   Swagger UI: {BASE_URL}/apidocs/")
            return True
        else:
            print(f"❌ 서버 응답 오류: HTTP {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 서버 연결 실패: {str(e)}")
        print("   백엔드 서버가 실행 중인지 확인하세요.")
        return False


def main():
    print("🚀 Shape of My Words API 테스트 시작\n")

    # 1. 서버 상태 확인
    if not test_health():
        print("\n❌ 서버가 실행되지 않았습니다. 먼저 백엔드를 실행하세요:")
        print("   cd backend && python app.py")
        return

    # 2. 주제 목록 테스트
    if not test_topics():
        return

    # 3. 단어 생성 테스트 (선택사항)
    print("\n" + "=" * 50)
    print("단어 생성 테스트를 진행하려면 OpenRouter API 키가 필요합니다.")
    print("API 키가 설정되어 있다면 계속 진행됩니다...")
    print("=" * 50)

    time.sleep(2)
    test_word_generation()

    print("\n🎉 테스트 완료!")
    print(f"프론트엔드 접속: http://localhost:3001")


if __name__ == "__main__":
    main()
