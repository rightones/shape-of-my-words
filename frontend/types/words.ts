export interface Topic {
    id: string;
    name: string;
    description: string;
    prompt?: string;
}

export interface WordData {
    topic_id: string;
    topic_name: string;
    words: string[];
    total_count: number;
    from_cache: boolean;
    generated_at: number;
}

export interface WordRainItem {
    id: string;
    text: string;
    x: number;
    y: number;
    speed: number;
    size: number;
    opacity: number;
    color: string;
}

export interface TopicsResponse {
    topics: Topic[];
}

export interface ApiError {
    error: string;
}
