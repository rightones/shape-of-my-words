"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useDynamicTopics } from "../hooks/useDynamicTopics";

interface Topic {
    id: string;
    name: string;
    description: string;
    difficulty?: string;
    stage?: number;
    theme?: string;
    is_dynamic?: boolean;
}

interface StageSelectorProps {
    topics: Topic[];
    onTopicSelect: (topicId: string) => void;
    onBack?: () => void;
}

const StageSelector: React.FC<StageSelectorProps> = ({ topics, onTopicSelect, onBack }) => {
    const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
    const [selectedDifficulty, setSelectedDifficulty] = useState<string>("medium");
    const [dynamicTopics, setDynamicTopics] = useState<Topic[]>([]);
    const [showDynamicTopics, setShowDynamicTopics] = useState(false);

    const { generateTopics, isGenerating, error: dynamicError } = useDynamicTopics();

    // 기본 주제들을 스테이지 형태로 변환
    const defaultStages = topics.map((topic, index) => ({
        ...topic,
        stage: index + 1,
        difficulty: "medium",
        theme: "기본",
    }));

    // 테마 옵션들
    const themes = [
        { id: "fantasy", name: "🧙‍♂️ 판타지", description: "마법과 모험의 세계" },
        { id: "science", name: "🔬 과학", description: "과학과 기술의 세계" },
        { id: "nature", name: "🌿 자연", description: "자연과 생명의 세계" },
        { id: "space", name: "🚀 우주", description: "우주와 별들의 세계" },
        { id: "ocean", name: "🌊 바다", description: "바다와 해양생물의 세계" },
        { id: "food", name: "🍜 음식", description: "요리와 맛의 세계" },
        { id: "music", name: "🎵 음악", description: "음악과 리듬의 세계" },
        { id: "art", name: "🎨 예술", description: "창작과 표현의 세계" },
    ];

    // 난이도 옵션들
    const difficulties = [
        { id: "easy", name: "쉬움", color: "bg-green-500", description: "초보자용" },
        { id: "medium", name: "보통", color: "bg-yellow-500", description: "일반적인 수준" },
        { id: "hard", name: "어려움", color: "bg-red-500", description: "고급 수준" },
    ];

    // 동적 주제 생성
    const generateDynamicTopics = async (theme: string, difficulty: string) => {
        try {
            const themeName = themes.find((t) => t.id === theme)?.name.split(" ")[1] || theme;
            const topics = await generateTopics(themeName, difficulty, 6);
            setDynamicTopics(topics);
            setShowDynamicTopics(true);
        } catch (error) {
            console.error("동적 주제 생성 실패:", error);
            alert(dynamicError || "주제 생성에 실패했습니다. 다시 시도해주세요.");
        }
    };

    // 스테이지 카드 컴포넌트
    const StageCard: React.FC<{ topic: Topic; index: number }> = ({ topic, index }) => {
        const difficultyColor = {
            easy: "border-green-400 bg-green-50",
            medium: "border-yellow-400 bg-yellow-50",
            hard: "border-red-400 bg-red-50",
        }[topic.difficulty || "medium"];

        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className={`relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 ${difficultyColor} hover:shadow-lg`}
                onClick={() => onTopicSelect(topic.id)}
            >
                {/* 스테이지 번호 */}
                <div className="absolute -top-3 -left-3 w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {topic.stage}
                </div>

                {/* 난이도 배지 */}
                <div
                    className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-semibold ${
                        topic.difficulty === "easy"
                            ? "bg-green-500 text-white"
                            : topic.difficulty === "hard"
                            ? "bg-red-500 text-white"
                            : "bg-yellow-500 text-white"
                    }`}
                >
                    {difficulties.find((d) => d.id === topic.difficulty)?.name || "보통"}
                </div>

                {/* 주제 내용 */}
                <div className="mt-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{topic.name}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{topic.description}</p>
                </div>

                {/* 동적 주제 표시 */}
                {topic.is_dynamic && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-purple-500 text-white rounded-full text-xs font-semibold">
                        AI 생성
                    </div>
                )}
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
            <div className="max-w-6xl mx-auto">
                {/* 헤더 */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl font-bold text-white mb-4">🎮 스테이지 선택</h1>
                    <p className="text-xl text-blue-200">원하는 스테이지를 선택하여 단어 게임을 시작하세요!</p>
                </motion.div>

                {/* 탭 선택 */}
                <div className="flex justify-center mb-8">
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-1">
                        <button
                            onClick={() => setShowDynamicTopics(false)}
                            className={`px-6 py-3 rounded-md font-semibold transition-all ${
                                !showDynamicTopics ? "bg-white text-blue-900 shadow-lg" : "text-white hover:bg-white/20"
                            }`}
                        >
                            기본 스테이지
                        </button>
                        <button
                            onClick={() => setShowDynamicTopics(true)}
                            className={`px-6 py-3 rounded-md font-semibold transition-all ${
                                showDynamicTopics ? "bg-white text-blue-900 shadow-lg" : "text-white hover:bg-white/20"
                            }`}
                        >
                            AI 커스텀 스테이지
                        </button>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {!showDynamicTopics ? (
                        /* 기본 스테이지 */
                        <motion.div
                            key="default"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {defaultStages.map((topic, index) => (
                                    <StageCard key={topic.id} topic={topic} index={index} />
                                ))}
                            </div>
                        </motion.div>
                    ) : (
                        /* AI 커스텀 스테이지 */
                        <motion.div
                            key="dynamic"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            {dynamicTopics.length === 0 ? (
                                /* 테마 및 난이도 선택 */
                                <div className="space-y-8">
                                    {/* 테마 선택 */}
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-6 text-center">
                                            🎨 테마를 선택하세요
                                        </h2>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            {themes.map((theme) => (
                                                <motion.div
                                                    key={theme.id}
                                                    whileHover={{ scale: 1.05 }}
                                                    whileTap={{ scale: 0.95 }}
                                                    onClick={() => setSelectedTheme(theme.id)}
                                                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                                                        selectedTheme === theme.id
                                                            ? "bg-white text-blue-900 shadow-lg"
                                                            : "bg-white/10 text-white hover:bg-white/20"
                                                    }`}
                                                >
                                                    <div className="text-center">
                                                        <div className="text-2xl mb-2">{theme.name}</div>
                                                        <div className="text-sm opacity-80">{theme.description}</div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 난이도 선택 */}
                                    {selectedTheme && (
                                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                                            <h2 className="text-2xl font-bold text-white mb-6 text-center">
                                                ⚡ 난이도를 선택하세요
                                            </h2>
                                            <div className="flex justify-center gap-4">
                                                {difficulties.map((difficulty) => (
                                                    <motion.div
                                                        key={difficulty.id}
                                                        whileHover={{ scale: 1.05 }}
                                                        whileTap={{ scale: 0.95 }}
                                                        onClick={() => setSelectedDifficulty(difficulty.id)}
                                                        className={`p-4 rounded-lg cursor-pointer transition-all ${
                                                            selectedDifficulty === difficulty.id
                                                                ? "bg-white text-blue-900 shadow-lg"
                                                                : "bg-white/10 text-white hover:bg-white/20"
                                                        }`}
                                                    >
                                                        <div className="text-center">
                                                            <div className="font-bold mb-1">{difficulty.name}</div>
                                                            <div className="text-sm opacity-80">
                                                                {difficulty.description}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}

                                    {/* 생성 버튼 */}
                                    {selectedTheme && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="text-center"
                                        >
                                            <button
                                                onClick={() => generateDynamicTopics(selectedTheme, selectedDifficulty)}
                                                disabled={isGenerating}
                                                className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isGenerating ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                        AI가 스테이지를 생성 중...
                                                    </div>
                                                ) : (
                                                    "🤖 AI 스테이지 생성하기"
                                                )}
                                            </button>
                                        </motion.div>
                                    )}
                                </div>
                            ) : (
                                /* 생성된 동적 스테이지 */
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-2xl font-bold text-white">🤖 AI가 생성한 스테이지</h2>
                                        <button
                                            onClick={() => {
                                                setDynamicTopics([]);
                                                setSelectedTheme(null);
                                            }}
                                            className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
                                        >
                                            다시 생성하기
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {dynamicTopics.map((topic, index) => (
                                            <StageCard key={topic.id} topic={topic} index={index} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* 뒤로가기 버튼 */}
                {onBack && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mt-12">
                        <button
                            onClick={onBack}
                            className="px-6 py-3 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-all"
                        >
                            ← 메인으로 돌아가기
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default StageSelector;
