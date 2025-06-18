from sqlalchemy.orm import Session
from sqlalchemy import desc
from models import User, Score
from services.user_service import UserService
from typing import Optional, List, Dict


class ScoreService:
    def __init__(self, db: Session):
        self.db = db
        self.user_service = UserService(db)

    def add_score(self, nickname: str, score_value: int) -> Optional[Score]:
        """
        점수를 추가합니다. 유저가 없으면 자동으로 생성합니다.
        """
        try:
            # 유저 가져오기 또는 생성
            user = self.user_service.create_user(nickname)
            if not user:
                return None

            # 점수 생성
            new_score = Score(user_id=user.id, value=score_value)
            self.db.add(new_score)
            self.db.commit()
            self.db.refresh(new_score)
            return new_score
        except Exception as e:
            self.db.rollback()
            print(f"Error adding score: {e}")
            return None

    def get_user_scores(self, nickname: str, limit: int = 10) -> List[Score]:
        """특정 유저의 점수 기록을 조회합니다."""
        user = self.user_service.get_user_by_nickname(nickname)
        if not user:
            return []

        return (
            self.db.query(Score)
            .filter(Score.user_id == user.id)
            .order_by(desc(Score.value))
            .limit(limit)
            .all()
        )

    def get_leaderboard(self, limit: int = 10) -> List[Dict]:
        """
        리더보드를 조회합니다.
        각 유저의 최고 점수를 기준으로 정렬합니다.
        """
        try:
            # 각 유저별 최고 점수를 가져오는 서브쿼리
            from sqlalchemy import func

            subquery = (
                self.db.query(Score.user_id, func.max(Score.value).label("max_score"))
                .group_by(Score.user_id)
                .subquery()
            )

            # 유저 정보와 함께 조회
            results = (
                self.db.query(User, subquery.c.max_score)
                .join(subquery, User.id == subquery.c.user_id)
                .order_by(desc(subquery.c.max_score))
                .limit(limit)
                .all()
            )

            leaderboard = []
            for rank, (user, max_score) in enumerate(results, 1):
                leaderboard.append(
                    {
                        "rank": rank,
                        "nickname": user.nickname,
                        "score": max_score,
                        "user_id": user.id,
                    }
                )

            return leaderboard
        except Exception as e:
            print(f"Error getting leaderboard: {e}")
            return []

    def get_recent_scores(self, limit: int = 10) -> List[Score]:
        """최근 점수들을 조회합니다."""
        return self.db.query(Score).order_by(desc(Score.created_at)).limit(limit).all()
