"use client";

import React from "react";

interface StreamingProgressProps {
    isStreaming: boolean;
    progress: number;
    currentBatch: number;
    totalBatches: number;
    totalWords: number;
    words: string[];
    topicName?: string;
    error?: string | null;
}

const StreamingProgress: React.FC<StreamingProgressProps> = ({
    isStreaming,
    progress,
    currentBatch,
    totalBatches,
    totalWords,
    words,
    topicName,
    error,
}) => {
    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
                <div className="flex items-center mb-4">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-sm">✕</span>
                    </div>
                    <h3 className="text-lg font-semibold text-red-800">오류 발생</h3>
                </div>
                <p className="text-red-600 mb-4">{error}</p>
            </div>
        );
    }

    if (!isStreaming && words.length === 0) {
        return null;
    }

    return (
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 max-w-2xl mx-auto shadow-lg border">
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-800">
                    {topicName ? `${topicName} 단어 생성` : "단어 생성"}
                </h3>
                {isStreaming && (
                    <div className="flex items-center text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        <span className="text-sm font-medium">생성 중...</span>
                    </div>
                )}
            </div>

            {/* 진행률 바 */}
            <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>진행률</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
            </div>

            {/* 통계 정보 */}
            <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{totalWords}</div>
                    <div className="text-sm text-gray-600">생성된 단어</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{currentBatch}</div>
                    <div className="text-sm text-gray-600">현재 배치</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">{totalBatches}</div>
                    <div className="text-sm text-gray-600">총 배치</div>
                </div>
            </div>

            {/* 최근 생성된 단어들 미리보기 */}
            {words.length > 0 && (
                <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">최근 생성된 단어들</h4>
                    <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                        <div className="flex flex-wrap gap-2">
                            {words.slice(-20).map((word, index) => (
                                <span
                                    key={index}
                                    className="inline-block bg-white px-2 py-1 rounded text-sm text-gray-700 border shadow-sm"
                                >
                                    {word}
                                </span>
                            ))}
                            {words.length > 20 && (
                                <span className="inline-block px-2 py-1 text-sm text-gray-500">
                                    ... 외 {words.length - 20}개
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* 완료 상태 */}
            {!isStreaming && words.length > 0 && (
                <div className="flex items-center justify-center p-3 bg-green-50 rounded-lg">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-sm">✓</span>
                    </div>
                    <span className="text-green-700 font-medium">
                        단어 생성 완료! 총 {totalWords}개의 단어가 생성되었습니다.
                    </span>
                </div>
            )}
        </div>
    );
};

export default StreamingProgress;
