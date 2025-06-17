import { StageConfig, ScoreBreakdown } from "../types/game";

export const STAGE_CONFIGS: StageConfig[] = [
    {
        stage: 1,
        targetShapes: 3,
        wordSpeed: 1.5,
        wordSpawnRate: 300, // 진짜 비처럼! 0.3초마다
        maxWords: 50, // 화면에 최대 50개
        description: "기본 단어들로 시작해보세요",
    },
    {
        stage: 2,
        targetShapes: 5,
        wordSpeed: 2.0,
        wordSpawnRate: 250, // 0.25초마다
        maxWords: 60, // 화면에 최대 60개
        description: "조금 더 빠르게!",
    },
    {
        stage: 3,
        targetShapes: 7,
        wordSpeed: 2.5,
        wordSpawnRate: 200, // 0.2초마다
        maxWords: 70, // 화면에 최대 70개
        description: "속도가 빨라집니다",
    },
    {
        stage: 4,
        targetShapes: 10,
        wordSpeed: 3.0,
        wordSpawnRate: 150, // 0.15초마다
        maxWords: 80, // 화면에 최대 80개
        timeLimit: 180,
        description: "시간 제한이 추가됩니다!",
    },
    {
        stage: 5,
        targetShapes: 15,
        wordSpeed: 3.5,
        wordSpawnRate: 100, // 0.1초마다 - 진짜 폭우!
        maxWords: 100, // 화면에 최대 100개
        timeLimit: 150,
        description: "마스터 레벨에 도전하세요",
    },
];

export const getStageConfig = (stage: number): StageConfig => {
    const config = STAGE_CONFIGS.find((s) => s.stage === stage);
    if (!config) {
        // 5스테이지 이후는 난이도가 계속 증가
        const baseConfig = STAGE_CONFIGS[STAGE_CONFIGS.length - 1];
        return {
            ...baseConfig,
            stage,
            targetShapes: baseConfig.targetShapes + (stage - 5) * 3,
            wordSpeed: Math.min(baseConfig.wordSpeed + (stage - 5) * 0.3, 5.0),
            wordSpawnRate: Math.max(baseConfig.wordSpawnRate - (stage - 5) * 100, 800),
            maxWords: Math.min(baseConfig.maxWords + (stage - 5) * 2, 20),
            timeLimit: Math.max((baseConfig.timeLimit || 150) - (stage - 5) * 10, 60),
            description: `스테이지 ${stage} - 극한의 도전!`,
        };
    }
    return config;
};

export const calculateScore = (
    shapeHeight: number,
    timeElapsed: number,
    stage: number,
    wordsTyped: number,
    totalWords: number,
): ScoreBreakdown => {
    // 기본 도형 점수 (높이에 따라)
    const shapeScore = Math.max(10, Math.floor((600 - shapeHeight) / 5));

    // 시간 보너스 (빠를수록 높은 점수)
    const timeBonus = Math.max(0, Math.floor((300 - timeElapsed) / 10));

    // 정확도 보너스
    const accuracy = totalWords > 0 ? wordsTyped / totalWords : 0;
    const accuracyBonus = Math.floor(accuracy * 100);

    // 스테이지 보너스
    const stageBonus = stage * 50;

    const total = shapeScore + timeBonus + accuracyBonus + stageBonus;

    return {
        shapeScore,
        timeBonus,
        accuracyBonus,
        stageBonus,
        total,
    };
};

export const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
};

export const getStageTitle = (stage: number): string => {
    const titles = ["첫 걸음", "워밍업", "가속화", "시간과의 경주", "마스터 도전", "전설의 시작"];

    if (stage <= titles.length) {
        return titles[stage - 1];
    }

    return `무한 도전 ${stage - 5}`;
};
