import { useState, useEffect } from "react";

const API_BASE_URL = "http://localhost:5001/api";

export interface User {
    id: number;
    nickname: string;
    created_at: string;
}

export interface Score {
    id: number;
    user_id: number;
    value: number;
    created_at: string;
    nickname: string;
}

export interface LeaderboardEntry {
    rank: number;
    nickname: string;
    score: number;
    user_id: number;
}

export const useUserScore = () => {
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // 로컬 스토리지에서 유저 닉네임 로드
    useEffect(() => {
        const savedNickname = localStorage.getItem("gameNickname");
        if (savedNickname) {
            setCurrentUser(savedNickname);
        }
    }, []);

    // 유저 설정 (로컬 스토리지에 저장)
    const setUser = async (nickname: string): Promise<boolean> => {
        if (!nickname.trim()) {
            setError("닉네임을 입력해주세요.");
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/users`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ nickname: nickname.trim() }),
            });

            if (!response.ok) {
                throw new Error("유저 생성에 실패했습니다.");
            }

            const user: User = await response.json();
            setCurrentUser(user.nickname);
            localStorage.setItem("gameNickname", user.nickname);
            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // 점수 제출
    const submitScore = async (score: number): Promise<boolean> => {
        if (!currentUser) {
            setError("닉네임을 먼저 설정해주세요.");
            return false;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/scores`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    nickname: currentUser,
                    score,
                }),
            });

            if (!response.ok) {
                throw new Error("점수 제출에 실패했습니다.");
            }

            return true;
        } catch (err) {
            setError(err instanceof Error ? err.message : "점수 제출 중 오류가 발생했습니다.");
            return false;
        } finally {
            setIsLoading(false);
        }
    };

    // 리더보드 조회
    const getLeaderboard = async (top: number = 10): Promise<LeaderboardEntry[]> => {
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/leaderboard?top=${top}`);
            if (!response.ok) {
                throw new Error("리더보드 조회에 실패했습니다.");
            }

            const leaderboard: LeaderboardEntry[] = await response.json();
            return leaderboard;
        } catch (err) {
            setError(err instanceof Error ? err.message : "리더보드 조회 중 오류가 발생했습니다.");
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    // 유저별 점수 기록 조회
    const getUserScores = async (nickname?: string, limit: number = 10): Promise<Score[]> => {
        const targetNickname = nickname || currentUser;
        if (!targetNickname) {
            setError("닉네임이 설정되지 않았습니다.");
            return [];
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(
                `${API_BASE_URL}/users/${encodeURIComponent(targetNickname)}/scores?limit=${limit}`,
            );
            if (!response.ok) {
                throw new Error("점수 기록 조회에 실패했습니다.");
            }

            const scores: Score[] = await response.json();
            return scores;
        } catch (err) {
            setError(err instanceof Error ? err.message : "점수 기록 조회 중 오류가 발생했습니다.");
            return [];
        } finally {
            setIsLoading(false);
        }
    };

    // 유저 로그아웃 (로컬 데이터만 삭제)
    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem("gameNickname");
    };

    return {
        currentUser,
        isLoading,
        error,
        setUser,
        submitScore,
        getLeaderboard,
        getUserScores,
        logout,
        clearError: () => setError(null),
    };
};
