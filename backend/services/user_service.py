from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from models import User, Score
from typing import Optional, List


class UserService:
    def __init__(self, db: Session):
        self.db = db

    def create_user(self, nickname: str) -> Optional[User]:
        """
        새로운 유저를 생성합니다.
        중복된 닉네임이 있으면 기존 유저를 반환합니다.
        """
        try:
            # 이미 존재하는 유저인지 확인
            existing_user = (
                self.db.query(User).filter(User.nickname == nickname).first()
            )
            if existing_user:
                return existing_user

            # 새 유저 생성
            new_user = User(nickname=nickname)
            self.db.add(new_user)
            self.db.commit()
            self.db.refresh(new_user)
            return new_user
        except IntegrityError:
            self.db.rollback()
            # 동시 요청으로 인한 중복 생성 시 기존 유저 반환
            return self.db.query(User).filter(User.nickname == nickname).first()
        except Exception as e:
            self.db.rollback()
            print(f"Error creating user: {e}")
            return None

    def get_user_by_nickname(self, nickname: str) -> Optional[User]:
        """닉네임으로 유저를 조회합니다."""
        return self.db.query(User).filter(User.nickname == nickname).first()

    def get_user_by_id(self, user_id: int) -> Optional[User]:
        """ID로 유저를 조회합니다."""
        return self.db.query(User).filter(User.id == user_id).first()

    def get_all_users(self) -> List[User]:
        """모든 유저를 조회합니다."""
        return self.db.query(User).all()
