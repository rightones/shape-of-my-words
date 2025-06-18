"use client";

import React, { useState, useEffect } from "react";
import IntegratedWordGame from "./IntegratedWordGame";
import NicknameInput from "./NicknameInput";
import Leaderboard from "./Leaderboard";
import { useUserScore } from "../hooks/useUserScore";

type AppMode = "selection" | "game";

const MainApp: React.FC = () => {
    const [appMode, setAppMode] = useState<AppMode>("selection");
    const [showNicknameInput, setShowNicknameInput] = useState(false);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const { currentUser, logout } = useUserScore();

    const handleModeSelect = (mode: AppMode) => {
        setAppMode(mode);
    };

    const handleBackToSelection = () => {
        setAppMode("selection");
    };

    // 별 반짝임 애니메이션
    useEffect(() => {
        const stars = document.querySelectorAll(".star");
        stars.forEach((star) => {
            const delay = Math.random() * 3;
            const duration = 2 + Math.random() * 2;
            (star as HTMLElement).style.animationDelay = `${delay}s`;
            (star as HTMLElement).style.animationDuration = `${duration}s`;
        });
    }, []);

    if (appMode === "game") {
        return <IntegratedWordGame onBack={handleBackToSelection} />;
    }

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-950">
            {/* 별들 배경 */}
            <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 50 }).map((_, i) => (
                    <div
                        key={i}
                        className="star absolute w-1 h-1 bg-white rounded-full opacity-80"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            animationName: "twinkle",
                            animationTimingFunction: "ease-in-out",
                            animationIterationCount: "infinite",
                        }}
                    />
                ))}
            </div>

            {/* 달 */}
            <div className="absolute top-10 right-10 w-20 h-20 bg-yellow-100 rounded-full opacity-80 shadow-2xl shadow-yellow-100/30"></div>

            <div className="relative z-10 container mx-auto px-4 py-8">
                {/* 헤더 */}
                <header className="text-center mb-16 relative">
                    <div className="flex justify-between items-start mb-8">
                        {/* 플레이어 정보 */}
                        <div className="flex items-center space-x-4">
                            {currentUser ? (
                                <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 shadow-lg">
                                    <div className="text-xs text-blue-200 uppercase tracking-wide">플레이어</div>
                                    <div className="font-semibold text-white">{currentUser}</div>
                                    <button
                                        onClick={logout}
                                        className="text-xs text-red-300 hover:text-red-200 transition-colors mt-1"
                                    >
                                        로그아웃
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setShowNicknameInput(true)}
                                    className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg 
                                             border border-white/30 transition-all text-sm
                                             hover:scale-105 active:scale-95"
                                >
                                    닉네임 설정
                                </button>
                            )}
                        </div>

                        {/* 리더보드 버튼 */}
                        <button
                            onClick={() => setShowLeaderboard(true)}
                            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg 
                                     border border-white/30 transition-all text-sm flex items-center space-x-2
                                     hover:scale-105 active:scale-95"
                        >
                            <span>🏆</span>
                            <span>순위표</span>
                        </button>
                    </div>

                    {/* 게임 타이틀 */}
                    <div className="mb-8">
                        <h1 className="text-5xl md:text-7xl font-light text-white mb-4 tracking-wide">
                            Shape of My Words
                        </h1>
                        <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-6"></div>
                        <p className="text-lg text-blue-100 leading-relaxed max-w-2xl mx-auto">
                            밤하늘에 떨어지는 단어들을 입력하여
                            <br />
                            아름다운 별자리를 만들어보세요
                        </p>
                    </div>
                </header>

                {/* 게임 시작 영역 */}
                <main className="max-w-2xl mx-auto">
                    <div className="text-center mb-12">
                        {/* 단순한 게임 시작 버튼 */}
                        <button
                            onClick={() => handleModeSelect("game")}
                            className="group bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white 
                                     px-12 py-6 rounded-2xl border border-white/30 hover:border-white/50
                                     transition-all duration-300 text-xl font-medium
                                     hover:scale-105 active:scale-95 shadow-2xl hover:shadow-white/10"
                        >
                            <div className="flex items-center justify-center space-x-3">
                                <span className="text-2xl">✨</span>
                                <span>게임 시작</span>
                            </div>
                        </button>
                    </div>

                    {/* 게임 설명 카드들 */}
                    <div className="grid md:grid-cols-3 gap-6 mb-12">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-center">
                            <div className="text-3xl mb-3">⌨️</div>
                            <h3 className="text-white font-medium mb-2">단어 입력</h3>
                            <p className="text-blue-100 text-sm">떨어지는 단어를 정확히 입력하여 점수를 획득하세요</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-center">
                            <div className="text-3xl mb-3">🔷</div>
                            <h3 className="text-white font-medium mb-2">도형 생성</h3>
                            <p className="text-blue-100 text-sm">4개의 단어를 모으면 아름다운 도형이 만들어집니다</p>
                        </div>

                        <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-center">
                            <div className="text-3xl mb-3">🎯</div>
                            <h3 className="text-white font-medium mb-2">도전</h3>
                            <p className="text-blue-100 text-sm">스테이지를 진행하며 더 높은 점수에 도전해보세요</p>
                        </div>
                    </div>

                    {/* 게임 방법 */}
                    <div className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-6 text-center">
                        <h3 className="text-white font-medium mb-4">🌟 게임 방법</h3>
                        <div className="space-y-2 text-blue-100 text-sm">
                            <p>화면에 떨어지는 단어들을 키보드로 정확하게 입력하세요</p>
                            <p>단어를 성공적으로 입력하면 점수를 획득하고 별이 생성됩니다</p>
                            <p>4개의 별을 모으면 아름다운 별자리가 완성됩니다</p>
                        </div>
                    </div>
                </main>

                {/* 푸터 */}
                <footer className="text-center mt-16">
                    <div className="text-blue-200/60 text-sm">✦ AI가 생성한 단어들로 만드는 인터랙티브 경험 ✦</div>
                </footer>
            </div>

            {/* 모달들 */}
            <NicknameInput
                isOpen={showNicknameInput}
                onClose={() => setShowNicknameInput(false)}
                onSuccess={() => {
                    // 닉네임 설정 성공 시 추가 로직
                }}
            />
            <Leaderboard isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />
        </div>
    );
};

export default MainApp;
