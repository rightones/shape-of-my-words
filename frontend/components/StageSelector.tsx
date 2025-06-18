"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useDynamicTopics } from "../hooks/useDynamicTopics";
import { Topic } from "../types/words";

interface StageSelectorProps {
    topics: Topic[];
    onTopicSelect: (topicId: string, difficulty: string, stage: number) => void;
    onBack?: () => void;
}

const StageSelector: React.FC<StageSelectorProps> = ({ topics, onTopicSelect, onBack }) => {
    const [customTopic, setCustomTopic] = useState("");
    const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);

    const { generateTopics, error: dynamicError } = useDynamicTopics();

    // 별 반짝임 애니메이션
    useEffect(() => {
        const stars = document.querySelectorAll(".stage-star");
        stars.forEach((star) => {
            const delay = Math.random() * 3;
            const duration = 2 + Math.random() * 2;
            (star as HTMLElement).style.animationDelay = `${delay}s`;
            (star as HTMLElement).style.animationDuration = `${duration}s`;
        });
    }, []);

    // 커스텀 주제로 스테이지 생성
    const generateCustomStage = async (difficulty: string, stage: number) => {
        if (!customTopic.trim()) {
            alert("주제를 입력해주세요.");
            return;
        }

        setIsGeneratingCustom(true);
        try {
            const topics = await generateTopics(customTopic.trim(), difficulty, 1);
            if (topics.length > 0) {
                onTopicSelect(topics[0].id, difficulty, stage);
            }
        } catch (error) {
            console.error("커스텀 주제 생성 실패:", error);
            alert(dynamicError || "주제 생성에 실패했습니다. 다시 시도해주세요.");
        } finally {
            setIsGeneratingCustom(false);
        }
    };

    const handleCustomTopicKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            generateCustomStage("medium", 1);
        }
    };

    // 주제 카드 컴포넌트
    const TopicCard: React.FC<{ topic: Topic; index: number }> = ({ topic, index }) => {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-6 hover:bg-white/15 transition-all duration-300"
            >
                {/* 주제 제목 */}
                <div className="text-center mb-6">
                    <h3 className="text-xl font-medium text-white">{topic.topic}</h3>
                </div>

                {/* 3개 스테이지 버튼 - 가로 배치 */}
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={() => onTopicSelect(topic.id, "easy", 1)}
                        className="bg-white/20 hover:bg-white/30 text-white py-3 rounded-lg transition-all 
                                 hover:scale-105 active:scale-95 border border-white/30"
                    >
                        <div className="text-2xl mb-1">⭐</div>
                        <div className="text-sm">1</div>
                    </button>

                    <button
                        onClick={() => onTopicSelect(topic.id, "medium", 2)}
                        className="bg-white/20 hover:bg-white/30 text-white py-3 rounded-lg transition-all 
                                 hover:scale-105 active:scale-95 border border-white/30"
                    >
                        <div className="text-2xl mb-1">🌟</div>
                        <div className="text-sm">2</div>
                    </button>

                    <button
                        onClick={() => onTopicSelect(topic.id, "hard", 3)}
                        className="bg-white/20 hover:bg-white/30 text-white py-3 rounded-lg transition-all 
                                 hover:scale-105 active:scale-95 border border-white/30"
                    >
                        <div className="text-2xl mb-1">✨</div>
                        <div className="text-sm">3</div>
                    </button>
                </div>
            </motion.div>
        );
    };

    return (
        <div className="min-h-screen relative overflow-hidden bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-950">
            {/* 별들 배경 */}
            <div className="absolute inset-0 overflow-hidden">
                {Array.from({ length: 40 }).map((_, i) => (
                    <div
                        key={i}
                        className="stage-star absolute w-1 h-1 bg-white rounded-full opacity-60"
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
            <div className="absolute top-10 right-10 w-16 h-16 bg-yellow-100 rounded-full opacity-60 shadow-xl shadow-yellow-100/20"></div>

            <div className="relative z-10 container mx-auto px-4 py-8">
                {/* 헤더 */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-12"
                >
                    <h1 className="text-4xl font-light text-white mb-4 tracking-wide">주제 선택</h1>
                    <div className="h-px bg-gradient-to-r from-transparent via-white/30 to-transparent mb-4"></div>
                    <p className="text-blue-100">원하는 주제를 선택하고 스테이지를 시작하세요</p>
                </motion.div>

                {/* 기본 주제들 */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12 max-w-5xl mx-auto">
                        {topics.map((topic, index) => (
                            <TopicCard key={topic.id} topic={topic} index={index} />
                        ))}
                    </div>
                </motion.div>

                {/* 커스텀 주제 입력 */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 backdrop-blur-sm border border-white/20 rounded-lg p-8 mb-8 max-w-2xl mx-auto"
                >
                    <div className="text-center mb-6">
                        <h2 className="text-xl font-medium text-white mb-2">커스텀 주제</h2>
                        <p className="text-blue-100 text-sm">원하는 주제를 입력해보세요</p>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="text"
                            value={customTopic}
                            onChange={(e) => setCustomTopic(e.target.value)}
                            onKeyPress={handleCustomTopicKeyPress}
                            placeholder="예: 우주, 음식, 동물..."
                            className="w-full px-4 py-3 rounded-lg bg-white/10 backdrop-blur-sm text-white 
                                     placeholder-white/50 border border-white/30 focus:outline-none focus:border-white/50"
                            disabled={isGeneratingCustom}
                        />

                        {/* 커스텀 주제 스테이지 버튼들 */}
                        {customTopic.trim() && (
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => generateCustomStage("easy", 1)}
                                    disabled={isGeneratingCustom}
                                    className="bg-white/20 hover:bg-white/30 text-white py-3 rounded-lg transition-all 
                                             hover:scale-105 active:scale-95 border border-white/30 disabled:opacity-50"
                                >
                                    <div className="text-xl mb-1">⭐</div>
                                    <div className="text-sm">{isGeneratingCustom ? "..." : "1"}</div>
                                </button>
                                <button
                                    onClick={() => generateCustomStage("medium", 2)}
                                    disabled={isGeneratingCustom}
                                    className="bg-white/20 hover:bg-white/30 text-white py-3 rounded-lg transition-all 
                                             hover:scale-105 active:scale-95 border border-white/30 disabled:opacity-50"
                                >
                                    <div className="text-xl mb-1">🌟</div>
                                    <div className="text-sm">{isGeneratingCustom ? "..." : "2"}</div>
                                </button>
                                <button
                                    onClick={() => generateCustomStage("hard", 3)}
                                    disabled={isGeneratingCustom}
                                    className="bg-white/20 hover:bg-white/30 text-white py-3 rounded-lg transition-all 
                                             hover:scale-105 active:scale-95 border border-white/30 disabled:opacity-50"
                                >
                                    <div className="text-xl mb-1">✨</div>
                                    <div className="text-sm">{isGeneratingCustom ? "..." : "3"}</div>
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* 뒤로가기 버튼 */}
                {onBack && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                        <button
                            onClick={onBack}
                            className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-lg 
                                     border border-white/30 transition-all hover:scale-105 active:scale-95"
                        >
                            ← 돌아가기
                        </button>
                    </motion.div>
                )}
            </div>
        </div>
    );
};

export default StageSelector;
