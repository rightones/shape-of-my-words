# PyTorch models, if any (e.g., custom PCA implementation)

# For now, we might rely more on scikit-learn for PCA via utils.py

from sqlalchemy import create_engine, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

Base = declarative_base()


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    nickname = Column(String(50), unique=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 관계 설정
    scores = relationship("Score", back_populates="user")

    def to_dict(self):
        return {
            "id": self.id,
            "nickname": self.nickname,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    value = Column(Integer, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # 관계 설정
    user = relationship("User", back_populates="scores")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "value": self.value,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "nickname": self.user.nickname if self.user else None,
        }


# 데이터베이스 설정
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./game_scores.db")
engine = create_engine(DATABASE_URL, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """데이터베이스 세션을 가져오는 의존성 함수"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """테이블을 생성하는 함수"""
    Base.metadata.create_all(bind=engine)
