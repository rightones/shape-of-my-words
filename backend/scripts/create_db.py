#!/usr/bin/env python3
"""
데이터베이스 테이블을 생성하는 스크립트
"""
import sys
import os

# 상위 디렉토리를 Python 경로에 추가
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import create_tables, engine
from sqlalchemy import text


def main():
    """데이터베이스 테이블을 생성합니다."""
    try:
        print("데이터베이스 테이블을 생성 중...")

        # 테이블 생성
        create_tables()

        # 연결 테스트
        with engine.connect() as conn:
            result = conn.execute(
                text("SELECT name FROM sqlite_master WHERE type='table';")
            )
            tables = result.fetchall()
            print(f"생성된 테이블: {[table[0] for table in tables]}")

        print("데이터베이스 초기화 완료!")

    except Exception as e:
        print(f"데이터베이스 초기화 중 오류 발생: {e}")
        return 1

    return 0


if __name__ == "__main__":
    exit(main())
