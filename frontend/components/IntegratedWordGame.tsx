"use client";

import React, { useRef, useEffect, useState, useCallback, memo } from "react";
import { getVectorOfWord } from "../app/action";
import { useTopics } from "../hooks/useWords";
import { useStreamingWords } from "../hooks/useStreamingWords";
import TopicSelector from "./TopicSelector";
import StageSelector from "./StageSelector";
import GameHUD from "./GameHUD";
import StageStart from "./StageStart";
import StageComplete from "./StageComplete";
import GameOver from "./GameOver";
import PauseScreen from "./PauseScreen";
import StreamingProgress from "./StreamingProgress";
import { GameState, FallingWord, GameStats, ScoreBreakdown } from "../types/game";
import { getStageConfig, calculateScore } from "../utils/gameConfig";

/* eslint-disable @typescript-eslint/no-explicit-any */

// 게임 상태 열거형
enum GamePhase {
    STAGE_SELECTION = "stage_selection",
    TOPIC_SELECTION = "topic_selection",
    STAGE_START = "stage_start",
    PLAYING = "playing",
    STAGE_COMPLETE = "stage_complete",
    GAME_OVER = "game_over",
    PAUSED = "paused",
}

interface IntegratedWordGameProps {
    onBack?: () => void;
}

const IntegratedWordGame: React.FC<IntegratedWordGameProps> = ({ onBack }) => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const p5Instance = useRef<any | null>(null);
    const matterRef = useRef<{
        engine: any | null;
        world: any | null;
        ground: any | null;
    }>({ engine: null, world: null, ground: null });

    // 동적 import를 위한 refs
    const p5Lib = useRef<any>(null);
    const MatterLib = useRef<any>(null);

    // 게임 상태
    const [gamePhase, setGamePhase] = useState<GamePhase>(GamePhase.STAGE_SELECTION);
    const [gameState, setGameState] = useState<GameState>({
        currentStage: 1,
        score: 0,
        lives: 3,
        wordsCompleted: 0,
        shapesCreated: 0,
        timeElapsed: 0,
        isGameOver: false,
        isPaused: false,
        targetShapes: 3,
    });

    // 게임 통계
    const [gameStats, setGameStats] = useState<GameStats>({
        totalScore: 0,
        stagesCompleted: 0,
        shapesCreated: 0,
        wordsTyped: 0,
        accuracy: 100,
        playTime: 0,
    });

    // 현재 스테이지 설정
    const [currentStageConfig, setCurrentStageConfig] = useState(getStageConfig(1));
    const [stageStartTime, setStageStartTime] = useState(0);
    const [lastScoreBreakdown, setLastScoreBreakdown] = useState<ScoreBreakdown | null>(null);

    // 게임 플레이 상태
    const [inputWords, setInputWords] = useState<string[]>([]);
    const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
    const [wordInput, setWordInput] = useState("");
    const [vectorToShow, setVectorToShow] = useState<[number, number] | null>(null);
    const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
    const [totalWordsAttempted, setTotalWordsAttempted] = useState(0);

    // 훅 사용
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
    } = useStreamingWords();

    // refs
    const shapesRef = useRef<any[]>([]);
    const backgroundStars = useRef<{ x: number; y: number; size: number }[]>([]);
    const fallingWords = useRef<FallingWord[]>([]);
    const availableWords = useRef<string[]>([]);
    const gameTimerRef = useRef<NodeJS.Timeout | null>(null);
    const wordSpawnTimerRef = useRef<NodeJS.Timeout | null>(null);
    const pointsRef = useRef<{ x: number; y: number }[]>([]);
    const inputWordsRef = useRef<string[]>([]);

    // 라이브러리 로딩 상태
    const [librariesLoaded, setLibrariesLoaded] = useState(false);

    // 라이브러리 동적 로딩
    useEffect(() => {
        const loadLibraries = async () => {
            try {
                const [p5Module, matterModule] = await Promise.all([import("p5"), import("matter-js")]);

                p5Lib.current = p5Module.default;
                MatterLib.current = matterModule.default;
                setLibrariesLoaded(true);
            } catch (error) {
                console.error("라이브러리 로딩 실패:", error);
            }
        };

        if (typeof window !== "undefined") {
            loadLibraries();
        }
    }, []);

    // 랜덤 색상 생성
    const getRandomColor = useCallback(() => {
        const colors = ["#3B82F6", "#10B981", "#8B5CF6", "#F59E0B", "#EF4444", "#06B6D4", "#84CC16", "#EC4899"];
        return colors[Math.floor(Math.random() * colors.length)];
    }, []);

    // 떨어지는 단어 추가
    const addFallingWord = useCallback(
        (word: string) => {
            if (fallingWords.current.length >= currentStageConfig.maxWords) {
                return;
            }

            fallingWords.current.push({
                word,
                x: Math.random() * 700 + 50, // 화면 가장자리 여백 확보
                y: Math.random() * -300 - 100, // 시작 높이 조정
                speed: Math.random() * 0.8 + currentStageConfig.wordSpeed, // 속도 조정
                opacity: Math.random() * 0.3 + 0.8, // 더 선명하게
                size: Math.random() * 4 + 16, // 텍스트 크기 증가
                color: getRandomColor(),
                id: `${word}-${Date.now()}-${Math.random()}`,
            });
        },
        [getRandomColor, currentStageConfig],
    );

    // 게임 오버 처리
    const handleGameOver = useCallback(() => {
        if (gameTimerRef.current) clearInterval(gameTimerRef.current);
        if (wordSpawnTimerRef.current) clearInterval(wordSpawnTimerRef.current);

        setGameStats((prev) => ({
            ...prev,
            totalScore: gameState.score,
            accuracy: totalWordsAttempted > 0 ? (gameState.wordsCompleted / totalWordsAttempted) * 100 : 100,
        }));

        setGameState((prev) => ({ ...prev, isGameOver: true }));
        setGamePhase(GamePhase.GAME_OVER);
    }, [gameState.score, gameState.wordsCompleted, totalWordsAttempted]);

    // 게임 타이머
    const startGameTimer = useCallback(() => {
        if (gameTimerRef.current) clearInterval(gameTimerRef.current);

        gameTimerRef.current = setInterval(() => {
            if (gamePhase === GamePhase.PLAYING && !gameState.isPaused) {
                setGameState((prev) => ({
                    ...prev,
                    timeElapsed: prev.timeElapsed + 1,
                }));

                setGameStats((prev) => ({
                    ...prev,
                    playTime: prev.playTime + 1,
                }));

                // 시간 제한 체크
                if (currentStageConfig.timeLimit) {
                    const elapsed = Date.now() / 1000 - stageStartTime;
                    if (elapsed >= currentStageConfig.timeLimit) {
                        handleGameOver();
                    }
                }
            }
        }, 1000);
    }, [gamePhase, gameState.isPaused, currentStageConfig.timeLimit, stageStartTime, handleGameOver]);

    // 단어 스폰 타이머
    const startWordSpawnTimer = useCallback(() => {
        if (wordSpawnTimerRef.current) clearInterval(wordSpawnTimerRef.current);

        wordSpawnTimerRef.current = setInterval(() => {
            if (gamePhase === GamePhase.PLAYING && !gameState.isPaused && availableWords.current.length > 0) {
                // 한 번에 여러 개의 단어를 스폰 (진짜 비처럼!)
                const wordsToSpawn = Math.min(3, currentStageConfig.maxWords - fallingWords.current.length);
                for (let i = 0; i < wordsToSpawn; i++) {
                    if (fallingWords.current.length < currentStageConfig.maxWords) {
                        const randomWord =
                            availableWords.current[Math.floor(Math.random() * availableWords.current.length)];
                        addFallingWord(randomWord);
                    }
                }
            }
        }, currentStageConfig.wordSpawnRate);
    }, [gamePhase, gameState.isPaused, addFallingWord, currentStageConfig.wordSpawnRate]);

    // 주제 선택 핸들러
    const handleTopicSelect = useCallback(
        async (topicId: string) => {
            setSelectedTopic(topicId);
            setGamePhase(GamePhase.TOPIC_SELECTION);
            try {
                // 스트리밍으로 단어 생성 시작 (배치 크기 30, 총 7배치 = 210개 단어)
                startStreaming(topicId, 30, 7);
            } catch (error) {
                console.error("단어 생성 실패:", error);
            }
        },
        [startStreaming],
    );

    // 스테이지 시작
    const handleStageStart = useCallback(() => {
        setGamePhase(GamePhase.PLAYING);
        setStageStartTime(Date.now() / 1000);
    }, [currentStageConfig]);

    // 다음 스테이지로 진행
    const handleNextStage = useCallback(() => {
        const nextStage = gameState.currentStage + 1;
        const nextConfig = getStageConfig(nextStage);

        setCurrentStageConfig(nextConfig);
        setGameState((prev) => ({
            ...prev,
            currentStage: nextStage,
            targetShapes: nextConfig.targetShapes,
            shapesCreated: 0,
        }));

        setGameStats((prev) => ({
            ...prev,
            stagesCompleted: prev.stagesCompleted + 1,
        }));

        // 게임 상태 초기화
        setInputWords([]);
        setPoints([]);
        pointsRef.current = [];
        inputWordsRef.current = [];
        setWordInput("");
        fallingWords.current = [];
        shapesRef.current = [];

        setGamePhase(GamePhase.STAGE_START);
    }, [gameState.currentStage]);

    // 일시정지 토글
    const handlePause = useCallback(() => {
        if (gamePhase === GamePhase.PLAYING) {
            setGameState((prev) => ({ ...prev, isPaused: !prev.isPaused }));
            setGamePhase((prev) => (prev === GamePhase.PAUSED ? GamePhase.PLAYING : GamePhase.PAUSED));
        } else if (gamePhase === GamePhase.PAUSED) {
            setGamePhase(GamePhase.PLAYING);
            setGameState((prev) => ({ ...prev, isPaused: false }));
        }
    }, [gamePhase]);

    // 게임 재시작
    const handleRestart = useCallback(() => {
        // 모든 타이머 정리
        if (gameTimerRef.current) clearInterval(gameTimerRef.current);
        if (wordSpawnTimerRef.current) clearInterval(wordSpawnTimerRef.current);

        // 게임 상태 초기화
        setGameState({
            currentStage: 1,
            score: 0,
            lives: 3,
            wordsCompleted: 0,
            shapesCreated: 0,
            timeElapsed: 0,
            isGameOver: false,
            isPaused: false,
            targetShapes: 3,
        });

        setGameStats({
            totalScore: 0,
            stagesCompleted: 0,
            shapesCreated: 0,
            wordsTyped: 0,
            accuracy: 100,
            playTime: 0,
        });

        setCurrentStageConfig(getStageConfig(1));
        setInputWords([]);
        setPoints([]);
        pointsRef.current = [];
        inputWordsRef.current = [];
        setWordInput("");
        setTotalWordsAttempted(0);
        fallingWords.current = [];
        shapesRef.current = [];

        setGamePhase(GamePhase.STAGE_SELECTION);
    }, []);

    // 메인 메뉴로 돌아가기
    const handleQuit = useCallback(() => {
        if (gameTimerRef.current) clearInterval(gameTimerRef.current);
        if (wordSpawnTimerRef.current) clearInterval(wordSpawnTimerRef.current);

        setGamePhase(GamePhase.STAGE_SELECTION);
        setSelectedTopic(null);

        // 게임 상태 초기화
        setGameState({
            currentStage: 1,
            score: 0,
            lives: 3,
            wordsCompleted: 0,
            shapesCreated: 0,
            timeElapsed: 0,
            isGameOver: false,
            isPaused: false,
            targetShapes: 3,
        });
    }, []);

    // p5.js 스케치
    const sketch = useCallback(
        (p: any) => {
            p.setup = () => {
                const cnv = p.createCanvas(800, 600);
                cnv.id("main-canvas");

                if (!MatterLib.current) return;

                matterRef.current.engine = MatterLib.current.Engine.create();
                matterRef.current.world = matterRef.current.engine.world;
                matterRef.current.engine.gravity.y = 1;

                matterRef.current.ground = MatterLib.current.Bodies.rectangle(
                    p.width / 2,
                    p.height - 20,
                    p.width / 2,
                    40,
                    {
                        isStatic: true,
                    },
                );
                MatterLib.current.World.add(matterRef.current.world, matterRef.current.ground);

                // 배경 별들
                for (let i = 0; i < 200; i++) {
                    backgroundStars.current.push({
                        x: Math.random() * p.width,
                        y: Math.random() * p.height,
                        size: Math.random() * 2,
                    });
                }
            };

            p.draw = () => {
                if (!matterRef.current.engine) return;

                p.background(15, 10, 30);
                p.noStroke();
                p.fill(255, 255, 255, 80);
                backgroundStars.current.forEach((star) => p.circle(star.x, star.y, star.size));

                if (gamePhase === GamePhase.PLAYING && !gameState.isPaused && MatterLib.current) {
                    MatterLib.current.Engine.update(matterRef.current.engine);
                }

                // 떨어지는 단어들 렌더링
                for (let i = fallingWords.current.length - 1; i >= 0; i--) {
                    const fw = fallingWords.current[i];

                    if (gamePhase === GamePhase.PLAYING && !gameState.isPaused) {
                        fw.y += fw.speed;
                    }

                    p.push();
                    p.translate(fw.x, fw.y);

                    // 그림자 효과
                    p.noStroke();
                    p.fill(0, 0, 0, 50);
                    p.ellipse(3, 3, 100, 40);

                    // 단어 배경 (그라데이션 효과)
                    p.fill(255, 255, 255, fw.opacity * 200);
                    p.stroke(fw.color);
                    p.strokeWeight(3);
                    p.ellipse(0, 0, 100, 40);

                    // 내부 하이라이트
                    p.noStroke();
                    p.fill(255, 255, 255, fw.opacity * 100);
                    p.ellipse(0, -5, 80, 25);

                    // 별 장식 (작게)
                    p.fill(fw.color);
                    p.noStroke();
                    drawStar(p, -35, 0, 3, 6, 5);
                    drawStar(p, 35, 0, 3, 6, 5);

                    // 단어 텍스트 (테두리 효과)
                    p.textAlign(p.CENTER, p.CENTER);
                    p.textSize(fw.size + 2);

                    // 텍스트 그림자
                    p.fill(0, 0, 0, 100);
                    p.text(fw.word, 1, 1);

                    // 메인 텍스트
                    p.fill(50, 50, 50);
                    p.text(fw.word, 0, 0);

                    // 텍스트 하이라이트
                    p.fill(255, 255, 255, 150);
                    p.textSize(fw.size);
                    p.text(fw.word, 0, -1);

                    p.pop();

                    // 화면 밖으로 나간 단어 제거 (생명력 감소 없음)
                    if (fw.y > p.height + 50) {
                        fallingWords.current.splice(i, 1);
                    }
                }

                // 바닥
                if (matterRef.current.ground) {
                    p.noStroke();
                    p.fill(30, 20, 40);
                    p.rectMode(p.CENTER);
                    p.rect(matterRef.current.ground.position.x, matterRef.current.ground.position.y, p.width / 2, 40);
                }

                // 연결선 먼저 그리기
                for (let i = 1; i < pointsRef.current.length; i++) {
                    const prev = pointsRef.current[i - 1];
                    const curr = pointsRef.current[i];
                    p.stroke(255, 255, 100, 255);
                    p.strokeWeight(4);
                    p.line(prev.x, prev.y, curr.x, curr.y);
                }

                // 입력된 단어들의 점들 (연결선 위에 그리기)

                pointsRef.current.forEach((pt, i) => {
                    // 점 배경 원 (더 크고 진한 배경)
                    p.noStroke();
                    p.fill(0, 0, 0, 200);
                    p.circle(pt.x, pt.y, 50);

                    // 점 외곽 테두리
                    p.noFill();
                    p.stroke(255, 255, 255);
                    p.strokeWeight(3);
                    p.circle(pt.x, pt.y, 45);

                    // 점 (별 모양) - 더 크고 밝게
                    p.push();
                    p.translate(pt.x, pt.y);
                    p.fill(255, 255, 0); // 순수 노란색
                    p.stroke(255, 255, 255);
                    p.strokeWeight(3);
                    drawStar(p, 0, 0, 12, 20, 5); // 더 큰 크기
                    p.pop();

                    // 단어 텍스트 (더 명확하게)
                    p.fill(255, 255, 255);
                    p.stroke(0, 0, 0);
                    p.strokeWeight(2);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.textSize(18);
                    p.text(inputWordsRef.current[i], pt.x, pt.y - 35);
                });

                // 4개 점이 모이면 도형 완성
                if (pointsRef.current.length === 4) {
                    const first = pointsRef.current[0];
                    const last = pointsRef.current[3];
                    p.stroke(255, 255, 100, 255); // 밝은 노란색으로 완성선 강조
                    p.strokeWeight(4); // 두께 증가
                    p.line(last.x, last.y, first.x, first.y);

                    // 도형 내부를 반투명으로 채우기
                    p.fill(255, 255, 100, 50);
                    p.noStroke();
                    p.beginShape();
                    pointsRef.current.forEach((pt) => p.vertex(pt.x, pt.y));
                    p.endShape(p.CLOSE);
                }

                // 생성된 도형들
                for (const s of shapesRef.current) {
                    const vertices = s.vertices;

                    // 도형 내부 채우기
                    p.fill(100, 200, 255, 80);
                    p.noStroke();
                    p.beginShape();
                    for (const v of vertices) {
                        p.vertex(v.x, v.y);
                    }
                    p.endShape(p.CLOSE);

                    // 도형 테두리
                    p.noFill();
                    p.stroke(100, 200, 255, 200);
                    p.strokeWeight(3);
                    p.beginShape();
                    for (const v of vertices) {
                        p.vertex(v.x, v.y);
                    }
                    p.endShape(p.CLOSE);
                }
            };

            function drawStar(p: any, x: number, y: number, radius1: number, radius2: number, npoints: number) {
                const angle = p.TWO_PI / npoints;
                const halfAngle = angle / 2.0;
                p.beginShape();
                for (let a = 0; a < p.TWO_PI; a += angle) {
                    let sx = x + Math.cos(a) * radius2;
                    let sy = y + Math.sin(a) * radius2;
                    p.vertex(sx, sy);
                    sx = x + Math.cos(a + halfAngle) * radius1;
                    sy = y + Math.sin(a + halfAngle) * radius1;
                    p.vertex(sx, sy);
                }
                p.endShape(p.CLOSE);
            }
        },
        [gamePhase, gameState.isPaused, points, inputWords, handleGameOver],
    );

    // 도형 생성
    const createShape = useCallback(() => {
        if (!matterRef.current.world || points.length !== 4 || !MatterLib.current) return;

        const centerX = points.reduce((sum, p) => sum + p.x, 0) / 4;
        const centerY = points.reduce((sum, p) => sum + p.y, 0) / 4;
        const scaled = points.map((p) => ({
            x: centerX + (p.x - centerX),
            y: centerY + (p.y - centerY),
        }));

        const body = MatterLib.current.Bodies.fromVertices(centerX, centerY, [scaled], { restitution: 0.5 });
        MatterLib.current.World.add(matterRef.current.world, body);
        shapesRef.current.push(body);

        // 점수 계산
        const averageHeight = points.reduce((sum, p) => sum + p.y, 0) / 4;
        const scoreBreakdown = calculateScore(
            averageHeight,
            gameState.timeElapsed,
            gameState.currentStage,
            gameState.wordsCompleted,
            totalWordsAttempted,
        );

        setLastScoreBreakdown(scoreBreakdown);

        setGameState((prev) => ({
            ...prev,
            score: prev.score + scoreBreakdown.total,
            shapesCreated: prev.shapesCreated + 1,
        }));

        setGameStats((prev) => ({
            ...prev,
            shapesCreated: prev.shapesCreated + 1,
        }));

        setPoints([]);
        setInputWords([]);
        pointsRef.current = [];
        inputWordsRef.current = [];

        // 스테이지 완료 체크
        if (gameState.shapesCreated + 1 >= gameState.targetShapes) {
            setTimeout(() => {
                if (gameTimerRef.current) clearInterval(gameTimerRef.current);
                if (wordSpawnTimerRef.current) clearInterval(wordSpawnTimerRef.current);
                setGamePhase(GamePhase.STAGE_COMPLETE);
            }, 1000);
        }
    }, [points, gameState, totalWordsAttempted]);

    // 단어 입력 처리
    const addWord = useCallback(async () => {
        if (
            gamePhase !== GamePhase.PLAYING ||
            gameState.isPaused ||
            !wordInput.trim() ||
            !availableWords.current.length
        )
            return;

        const word = wordInput.trim().toLowerCase();
        setWordInput("");
        setTotalWordsAttempted((prev) => prev + 1);

        // 떨어지는 단어 중에 해당 단어가 있는지 확인
        const wordIndex = fallingWords.current.findIndex((fw) => fw.word.toLowerCase() === word);
        if (wordIndex === -1) {
            return;
        }

        try {
            // 단어의 벡터 가져오기
            const vector = await getVectorOfWord(word);
            if (!vector) {
                console.error("벡터를 가져올 수 없습니다");
                return;
            }

            setVectorToShow(vector);

            // 벡터를 기반으로 위치 계산 (정규화하여 캔버스 범위에 맞춤)
            const normalizedX = Math.max(50, Math.min(750, ((vector[0] + 1) / 2) * 600 + 100)); // 50~750 범위로 제한
            const normalizedY = Math.max(100, Math.min(500, ((vector[1] + 1) / 2) * 300 + 150)); // 100~500 범위로 제한

            const newPoint = { x: normalizedX, y: normalizedY };
            setPoints((prev) => {
                const newPoints = [...prev, newPoint];
                pointsRef.current = newPoints; // ref 동기화
                return newPoints;
            });
            setInputWords((prev) => {
                const newWords = [...prev, word];
                inputWordsRef.current = newWords; // ref 동기화
                return newWords;
            });

            setGameState((prev) => ({
                ...prev,
                wordsCompleted: prev.wordsCompleted + 1,
            }));

            setGameStats((prev) => ({
                ...prev,
                wordsTyped: prev.wordsTyped + 1,
            }));

            // 해당 단어를 떨어지는 단어에서 제거
            fallingWords.current.splice(wordIndex, 1);
        } catch (error) {
            console.error("벡터 가져오기 실패:", error);
        }
    }, [wordInput, gamePhase, gameState.isPaused]);

    // 키보드 이벤트 처리
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                e.preventDefault();
                if (gamePhase === GamePhase.PLAYING || gamePhase === GamePhase.PAUSED) {
                    handlePause();
                }
            } else if (e.key === "r" || e.key === "R") {
                if (gamePhase === GamePhase.PAUSED || gamePhase === GamePhase.GAME_OVER) {
                    handleRestart();
                }
            } else if (e.key === "q" || e.key === "Q") {
                if (gamePhase === GamePhase.PAUSED || gamePhase === GamePhase.GAME_OVER) {
                    handleQuit();
                }
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [gamePhase, handlePause, handleRestart, handleQuit]);

    // 스트리밍된 단어들을 사용 가능한 단어 목록에 업데이트
    useEffect(() => {
        if (words.length > 0) {
            availableWords.current = words;
        }
    }, [words]);

    // 스트리밍 완료 시 게임 시작
    useEffect(() => {
        if (!isStreaming && words.length > 0 && selectedTopic && gamePhase === GamePhase.TOPIC_SELECTION) {
            setGamePhase(GamePhase.STAGE_START);
        }
    }, [isStreaming, words.length, selectedTopic, gamePhase]);

    // 점이 4개가 되면 도형 생성
    useEffect(() => {
        if (points.length === 4) {
            createShape();
        }
    }, [points, createShape]);

    // p5.js 인스턴스 생성
    useEffect(() => {
        if (
            !p5Instance.current &&
            canvasRef.current &&
            gamePhase === GamePhase.PLAYING &&
            librariesLoaded &&
            p5Lib.current
        ) {
            const existing = document.getElementById("main-canvas");
            if (existing) {
                existing.remove();
            }
            p5Instance.current = new p5Lib.current(sketch, canvasRef.current);
        }
        return () => {
            if (p5Instance.current && gamePhase !== GamePhase.PLAYING) {
                p5Instance.current.remove();
                p5Instance.current = null;
            }
        };
    }, [sketch, gamePhase, librariesLoaded]);

    // 게임 페이즈 변경 시 타이머 관리
    useEffect(() => {
        if (gamePhase === GamePhase.PLAYING) {
            startGameTimer();
            startWordSpawnTimer();
        } else {
            if (gameTimerRef.current) clearInterval(gameTimerRef.current);
            if (wordSpawnTimerRef.current) clearInterval(wordSpawnTimerRef.current);
        }
    }, [gamePhase, startGameTimer, startWordSpawnTimer]);

    // 컴포넌트 언마운트 시 정리
    useEffect(() => {
        return () => {
            if (gameTimerRef.current) clearInterval(gameTimerRef.current);
            if (wordSpawnTimerRef.current) clearInterval(wordSpawnTimerRef.current);
            if (p5Instance.current) {
                p5Instance.current.remove();
                p5Instance.current = null;
            }
        };
    }, []);

    // 게임 페이즈별 렌더링
    switch (gamePhase) {
        case GamePhase.STAGE_SELECTION:
            return <StageSelector topics={topics} onTopicSelect={handleTopicSelect} onBack={onBack} />;

        case GamePhase.TOPIC_SELECTION:
            return (
                <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                    <div className="container mx-auto px-4 py-8">
                        <header className="text-center mb-8">
                            <div className="flex items-center justify-between mb-4">
                                {onBack && (
                                    <button
                                        onClick={onBack}
                                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                                    >
                                        ← 메인으로
                                    </button>
                                )}
                                <div className="flex-1">
                                    <h1 className="text-4xl font-bold text-gray-800 mb-2">단어 게임</h1>
                                    <p className="text-gray-600">
                                        주제를 선택하고 떨어지는 단어들을 입력하여 도형을 만들어보세요
                                    </p>
                                </div>
                                <div className="w-20"></div> {/* 균형을 위한 공간 */}
                            </div>
                        </header>

                        {isStreaming ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <StreamingProgress
                                    isStreaming={isStreaming}
                                    progress={progress}
                                    totalWords={totalWords}
                                    currentBatch={currentBatch}
                                    totalBatches={totalBatches}
                                    words={words}
                                    error={streamingError}
                                />
                            </div>
                        ) : (
                            <TopicSelector
                                topics={topics}
                                selectedTopic={selectedTopic}
                                onTopicSelect={handleTopicSelect}
                                loading={topicsLoading}
                                error={topicsError}
                            />
                        )}
                    </div>
                </div>
            );

        case GamePhase.STAGE_START:
            return <StageStart stageConfig={currentStageConfig} onStart={handleStageStart} />;

        case GamePhase.PLAYING:
            return (
                <div className="relative h-screen bg-black overflow-hidden">
                    <GameHUD gameState={gameState} onPause={handlePause} onQuit={handleQuit} />

                    <div className="flex flex-col items-center justify-center h-full pt-20">
                        <div ref={canvasRef} className="z-0" />

                        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
                            <div className="bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white">
                                <p className="text-sm mb-2 text-center">떨어지는 단어 중 하나를 입력하세요!</p>
                                <div className="flex items-center space-x-2">
                                    <input
                                        id="word-input"
                                        type="text"
                                        value={wordInput}
                                        onChange={(e) => setWordInput(e.target.value)}
                                        className="outline rounded px-3 py-2 bg-white text-black w-48"
                                        placeholder="단어를 입력하세요"
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") addWord();
                                        }}
                                        autoFocus
                                    />
                                    <button
                                        onClick={addWord}
                                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                                    >
                                        입력
                                    </button>
                                </div>
                                <div className="text-xs mt-2 text-center text-gray-300">
                                    {vectorToShow
                                        ? `마지막 벡터: [${vectorToShow[0].toFixed(2)}, ${vectorToShow[1].toFixed(2)}]`
                                        : "벡터 정보 없음"}
                                </div>
                                <div className="text-xs mt-1 text-center text-gray-300">점 개수: {points.length}/4</div>
                            </div>
                        </div>
                    </div>
                </div>
            );

        case GamePhase.STAGE_COMPLETE:
            return lastScoreBreakdown ? (
                <StageComplete
                    stage={gameState.currentStage}
                    scoreBreakdown={lastScoreBreakdown}
                    timeElapsed={gameState.timeElapsed}
                    shapesCreated={gameState.shapesCreated}
                    onNextStage={handleNextStage}
                    onQuit={handleQuit}
                />
            ) : null;

        case GamePhase.GAME_OVER:
            return <GameOver gameStats={gameStats} onRestart={handleRestart} onMainMenu={handleQuit} />;

        case GamePhase.PAUSED:
            return (
                <>
                    <div className="relative h-screen bg-black overflow-hidden">
                        <GameHUD gameState={gameState} onPause={handlePause} onQuit={handleQuit} />

                        <div className="flex flex-col items-center justify-center h-full pt-20">
                            <div ref={canvasRef} className="z-0" />
                        </div>
                    </div>
                    <PauseScreen
                        gameState={gameState}
                        onResume={handlePause}
                        onRestart={handleRestart}
                        onQuit={handleQuit}
                    />
                </>
            );

        default:
            return null;
    }
};

export default memo(IntegratedWordGame);
