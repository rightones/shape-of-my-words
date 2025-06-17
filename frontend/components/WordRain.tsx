"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { WordRainItem } from "../types/words";

interface WordRainProps {
    words: string[];
    isActive: boolean;
    className?: string;
}

const WordRain: React.FC<WordRainProps> = ({ words, isActive, className = "" }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const animationRef = useRef<number>();
    const wordsRef = useRef<WordRainItem[]>([]);
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

    // 랜덤 색상 생성
    const getRandomColor = useCallback(() => {
        const colors = [
            "#3B82F6", // blue
            "#10B981", // emerald
            "#8B5CF6", // violet
            "#F59E0B", // amber
            "#EF4444", // red
            "#06B6D4", // cyan
            "#84CC16", // lime
            "#EC4899", // pink
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }, []);

    // 새로운 단어 아이템 생성
    const createWordItem = useCallback(
        (word: string, index: number): WordRainItem => {
            return {
                id: `${word}-${index}-${Date.now()}`,
                text: word,
                x: Math.random() * (dimensions.width - 100), // 단어가 잘리지 않도록 여백 확보
                y: -50, // 화면 위에서 시작
                speed: Math.random() * 2 + 1, // 1-3 사이의 속도
                size: Math.random() * 8 + 16, // 16-24px 사이의 크기
                opacity: Math.random() * 0.5 + 0.5, // 0.5-1 사이의 투명도
                color: getRandomColor(),
            };
        },
        [dimensions.width, getRandomColor],
    );

    // 캔버스 크기 설정
    const updateCanvasSize = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;

        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;

        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.scale(dpr, dpr);
        }

        setDimensions({ width: rect.width, height: rect.height });
    }, []);

    // 단어들 초기화
    const initializeWords = useCallback(() => {
        if (!words.length || !dimensions.width) return;

        wordsRef.current = words.slice(0, 100).map((word, index) => {
            const item = createWordItem(word, index);
            // 초기 위치를 화면 전체에 분산
            item.y = Math.random() * dimensions.height;
            return item;
        });
    }, [words, dimensions, createWordItem]);

    // 애니메이션 루프
    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (!canvas || !ctx || !isActive) return;

        // 캔버스 클리어
        ctx.clearRect(0, 0, dimensions.width, dimensions.height);

        // 단어들 업데이트 및 렌더링
        wordsRef.current = wordsRef.current.filter((item) => {
            // 위치 업데이트
            item.y += item.speed;

            // 화면 아래로 나간 단어는 제거하고 새로운 단어 추가
            if (item.y > dimensions.height + 50) {
                if (words.length > 0) {
                    const newWord = words[Math.floor(Math.random() * words.length)];
                    const newItem = createWordItem(newWord, Date.now());
                    wordsRef.current.push(newItem);
                }
                return false; // 현재 아이템 제거
            }

            // 단어 렌더링
            ctx.save();
            ctx.font = `${item.size}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`;
            ctx.fillStyle = item.color;
            ctx.globalAlpha = item.opacity;
            ctx.textAlign = "center";

            // 텍스트 그림자 효과
            ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            ctx.fillText(item.text, item.x, item.y);
            ctx.restore();

            return true; // 아이템 유지
        });

        // 단어가 부족하면 추가
        while (wordsRef.current.length < 50 && words.length > 0) {
            const randomWord = words[Math.floor(Math.random() * words.length)];
            wordsRef.current.push(createWordItem(randomWord, Date.now()));
        }

        animationRef.current = requestAnimationFrame(animate);
    }, [isActive, dimensions, words, createWordItem]);

    // 리사이즈 이벤트 핸들러
    useEffect(() => {
        const handleResize = () => {
            updateCanvasSize();
        };

        window.addEventListener("resize", handleResize);
        updateCanvasSize();

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [updateCanvasSize]);

    // 단어 변경 시 초기화
    useEffect(() => {
        if (dimensions.width && dimensions.height) {
            initializeWords();
        }
    }, [words, dimensions, initializeWords]);

    // 애니메이션 시작/중지
    useEffect(() => {
        if (isActive && words.length > 0) {
            animate();
        } else if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }

        return () => {
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [isActive, words, animate]);

    return (
        <canvas
            ref={canvasRef}
            className={`w-full h-full ${className}`}
            style={{
                background: "transparent",
                pointerEvents: "none",
            }}
        />
    );
};

export default WordRain;
