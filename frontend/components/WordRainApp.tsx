"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useTopics } from "../hooks/useWords";
import { useStreamingWords } from "../hooks/useStreamingWords";
import TopicSelector from "./TopicSelector";
import WordRain from "./WordRain";
import StreamingProgress from "./StreamingProgress";

interface WordRainAppProps {
    onBack?: () => void;
}

const WordRainApp: React.FC<WordRainAppProps> = ({ onBack }) => {
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [isRainActive, setIsRainActive] = useState(false);
    const [topicName, setTopicName] = useState<string>("");

    const { topics, loading: topicsLoading, error: topicsError } = useTopics();
    const {
        words,
        isStreaming,
        progress,
        error: streamingError,
        totalWords,
        currentBatch,
        totalBatches,
        startStreaming,
        stopStreaming,
        reset,
    } = useStreamingWords();

    const handleTopicSelect = useCallback(
        async (topicId: string) => {
            const topic = topics.find((t) => t.id === topicId);
            if (!topic) return;

            setSelectedTopic(topicId);
            setTopicName(topic.name);
            setIsRainActive(true); // 즉시 비 시작

            // 스트리밍 시작 (배치 크기 20, 총 15배치 = 300개 단어)
            startStreaming(topicId, 20, 15);
        },
        [topics, startStreaming],
    );

    const handleToggleRain = useCallback(() => {
        setIsRainActive((prev) => !prev);
    }, []);

    const handleBackToTopics = useCallback(() => {
        setSelectedTopic(null);
        setTopicName("");
        setIsRainActive(false);
        stopStreaming();
        reset();
    }, [stopStreaming, reset]);

    const handleBackToMain = useCallback(() => {
        if (onBack) {
            onBack();
        } else {
            handleBackToTopics();
        }
    }, [onBack, handleBackToTopics]);

    const handleStopStreaming = useCallback(() => {
        stopStreaming();
    }, [stopStreaming]);

    // 단어가 생성되기 시작하면 자동으로 비 활성화
    useEffect(() => {
        if (words.length > 0 && !isRainActive && selectedTopic) {
            setIsRainActive(true);
        }
    }, [words.length, isRainActive, selectedTopic]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
            {/* 배경 단어 비 */}
            {words.length > 0 && (
                <div className="fixed inset-0 z-0">
                    <WordRain words={words} isActive={isRainActive} />
                </div>
            )}

            {/* 메인 콘텐츠 */}
            <div className="relative z-10 min-h-screen">
                {/* 헤더 */}
                <header className="p-6 text-center">
                    <div className="flex items-center justify-between mb-4">
                        {onBack && (
                            <button
                                onClick={handleBackToMain}
                                className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                            >
                                ← 메인으로
                            </button>
                        )}
                        <div className="flex-1">
                            <h1 className="text-4xl font-bold text-gray-800 mb-2">단어 비</h1>
                            <p className="text-gray-600">
                                주제를 선택하면 즉시 단어 비가 시작되고 실시간으로 새로운 단어들이 추가됩니다
                            </p>
                        </div>
                        <div className="w-20"></div> {/* 균형을 위한 공간 */}
                    </div>
                </header>

                {/* 메인 콘텐츠 영역 */}
                <main className="container mx-auto px-4">
                    {!selectedTopic ? (
                        /* 주제 선택 화면 */
                        <TopicSelector
                            topics={topics}
                            selectedTopic={selectedTopic}
                            onTopicSelect={handleTopicSelect}
                            loading={topicsLoading}
                            error={topicsError}
                        />
                    ) : (
                        /* 스트리밍 및 단어 비 화면 */
                        <div className="space-y-6">
                            {/* 스트리밍 진행 상황 */}
                            <StreamingProgress
                                isStreaming={isStreaming}
                                progress={progress}
                                currentBatch={currentBatch}
                                totalBatches={totalBatches}
                                totalWords={totalWords}
                                words={words}
                                topicName={topicName}
                                error={streamingError}
                            />

                            {/* 컨트롤 버튼들 */}
                            <div className="text-center">
                                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto shadow-lg">
                                    <div className="flex flex-wrap justify-center gap-3">
                                        <button
                                            onClick={handleToggleRain}
                                            disabled={words.length === 0}
                                            className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                                                words.length === 0
                                                    ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                    : isRainActive
                                                    ? "bg-red-500 hover:bg-red-600 text-white"
                                                    : "bg-blue-500 hover:bg-blue-600 text-white"
                                            }`}
                                        >
                                            {isRainActive ? "단어 비 멈추기" : "단어 비 시작하기"}
                                        </button>

                                        {isStreaming && (
                                            <button
                                                onClick={handleStopStreaming}
                                                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors"
                                            >
                                                생성 중단
                                            </button>
                                        )}

                                        <button
                                            onClick={handleBackToTopics}
                                            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                                        >
                                            다른 주제 선택
                                        </button>
                                    </div>

                                    {/* 실시간 통계 */}
                                    {words.length > 0 && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                                                <div>
                                                    <div className="text-lg font-bold text-blue-600">
                                                        {words.length}
                                                    </div>
                                                    <div className="text-sm text-gray-600">사용 가능한 단어</div>
                                                </div>
                                                <div>
                                                    <div className="text-lg font-bold text-green-600">
                                                        {isStreaming ? "생성 중" : "완료"}
                                                    </div>
                                                    <div className="text-sm text-gray-600">상태</div>
                                                </div>
                                                <div>
                                                    <div className="text-lg font-bold text-purple-600">
                                                        {Math.round(progress)}%
                                                    </div>
                                                    <div className="text-sm text-gray-600">진행률</div>
                                                </div>
                                                <div>
                                                    <div className="text-lg font-bold text-orange-600">
                                                        {isRainActive ? "활성" : "비활성"}
                                                    </div>
                                                    <div className="text-sm text-gray-600">단어 비</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* 안내 메시지 */}
                            {words.length === 0 && !isStreaming && !streamingError && (
                                <div className="text-center">
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
                                        <p className="text-blue-800">단어 생성을 시작하려면 잠시만 기다려주세요...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default WordRainApp;
