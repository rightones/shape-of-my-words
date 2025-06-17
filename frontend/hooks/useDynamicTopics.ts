import { useState, useCallback } from "react";

interface Topic {
    id: string;
    name: string;
    description: string;
    difficulty?: string;
    stage?: number;
    theme?: string;
    is_dynamic?: boolean;
}

interface DynamicTopicsResponse {
    topics: Topic[];
    theme: string;
    difficulty: string;
    generated_at: number;
    total_count: number;
}

interface UseDynamicTopicsReturn {
    generateTopics: (theme: string, difficulty: string, count?: number) => Promise<Topic[]>;
    isGenerating: boolean;
    error: string | null;
}

export const useDynamicTopics = (): UseDynamicTopicsReturn => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateTopics = useCallback(
        async (theme: string, difficulty: string, count: number = 6): Promise<Topic[]> => {
            setIsGenerating(true);
            setError(null);

            try {
                const response = await fetch("http://localhost:5001/topics/generate", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        theme,
                        difficulty,
                        count,
                    }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || "주제 생성에 실패했습니다.");
                }

                const data: DynamicTopicsResponse = await response.json();
                return data.topics;
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.";
                setError(errorMessage);
                throw err;
            } finally {
                setIsGenerating(false);
            }
        },
        [],
    );

    return {
        generateTopics,
        isGenerating,
        error,
    };
};
