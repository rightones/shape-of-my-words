import React, { useEffect, useState } from "react";
import { ScoreBreakdown } from "../types/game";
import { formatTime, getStageTitle } from "../utils/gameConfig";

interface StageCompleteProps {
    stage: number;
    scoreBreakdown: ScoreBreakdown;
    timeElapsed: number;
    shapesCreated: number;
    onNextStage: () => void;
    onQuit: () => void;
}

const StageComplete: React.FC<StageCompleteProps> = ({
    stage,
    scoreBreakdown,
    timeElapsed,
    shapesCreated,
    onNextStage,
    onQuit,
}) => {
    const [showScores, setShowScores] = useState(false);
    const [animatedScores, setAnimatedScores] = useState({
        shapeScore: 0,
        timeBonus: 0,
        accuracyBonus: 0,
        stageBonus: 0,
        total: 0,
    });

    useEffect(() => {
        // 점수 애니메이션 시작
        const timer = setTimeout(() => {
            setShowScores(true);
        }, 1000);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (showScores) {
            // 각 점수를 순차적으로 애니메이션
            const animateScore = (key: keyof typeof animatedScores, targetValue: number, delay: number) => {
                setTimeout(() => {
                    let current = 0;
                    const increment = targetValue / 30; // 30프레임으로 나누어 애니메이션
                    const interval = setInterval(() => {
                        current += increment;
                        if (current >= targetValue) {
                            current = targetValue;
                            clearInterval(interval);
                        }
                        setAnimatedScores((prev) => ({
                            ...prev,
                            [key]: Math.floor(current),
                        }));
                    }, 50);
                }, delay);
            };

            animateScore("shapeScore", scoreBreakdown.shapeScore, 500);
            animateScore("timeBonus", scoreBreakdown.timeBonus, 1000);
            animateScore("accuracyBonus", scoreBreakdown.accuracyBonus, 1500);
            animateScore("stageBonus", scoreBreakdown.stageBonus, 2000);
            animateScore("total", scoreBreakdown.total, 2500);
        }
    }, [showScores, scoreBreakdown]);

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-green-900 via-emerald-900 to-teal-900 flex items-center justify-center z-50">
            <div className="max-w-2xl mx-auto text-center text-white p-8">
                {/* 완료 헤더 */}
                <div className="mb-8">
                    <div className="text-6xl font-bold mb-4 animate-bounce">🎉</div>
                    <div className="text-5xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        스테이지 완료!
                    </div>
                    <div className="text-2xl text-green-300 font-semibold">{getStageTitle(stage)}</div>
                </div>

                {/* 통계 정보 */}
                <div className="bg-black/30 rounded-xl p-6 mb-8 backdrop-blur-sm border border-white/20">
                    <h3 className="text-xl font-bold mb-4 text-yellow-400">스테이지 통계</h3>
                    <div className="grid grid-cols-3 gap-4">
                        <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-sm text-gray-300">완성한 도형</div>
                            <div className="text-2xl font-bold text-green-400">{shapesCreated}개</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-sm text-gray-300">소요 시간</div>
                            <div className="text-2xl font-bold text-blue-400">{formatTime(timeElapsed)}</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-sm text-gray-300">평균 속도</div>
                            <div className="text-2xl font-bold text-purple-400">
                                {timeElapsed > 0 ? Math.floor(shapesCreated / (timeElapsed / 60)) : 0}/분
                            </div>
                        </div>
                    </div>
                </div>

                {/* 점수 분석 */}
                {showScores && (
                    <div className="bg-black/40 rounded-xl p-6 mb-8 backdrop-blur-sm border border-white/20">
                        <h3 className="text-xl font-bold mb-4 text-yellow-400">점수 분석</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-gray-300">도형 점수</span>
                                <span className="text-xl font-bold text-green-400">
                                    +{animatedScores.shapeScore.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-gray-300">시간 보너스</span>
                                <span className="text-xl font-bold text-blue-400">
                                    +{animatedScores.timeBonus.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-gray-300">정확도 보너스</span>
                                <span className="text-xl font-bold text-purple-400">
                                    +{animatedScores.accuracyBonus.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-gray-300">스테이지 보너스</span>
                                <span className="text-xl font-bold text-orange-400">
                                    +{animatedScores.stageBonus.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-3 border-t-2 border-yellow-400 mt-4">
                                <span className="text-xl font-bold text-yellow-400">총 점수</span>
                                <span className="text-3xl font-bold text-yellow-400">
                                    {animatedScores.total.toLocaleString()}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex space-x-4 justify-center">
                    <button
                        onClick={onNextStage}
                        className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 
                                 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all duration-300 
                                 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        다음 스테이지
                    </button>
                    <button
                        onClick={onQuit}
                        className="bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 
                                 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all duration-300 
                                 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        게임 종료
                    </button>
                </div>

                {/* 장식 요소 */}
                <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-32 h-32 bg-green-400/20 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute top-1/2 left-5 w-16 h-16 bg-blue-400/20 rounded-full blur-xl animate-pulse"></div>
                <div className="absolute top-1/4 right-5 w-24 h-24 bg-purple-400/20 rounded-full blur-xl animate-pulse"></div>

                {/* 떨어지는 별 효과 */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    {Array.from({ length: 20 }, (_, i) => (
                        <div
                            key={i}
                            className="absolute text-yellow-400 text-2xl animate-bounce"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                animationDelay: `${Math.random() * 2}s`,
                                animationDuration: `${2 + Math.random() * 2}s`,
                            }}
                        >
                            ⭐
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StageComplete;
