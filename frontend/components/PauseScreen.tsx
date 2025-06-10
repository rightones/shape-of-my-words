import React from "react";
import { GameState } from "../types/game";
import { formatTime, getStageTitle } from "../utils/gameConfig";

interface PauseScreenProps {
    gameState: GameState;
    onResume: () => void;
    onRestart: () => void;
    onQuit: () => void;
}

const PauseScreen: React.FC<PauseScreenProps> = ({ gameState, onResume, onRestart, onQuit }) => {
    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="max-w-lg mx-auto text-center text-white p-8">
                {/* 일시정지 헤더 */}
                <div className="mb-8">
                    <div className="text-6xl font-bold mb-4">⏸️</div>
                    <div className="text-4xl font-bold mb-2 text-yellow-400">일시정지</div>
                    <div className="text-lg text-gray-300">게임이 일시정지되었습니다</div>
                </div>

                {/* 현재 게임 상태 */}
                <div className="bg-black/40 rounded-xl p-6 mb-8 backdrop-blur-sm border border-white/20">
                    <h3 className="text-xl font-bold mb-4 text-cyan-400">현재 상태</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-sm text-gray-300">스테이지</div>
                            <div className="text-xl font-bold text-blue-400">{gameState.currentStage}</div>
                            <div className="text-xs text-gray-400">{getStageTitle(gameState.currentStage)}</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-sm text-gray-300">점수</div>
                            <div className="text-xl font-bold text-yellow-400">{gameState.score.toLocaleString()}</div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-sm text-gray-300">진행도</div>
                            <div className="text-xl font-bold text-green-400">
                                {gameState.shapesCreated}/{gameState.targetShapes}
                            </div>
                        </div>
                        <div className="bg-white/10 rounded-lg p-3">
                            <div className="text-sm text-gray-300">시간</div>
                            <div className="text-xl font-bold text-purple-400">{formatTime(gameState.timeElapsed)}</div>
                        </div>
                    </div>

                    {/* 진행률 바 */}
                    <div className="mt-4">
                        <div className="text-sm text-gray-300 mb-2">스테이지 진행률</div>
                        <div className="w-full bg-gray-700 rounded-full h-3">
                            <div
                                className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-300"
                                style={{
                                    width: `${Math.min(
                                        (gameState.shapesCreated / gameState.targetShapes) * 100,
                                        100,
                                    )}%`,
                                }}
                            />
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                            {Math.floor((gameState.shapesCreated / gameState.targetShapes) * 100)}% 완료
                        </div>
                    </div>
                </div>

                {/* 게임 팁 */}
                <div className="bg-black/20 rounded-xl p-6 mb-8 backdrop-blur-sm border border-white/10">
                    <h3 className="text-lg font-bold mb-3 text-pink-400">💡 게임 팁</h3>
                    <div className="text-sm text-gray-300 space-y-2 text-left">
                        <div className="flex items-start space-x-2">
                            <span className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0"></span>
                            <span>높은 위치에서 도형을 만들수록 더 많은 점수를 얻을 수 있습니다</span>
                        </div>
                        <div className="flex items-start space-x-2">
                            <span className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0"></span>
                            <span>빠르게 단어를 입력할수록 시간 보너스가 증가합니다</span>
                        </div>
                        <div className="flex items-start space-x-2">
                            <span className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0"></span>
                            <span>정확한 단어 입력으로 정확도 보너스를 노려보세요</span>
                        </div>
                        <div className="flex items-start space-x-2">
                            <span className="w-2 h-2 bg-pink-400 rounded-full mt-2 flex-shrink-0"></span>
                            <span>스테이지가 높아질수록 더 많은 보너스 점수를 받습니다</span>
                        </div>
                    </div>
                </div>

                {/* 액션 버튼 */}
                <div className="space-y-3">
                    <button
                        onClick={onResume}
                        className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 
                                 text-white font-bold py-4 px-8 rounded-xl text-xl transition-all duration-300 
                                 transform hover:scale-105 shadow-lg hover:shadow-xl"
                    >
                        게임 계속하기
                    </button>

                    <div className="flex space-x-3">
                        <button
                            onClick={onRestart}
                            className="flex-1 bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 
                                     text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 
                                     transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            다시 시작
                        </button>
                        <button
                            onClick={onQuit}
                            className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 
                                     text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 
                                     transform hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                            메인 메뉴
                        </button>
                    </div>
                </div>

                {/* 키보드 단축키 안내 */}
                <div className="mt-6 text-xs text-gray-400">
                    <div>키보드 단축키: ESC (일시정지/계속), R (다시시작), Q (종료)</div>
                </div>
            </div>
        </div>
    );
};

export default PauseScreen;
