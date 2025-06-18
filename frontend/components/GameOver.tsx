import React, { useEffect, useState } from "react";
import { GameStats } from "../types/game";
import { formatTime } from "../utils/gameConfig";
import { useUserScore } from "../hooks/useUserScore";
import Leaderboard from "./Leaderboard";

interface GameOverProps {
    gameStats: GameStats;
    onRestart: () => void;
    onMainMenu: () => void;
}

const GameOver: React.FC<GameOverProps> = ({ gameStats, onRestart, onMainMenu }) => {
    const [showStats, setShowStats] = useState(false);
    const [animatedScore, setAnimatedScore] = useState(0);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [scoreSubmitted, setScoreSubmitted] = useState(false);
    const { currentUser, submitScore, isLoading } = useUserScore();

    useEffect(() => {
        // 통계 표시 애니메이션
        const timer = setTimeout(() => {
            setShowStats(true);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (showStats) {
            // 점수 카운트업 애니메이션
            let current = 0;
            const increment = gameStats.totalScore / 50;
            const interval = setInterval(() => {
                current += increment;
                if (current >= gameStats.totalScore) {
                    current = gameStats.totalScore;
                    clearInterval(interval);
                }
                setAnimatedScore(Math.floor(current));
            }, 50);

            return () => clearInterval(interval);
        }
    }, [showStats, gameStats.totalScore]);

    const getRank = (score: number): { rank: string; color: string; message: string } => {
        if (score >= 50000) return { rank: "S+", color: "text-yellow-400", message: "전설적인 실력!" };
        if (score >= 30000) return { rank: "S", color: "text-yellow-500", message: "놀라운 실력!" };
        if (score >= 20000) return { rank: "A+", color: "text-green-400", message: "훌륭한 실력!" };
        if (score >= 15000) return { rank: "A", color: "text-green-500", message: "좋은 실력!" };
        if (score >= 10000) return { rank: "B+", color: "text-blue-400", message: "괜찮은 실력!" };
        if (score >= 7000) return { rank: "B", color: "text-blue-500", message: "보통 실력!" };
        if (score >= 5000) return { rank: "C+", color: "text-purple-400", message: "연습이 필요해요!" };
        if (score >= 3000) return { rank: "C", color: "text-purple-500", message: "더 노력해보세요!" };
        return { rank: "D", color: "text-gray-400", message: "다시 도전해보세요!" };
    };

    const rank = getRank(gameStats.totalScore);

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-red-900 via-purple-900 to-indigo-900 flex items-center justify-center z-50">
            <div className="max-w-2xl mx-auto text-center text-white p-8">
                {/* 게임 오버 헤더 */}
                <div className="mb-8">
                    <div className="text-6xl font-bold mb-4 animate-pulse">💀</div>
                    <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-red-400 to-pink-500 bg-clip-text text-transparent">
                        게임 오버
                    </div>
                    <div className="text-xl text-gray-300">좋은 시도였습니다!</div>
                </div>

                {/* 최종 점수 및 등급 */}
                <div className="bg-black/40 rounded-xl p-8 mb-8 backdrop-blur-sm border border-white/20">
                    <div className="mb-6">
                        <div className="text-sm text-gray-300 mb-2">최종 점수</div>
                        <div className="text-6xl font-bold text-yellow-400 mb-4">{animatedScore.toLocaleString()}</div>
                        <div className="flex items-center justify-center space-x-4">
                            <div className={`text-4xl font-bold ${rank.color}`}>{rank.rank}</div>
                            <div className="text-lg text-gray-300">{rank.message}</div>
                        </div>
                    </div>
                </div>

                {/* 게임 통계 */}
                {showStats && (
                    <div className="bg-black/30 rounded-xl p-6 mb-8 backdrop-blur-sm border border-white/20">
                        <h3 className="text-xl font-bold mb-4 text-cyan-400">게임 통계</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-sm text-gray-300">완료한 스테이지</div>
                                <div className="text-2xl font-bold text-green-400">{gameStats.stagesCompleted}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-sm text-gray-300">생성한 도형</div>
                                <div className="text-2xl font-bold text-blue-400">{gameStats.shapesCreated}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-sm text-gray-300">입력한 단어</div>
                                <div className="text-2xl font-bold text-purple-400">{gameStats.wordsTyped}</div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4">
                                <div className="text-sm text-gray-300">정확도</div>
                                <div className="text-2xl font-bold text-orange-400">
                                    {gameStats.accuracy.toFixed(1)}%
                                </div>
                            </div>
                            <div className="bg-white/10 rounded-lg p-4 col-span-2">
                                <div className="text-sm text-gray-300">총 플레이 시간</div>
                                <div className="text-2xl font-bold text-yellow-400">
                                    {formatTime(gameStats.playTime)}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 성취도 분석 */}
                {showStats && (
                    <div className="bg-black/20 rounded-xl p-6 mb-8 backdrop-blur-sm border border-white/10">
                        <h3 className="text-lg font-bold mb-3 text-pink-400">성취도 분석</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">분당 도형 생성</span>
                                <span className="text-cyan-400 font-bold">
                                    {gameStats.playTime > 0
                                        ? (gameStats.shapesCreated / (gameStats.playTime / 60)).toFixed(1)
                                        : 0}
                                    /분
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">분당 단어 입력</span>
                                <span className="text-green-400 font-bold">
                                    {gameStats.playTime > 0
                                        ? (gameStats.wordsTyped / (gameStats.playTime / 60)).toFixed(1)
                                        : 0}
                                    /분
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-gray-300">평균 스테이지 시간</span>
                                <span className="text-blue-400 font-bold">
                                    {gameStats.stagesCompleted > 0
                                        ? formatTime(Math.floor(gameStats.playTime / gameStats.stagesCompleted))
                                        : "0:00"}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 점수 제출 버튼 */}
                {currentUser && !scoreSubmitted && (
                    <div className="mb-6">
                        <button
                            onClick={async () => {
                                const success = await submitScore(gameStats.totalScore);
                                if (success) {
                                    setScoreSubmitted(true);
                                }
                            }}
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 
                                     text-white font-bold py-3 px-6 rounded-xl text-lg transition-all duration-300 
                                     transform hover:scale-105 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "점수 제출 중..." : "점수 제출하기"}
                        </button>
                    </div>
                )}

                {/* 점수 제출 완료 메시지 */}
                {scoreSubmitted && (
                    <div className="mb-6 bg-green-500/20 border border-green-500/50 rounded-lg p-4">
                        <div className="text-green-300 text-center font-medium">
                            ✅ 점수가 성공적으로 제출되었습니다!
                        </div>
                    </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex flex-wrap gap-3 justify-center">
                    <button
                        onClick={onRestart}
                        className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 
                                 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all duration-300 
                                 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        다시 시작
                    </button>
                    <button
                        onClick={() => setShowLeaderboard(true)}
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 
                                 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all duration-300 
                                 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        리더보드
                    </button>
                    <button
                        onClick={onMainMenu}
                        className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 
                                 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all duration-300 
                                 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        메인 메뉴
                    </button>
                </div>

                {/* 격려 메시지 */}
                <div className="mt-8 text-gray-400 text-sm">
                    {gameStats.stagesCompleted === 0 && "첫 스테이지부터 다시 도전해보세요!"}
                    {gameStats.stagesCompleted >= 1 &&
                        gameStats.stagesCompleted < 3 &&
                        "좋은 시작이에요! 더 높은 스테이지에 도전해보세요!"}
                    {gameStats.stagesCompleted >= 3 &&
                        gameStats.stagesCompleted < 5 &&
                        "훌륭한 실력이네요! 계속 도전해보세요!"}
                    {gameStats.stagesCompleted >= 5 && "놀라운 실력입니다! 당신은 진정한 마스터예요!"}
                </div>

                {/* 장식 요소 */}
                <div className="absolute top-10 left-10 w-20 h-20 bg-red-400/20 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-400/20 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute top-1/2 left-5 w-16 h-16 bg-pink-400/20 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute top-1/4 right-5 w-24 h-24 bg-indigo-400/20 rounded-full blur-xl animate-pulse"></div>
            </div>

            {/* 리더보드 모달 */}
            <Leaderboard isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
        </div>
    );
};

export default GameOver;
