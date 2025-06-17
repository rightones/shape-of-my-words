import React from "react";
import { GameState } from "../types/game";
import { formatTime, getStageTitle } from "../utils/gameConfig";

interface GameHUDProps {
    gameState: GameState;
    onPause: () => void;
    onQuit: () => void;
}

const GameHUD: React.FC<GameHUDProps> = ({ gameState, onPause, onQuit }) => {
    const progressPercentage = (gameState.shapesCreated / gameState.targetShapes) * 100;

    return (
        <div className="absolute top-0 left-0 right-0 z-20 bg-black/80 backdrop-blur-sm text-white p-4">
            <div className="flex justify-between items-center max-w-6xl mx-auto">
                {/* 왼쪽: 스테이지 정보 */}
                <div className="flex items-center space-x-6">
                    <div className="text-center">
                        <div className="text-sm text-gray-300">스테이지</div>
                        <div className="text-2xl font-bold text-blue-400">{gameState.currentStage}</div>
                        <div className="text-xs text-gray-400">{getStageTitle(gameState.currentStage)}</div>
                    </div>

                    <div className="text-center">
                        <div className="text-sm text-gray-300">점수</div>
                        <div className="text-2xl font-bold text-yellow-400">{gameState.score.toLocaleString()}</div>
                    </div>

                    <div className="text-center">
                        <div className="text-sm text-gray-300">생명력</div>
                        <div className="flex space-x-1">
                            {Array.from({ length: 3 }, (_, i) => (
                                <div
                                    key={i}
                                    className={`w-6 h-6 rounded-full ${
                                        i < gameState.lives ? "bg-red-500 shadow-lg shadow-red-500/50" : "bg-gray-600"
                                    }`}
                                >
                                    {i < gameState.lives && (
                                        <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                                            ♥
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 중앙: 진행 상황 */}
                <div className="flex-1 max-w-md mx-8">
                    <div className="text-center mb-2">
                        <span className="text-sm text-gray-300">
                            도형 진행: {gameState.shapesCreated} / {gameState.targetShapes}
                        </span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300 ease-out"
                            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                        />
                    </div>
                    {progressPercentage >= 100 && (
                        <div className="text-center mt-1 text-green-400 text-sm font-bold animate-pulse">
                            스테이지 완료!
                        </div>
                    )}
                </div>

                {/* 오른쪽: 시간과 컨트롤 */}
                <div className="flex items-center space-x-4">
                    <div className="text-center">
                        <div className="text-sm text-gray-300">시간</div>
                        <div className="text-xl font-mono text-green-400">{formatTime(gameState.timeElapsed)}</div>
                    </div>

                    <div className="flex space-x-2">
                        <button
                            onClick={onPause}
                            className="px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            {gameState.isPaused ? "계속" : "일시정지"}
                        </button>
                        <button
                            onClick={onQuit}
                            className="px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors"
                        >
                            종료
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GameHUD;
