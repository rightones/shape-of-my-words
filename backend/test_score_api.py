#!/usr/bin/env python3
"""
점수 관리 API 테스트 스크립트
"""
import requests
import json

BASE_URL = "http://localhost:5001"


def test_create_user():
    """유저 생성 테스트"""
    print("=== 유저 생성 테스트 ===")

    # 새 유저 생성
    response = requests.post(f"{BASE_URL}/api/users", json={"nickname": "테스터123"})

    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

    return response.status_code == 200


def test_add_score():
    """점수 추가 테스트"""
    print("=== 점수 추가 테스트 ===")

    # 점수 추가
    response = requests.post(
        f"{BASE_URL}/api/scores", json={"nickname": "테스터123", "score": 1500}
    )

    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    print()

    # 다른 점수 추가
    response2 = requests.post(
        f"{BASE_URL}/api/scores", json={"nickname": "테스터123", "score": 2000}
    )

    print(f"Status: {response2.status_code}")
    print(f"Response: {response2.json()}")
    print()

    # 다른 유저 점수 추가
    response3 = requests.post(
        f"{BASE_URL}/api/scores", json={"nickname": "고수플레이어", "score": 3000}
    )

    print(f"Status: {response3.status_code}")
    print(f"Response: {response3.json()}")
    print()

    return all(r.status_code == 200 for r in [response, response2, response3])


def test_get_leaderboard():
    """리더보드 조회 테스트"""
    print("=== 리더보드 조회 테스트 ===")

    response = requests.get(f"{BASE_URL}/api/leaderboard?top=5")

    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")
    print()

    return response.status_code == 200


def test_get_user_scores():
    """유저 점수 기록 조회 테스트"""
    print("=== 유저 점수 기록 조회 테스트 ===")

    response = requests.get(f"{BASE_URL}/api/users/테스터123/scores?limit=5")

    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), ensure_ascii=False, indent=2)}")
    print()

    return response.status_code == 200


def main():
    """모든 테스트 실행"""
    print("점수 관리 API 테스트를 시작합니다...")
    print()

    try:
        # API 서버가 실행 중인지 확인
        response = requests.get(f"{BASE_URL}/topics")
        if response.status_code != 200:
            print(
                "❌ API 서버가 실행되지 않았습니다. 먼저 'python app.py'를 실행해주세요."
            )
            return

        print("✅ API 서버 연결 확인됨")
        print()

        # 테스트 실행
        results = []
        results.append(test_create_user())
        results.append(test_add_score())
        results.append(test_get_leaderboard())
        results.append(test_get_user_scores())

        # 결과 출력
        print("=== 테스트 결과 ===")
        if all(results):
            print("✅ 모든 테스트가 성공했습니다!")
        else:
            print("❌ 일부 테스트가 실패했습니다.")

    except requests.exceptions.ConnectionError:
        print("❌ API 서버에 연결할 수 없습니다.")
        print("'python app.py'로 서버를 먼저 실행해주세요.")
    except Exception as e:
        print(f"❌ 테스트 중 오류 발생: {e}")


if __name__ == "__main__":
    main()
