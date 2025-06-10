"use client";

import React from "react";
import { Topic } from "../types/words";

interface TopicSelectorProps {
    topics: Topic[];
    selectedTopic: string | null;
    onTopicSelect: (topicId: string) => void;
    loading?: boolean;
    error?: string | null;
}

const TopicSelector: React.FC<TopicSelectorProps> = ({
    topics,
    selectedTopic,
    onTopicSelect,
    loading = false,
    error = null,
}) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-3 text-gray-600">주제를 불러오는 중...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">오류: {error}</p>
            </div>
        );
    }

    return (
        <div className="w-full max-w-4xl mx-auto p-6">
            <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">주제를 선택해주세요</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {topics.map((topic) => (
                    <button
                        key={topic.id}
                        onClick={() => onTopicSelect(topic.id)}
                        className={`
              p-4 rounded-lg border-2 transition-all duration-200 text-left
              hover:shadow-lg hover:scale-105 transform
              ${
                  selectedTopic === topic.id
                      ? "border-blue-500 bg-blue-50 shadow-md"
                      : "border-gray-200 bg-white hover:border-blue-300"
              }
            `}
                    >
                        <h3 className="font-semibold text-lg mb-2 text-gray-800">{topic.name}</h3>
                        <p className="text-sm text-gray-600 leading-relaxed">{topic.description}</p>
                    </button>
                ))}
            </div>

            {selectedTopic && (
                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        선택된 주제:{" "}
                        <span className="font-semibold text-blue-600">
                            {topics.find((t) => t.id === selectedTopic)?.name}
                        </span>
                    </p>
                </div>
            )}
        </div>
    );
};

export default TopicSelector;
