import { useState, useEffect, useCallback } from "react";
import { Topic, WordData, TopicsResponse, ApiError } from "../types/words";

const API_BASE_URL = "http://localhost:5001";

export const useTopics = () => {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTopics = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_BASE_URL}/topics`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: TopicsResponse = await response.json();
            setTopics(data.topics);
        } catch (err) {
            setError(err instanceof Error ? err.message : "주제 목록을 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTopics();
    }, [fetchTopics]);

    return { topics, loading, error, refetch: fetchTopics };
};

export const useWords = () => {
    const [wordData, setWordData] = useState<WordData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateWords = useCallback(async (topicId: string, count: number = 500, useCache: boolean = true) => {
        try {
            setLoading(true);
            setError(null);

            const params = new URLSearchParams({
                count: count.toString(),
                use_cache: useCache.toString(),
            });

            const response = await fetch(`${API_BASE_URL}/words/${topicId}?${params}`);

            if (!response.ok) {
                const errorData: ApiError = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const data: WordData = await response.json();
            setWordData(data);
            return data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "단어 생성에 실패했습니다.";
            setError(errorMessage);
            throw new Error(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    const clearCache = useCallback(async (topicId?: string) => {
        try {
            const url = topicId ? `${API_BASE_URL}/words/${topicId}/cache` : `${API_BASE_URL}/cache`;

            const response = await fetch(url, { method: "DELETE" });

            if (!response.ok) {
                const errorData: ApiError = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "캐시 삭제에 실패했습니다.";
            setError(errorMessage);
            throw new Error(errorMessage);
        }
    }, []);

    return {
        wordData,
        loading,
        error,
        generateWords,
        clearCache,
        clearError: () => setError(null),
    };
};
