import React, { useEffect, useState } from "react";
import { StageConfig } from "../types/game";
import { getStageTitle } from "../utils/gameConfig";

interface StageStartProps {
    stageConfig: StageConfig;
    onStart: () => void;
}

const StageStart: React.FC<StageStartProps> = ({ stageConfig, onStart }) => {
    const [countdown, setCountdown] = useState(3);
    const [showCountdown, setShowCountdown] = useState(false);

    const handleStart = () => {
        setShowCountdown(true);
    };

    useEffect(() => {
        if (showCountdown && countdown > 0) {
            const timer = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
            return () => clearTimeout(timer);
        } else if (showCountdown && countdown === 0) {
            onStart();
        }
    }, [showCountdown, countdown, onStart]);

    if (showCountdown) {
        return (
            <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="text-center">
                    <div className="text-8xl font-bold text-white mb-4 animate-pulse">
                        {countdown > 0 ? countdown : "START!"}
                    </div>
                    <div className="text-xl text-gray-300">{countdown > 0 ? "게임 시작까지..." : ""}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center z-50">
            <div className="max-w-2xl mx-auto text-center text-white p-8">
                {/* 스테이지 헤더 */}
                <div className="mb-8">
                    <div className="text-6xl font-bold mb-2 bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        스테이지 {stageConfig.stage}
                    </div>
                    <div className="text-2xl text-blue-300 font-semibold">{getStageTitle(stageConfig.stage)}</div>
                    <div className="text-lg text-gray-300 mt-2">{stageConfig.description}</div>
                </div>

                {/* 목표 및 조건 */}
                <div className="bg-black/30 rounded-xl p-6 mb-8 backdrop-blur-sm border border-white/20">
                    <h3 className="text-xl font-bold mb-4 text-yellow-400">스테이지 목표</h3>
                    <div className="grid grid-cols-2 gap-4 text-left">
                        <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-sm text-gray-300">목표 도형</div>
                            <div className="text-2xl font-bold text-green-400">{stageConfig.targetShapes}개</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-sm text-gray-300">단어 속도</div>
                            <div className="text-2xl font-bold text-blue-400">{stageConfig.wordSpeed}x</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-sm text-gray-300">최대 단어</div>
                            <div className="text-2xl font-bold text-purple-400">{stageConfig.maxWords}개</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-sm text-gray-300">
                                {stageConfig.timeLimit ? "시간 제한" : "무제한"}
                            </div>
                            <div className="text-2xl font-bold text-red-400">
                                {stageConfig.timeLimit
                                    ? `${Math.floor(stageConfig.timeLimit / 60)}:${(stageConfig.timeLimit % 60)
                                          .toString()
                                          .padStart(2, "0")}`
                                    : "∞"}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 게임 방법 안내 */}
                <div className="bg-black/20 rounded-xl p-6 mb-8 backdrop-blur-sm border border-white/10">
                    <h3 className="text-lg font-bold mb-3 text-cyan-400">게임 방법</h3>
                    <div className="text-sm text-gray-300 space-y-2 text-left">
                        <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                            <span>떨어지는 단어 중 하나를 입력하세요</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                            <span>4개의 단어를 입력하면 도형이 완성됩니다</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                            <span>높은 위치에서 도형을 만들수록 높은 점수를 얻습니다</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
                            <span>목표 도형 수를 달성하면 다음 스테이지로 진행합니다</span>
                        </div>
                    </div>
                </div>

                {/* 시작 버튼 */}
                <button
                    onClick={handleStart}
                    className="bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 
                             text-white font-bold py-4 px-8 rounded-xl text-xl transition-all duration-300 
                             transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                    스테이지 시작!
                </button>

                {/* 장식 요소 */}
                <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl"></div>
                <div className="absolute bottom-10 right-10 w-32 h-32 bg-purple-400/20 rounded-full blur-xl"></div>
                <div className="absolute top-1/2 left-5 w-16 h-16 bg-blue-400/20 rounded-full blur-xl"></div>
                <div className="absolute top-1/4 right-5 w-24 h-24 bg-green-400/20 rounded-full blur-xl"></div>
            </div>
        </div>
    );
};

export default StageStart;
