import { useState, useCallback, useRef } from "react";

interface StreamingWordData {
    type: "start" | "batch" | "complete" | "error";
    topic_name?: string;
    total_batches?: number;
    batch_number?: number;
    words?: string[];
    total_words_so_far?: number;
    progress?: number;
    total_words?: number;
    all_words?: string[];
    message?: string;
    error?: string;
}

interface UseStreamingWordsReturn {
    words: string[];
    isStreaming: boolean;
    progress: number;
    error: string | null;
    totalWords: number;
    currentBatch: number;
    totalBatches: number;
    startStreaming: (topicId: string, batchSize?: number, totalBatches?: number) => void;
    stopStreaming: () => void;
    reset: () => void;
}

const API_BASE_URL = "http://localhost:5001";

export const useStreamingWords = (): UseStreamingWordsReturn => {
    const [words, setWords] = useState<string[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [totalWords, setTotalWords] = useState(0);
    const [currentBatch, setCurrentBatch] = useState(0);
    const [totalBatches, setTotalBatches] = useState(0);

    const eventSourceRef = useRef<EventSource | null>(null);

    const startStreaming = useCallback((topicId: string, batchSize: number = 20, totalBatches: number = 10) => {
        // 기존 스트리밍이 있다면 중단
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
        }

        // 상태 초기화
        setWords([]);
        setProgress(0);
        setError(null);
        setTotalWords(0);
        setCurrentBatch(0);
        setTotalBatches(totalBatches);
        setIsStreaming(true);

        // EventSource 생성
        const url = `${API_BASE_URL}/words/${topicId}/stream?batch_size=${batchSize}&total_batches=${totalBatches}`;
        const eventSource = new EventSource(url);
        eventSourceRef.current = eventSource;

        eventSource.onmessage = (event) => {
            try {
                const data: StreamingWordData = JSON.parse(event.data);

                switch (data.type) {
                    case "start":
                        console.log(`스트리밍 시작: ${data.topic_name}`);
                        setTotalBatches(data.total_batches || totalBatches);
                        break;

                    case "batch":
                        if (data.words) {
                            setWords((prev) => [...prev, ...data.words!]);
                            setTotalWords(data.total_words_so_far || 0);
                            setCurrentBatch(data.batch_number || 0);
                            setProgress(data.progress || 0);
                            console.log(`배치 ${data.batch_number} 수신: ${data.words.length}개 단어`);
                        }
                        break;

                    case "complete":
                        console.log(`스트리밍 완료: 총 ${data.total_words}개 단어`);
                        setTotalWords(data.total_words || 0);
                        setProgress(100);
                        setIsStreaming(false);
                        eventSource.close();
                        break;

                    case "error":
                        console.error("스트리밍 오류:", data.message);
                        setError(data.message || "알 수 없는 오류가 발생했습니다.");
                        setIsStreaming(false);
                        eventSource.close();
                        break;
                }
            } catch (err) {
                console.error("이벤트 파싱 오류:", err);
                setError("데이터 파싱 중 오류가 발생했습니다.");
            }
        };

        eventSource.onerror = (event) => {
            console.error("EventSource 오류:", event);
            setError("연결 오류가 발생했습니다.");
            setIsStreaming(false);
            eventSource.close();
        };

        eventSource.onopen = () => {
            console.log("스트리밍 연결 성공");
        };
    }, []);

    const stopStreaming = useCallback(() => {
        if (eventSourceRef.current) {
            eventSourceRef.current.close();
            eventSourceRef.current = null;
        }
        setIsStreaming(false);
    }, []);

    const reset = useCallback(() => {
        stopStreaming();
        setWords([]);
        setProgress(0);
        setError(null);
        setTotalWords(0);
        setCurrentBatch(0);
        setTotalBatches(0);
    }, [stopStreaming]);

    return {
        words,
        isStreaming,
        progress,
        error,
        totalWords,
        currentBatch,
        totalBatches,
        startStreaming,
        stopStreaming,
        reset,
    };
};
