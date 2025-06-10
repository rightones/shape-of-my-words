export interface GameState {
    currentStage: number;
    score: number;
    lives: number;
    wordsCompleted: number;
    shapesCreated: number;
    timeElapsed: number;
    isGameOver: boolean;
    isPaused: boolean;
    targetShapes: number;
}

export interface StageConfig {
    stage: number;
    targetShapes: number;
    wordSpeed: number;
    wordSpawnRate: number;
    maxWords: number;
    timeLimit?: number;
    description: string;
}

export interface ScoreBreakdown {
    shapeScore: number;
    timeBonus: number;
    accuracyBonus: number;
    stageBonus: number;
    total: number;
}

export interface FallingWord {
    word: string;
    x: number;
    y: number;
    speed: number;
    opacity: number;
    size: number;
    color: string;
    id: string;
}

export interface GameStats {
    totalScore: number;
    stagesCompleted: number;
    shapesCreated: number;
    wordsTyped: number;
    accuracy: number;
    playTime: number;
}
