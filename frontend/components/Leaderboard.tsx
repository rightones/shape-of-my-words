import React, { useState, useEffect } from "react";
import { useUserScore, LeaderboardEntry } from "../hooks/useUserScore";

interface LeaderboardProps {
    isOpen: boolean;
    onClose: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ isOpen, onClose }) => {
    const { getLeaderboard, currentUser, isLoading, error } = useUserScore();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [refreshing, setRefreshing] = useState(false);

    const loadLeaderboard = async () => {
        setRefreshing(true);
        const data = await getLeaderboard(10);
        setLeaderboard(data);
        setRefreshing(false);
    };

    useEffect(() => {
        if (isOpen) {
            loadLeaderboard();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const getRankEmoji = (rank: number) => {
        switch (rank) {
            case 1:
                return "🥇";
            case 2:
                return "🥈";
            case 3:
                return "🥉";
            default:
                return "🏆";
        }
    };

    const getRankColor = (rank: number) => {
        switch (rank) {
            case 1:
                return "text-yellow-400 bg-yellow-400/20";
            case 2:
                return "text-gray-300 bg-gray-300/20";
            case 3:
                return "text-orange-400 bg-orange-400/20";
            default:
                return "text-blue-400 bg-blue-400/10";
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* 헤더 */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="text-3xl">🏆</div>
                        <h2 className="text-2xl font-bold text-white">리더보드</h2>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={loadLeaderboard}
                            disabled={refreshing}
                            className="text-white hover:text-cyan-400 transition-colors p-2 rounded-lg hover:bg-white/10"
                            title="새로고침"
                        >
                            <div className={`text-xl ${refreshing ? "animate-spin" : ""}`}>🔄</div>
                        </button>
                        <button
                            onClick={onClose}
                            className="text-white hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-white/10"
                        >
                            <div className="text-xl">✕</div>
                        </button>
                    </div>
                </div>

                {/* 에러 메시지 */}
                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-4">
                        <div className="text-red-300 text-center">{error}</div>
                    </div>
                )}

                {/* 로딩 상태 */}
                {(isLoading || refreshing) && (
                    <div className="text-center py-8">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        <div className="text-white mt-2">로딩 중...</div>
                    </div>
                )}

                {/* 리더보드 목록 */}
                {!isLoading && !refreshing && leaderboard.length > 0 && (
                    <div className="space-y-3">
                        {leaderboard.map((entry) => (
                            <div
                                key={entry.user_id}
                                className={`flex items-center justify-between p-4 rounded-lg border transition-all duration-200 ${
                                    entry.nickname === currentUser
                                        ? "bg-green-500/20 border-green-500/50 ring-2 ring-green-500/30"
                                        : "bg-white/10 border-white/20 hover:bg-white/15"
                                }`}
                            >
                                <div className="flex items-center space-x-4">
                                    {/* 순위 */}
                                    <div
                                        className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankColor(
                                            entry.rank,
                                        )}`}
                                    >
                                        <div className="text-xl">{getRankEmoji(entry.rank)}</div>
                                    </div>

                                    {/* 순위 번호 */}
                                    <div className="text-2xl font-bold text-gray-300 w-8">{entry.rank}</div>

                                    {/* 닉네임 */}
                                    <div className="flex flex-col">
                                        <div
                                            className={`font-bold text-lg ${
                                                entry.nickname === currentUser ? "text-green-300" : "text-white"
                                            }`}
                                        >
                                            {entry.nickname}
                                            {entry.nickname === currentUser && (
                                                <span className="ml-2 text-sm text-green-400">(나)</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* 점수 */}
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-yellow-400">
                                        {entry.score.toLocaleString()}
                                    </div>
                                    <div className="text-sm text-gray-400">점</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* 빈 리더보드 */}
                {!isLoading && !refreshing && leaderboard.length === 0 && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🎮</div>
                        <div className="text-xl text-gray-300 mb-2">아직 기록이 없습니다</div>
                        <div className="text-gray-400">첫 번째 기록을 남겨보세요!</div>
                    </div>
                )}

                {/* 하단 정보 */}
                {currentUser && (
                    <div className="mt-6 pt-4 border-t border-white/20">
                        <div className="text-center text-gray-400 text-sm">
                            현재 플레이어: <span className="text-cyan-400 font-medium">{currentUser}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Leaderboard;
