"use client";

import React, { useState } from "react";
import WordRainApp from "./WordRainApp";
import IntegratedWordGame from "./IntegratedWordGame";

type AppMode = "selection" | "word-rain" | "game";

const MainApp: React.FC = () => {
    const [appMode, setAppMode] = useState<AppMode>("selection");

    const handleModeSelect = (mode: AppMode) => {
        setAppMode(mode);
    };

    const handleBackToSelection = () => {
        setAppMode("selection");
    };

    if (appMode === "word-rain") {
        return <WordRainApp onBack={handleBackToSelection} />;
    }

    if (appMode === "game") {
        return <IntegratedWordGame onBack={handleBackToSelection} />;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            <div className="container mx-auto px-4 py-8">
                {/* 헤더 */}
                <header className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-gray-800 mb-4">Shape of My Words</h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        단어들의 형태를 시각화하는 두 가지 방법을 선택해보세요
                    </p>
                </header>

                {/* 모드 선택 */}
                <main className="max-w-4xl mx-auto">
                    <div className="grid md:grid-cols-2 gap-8">
                        {/* 단어 비 모드 */}
                        <div
                            onClick={() => handleModeSelect("word-rain")}
                            className="bg-white rounded-xl shadow-lg p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-blue-300"
                        >
                            <div className="text-center">
                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-3xl">🌧️</span>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">단어 비</h2>
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    주제를 선택하면 AI가 실시간으로 생성하는 단어들이 비처럼 화면에 떨어집니다. 아름다운
                                    애니메이션을 감상하며 다양한 단어들을 만나보세요.
                                </p>
                                <div className="space-y-2 text-sm text-gray-500">
                                    <div className="flex items-center justify-center">
                                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                                        실시간 AI 단어 생성
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                                        즉시 시작, 기다림 없음
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                                        8가지 주제 선택
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 게임 모드 */}
                        <div
                            onClick={() => handleModeSelect("game")}
                            className="bg-white rounded-xl shadow-lg p-8 cursor-pointer transform transition-all duration-300 hover:scale-105 hover:shadow-xl border-2 border-transparent hover:border-purple-300"
                        >
                            <div className="text-center">
                                <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="text-3xl">🎮</span>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-800 mb-4">단어 게임</h2>
                                <p className="text-gray-600 mb-6 leading-relaxed">
                                    떨어지는 단어들을 입력하여 점수를 얻고, 4개의 단어로 도형을 만들어보세요.
                                    스테이지별로 난이도가 증가하는 도전적인 게임입니다.
                                </p>
                                <div className="space-y-2 text-sm text-gray-500">
                                    <div className="flex items-center justify-center">
                                        <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                                        단어 입력 게임플레이
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                                        도형 생성 및 물리 시뮬레이션
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                                        스테이지별 도전
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 추가 정보 */}
                    <div className="mt-12 text-center">
                        <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">💡 어떤 모드를 선택할까요?</h3>
                            <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
                                <div>
                                    <strong className="text-blue-600">단어 비</strong>는 편안하게 감상하며 새로운
                                    단어들을 발견하고 싶을 때 추천합니다.
                                </div>
                                <div>
                                    <strong className="text-purple-600">단어 게임</strong>은 도전적인 게임플레이와
                                    타이핑 실력 향상을 원할 때 추천합니다.
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* 푸터 */}
                <footer className="text-center mt-16 text-gray-500 text-sm">
                    <p>OpenRouter API를 통해 생성된 단어들로 만든 인터랙티브 경험</p>
                </footer>
            </div>
        </div>
    );
};

export default MainApp;
