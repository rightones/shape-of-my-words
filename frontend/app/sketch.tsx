"use client";

import React, { useRef, useEffect, useState, useCallback, memo } from "react";
import p5 from "p5";
import Matter from "matter-js";
import { getVectorOfWord } from "./action";

const Sketch = () => {
    const canvasRef = useRef<HTMLDivElement>(null);
    const p5InstanceRef = useRef<p5 | null>(null);
    const matterRef = useRef<{ engine: Matter.Engine | null; world: Matter.World | null; ground: Matter.Body | null }>({
        engine: null,
        world: null,
        ground: null,
    });

    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [inputWords, setInputWords] = useState<string[]>([]);
    const [points, setPoints] = useState<{ x: number; y: number; pcaCoords?: [number, number] }[]>([]);
    const [wordInput, setWordInput] = useState("");

    const [vectorToShow, setVectorToShow] = useState<[number, number] | null>(null);

    const shapesRef = useRef<Matter.Body[]>([]);

    const scoreRef = useRef(score);
    const gameOverRef = useRef(gameOver);
    const inputWordsRef = useRef(inputWords);
    const pointsRef = useRef(points);

    const sketch = useCallback((p: p5) => {
        p.setup = () => {
            p.createCanvas(800, 600);
            matterRef.current.engine = Matter.Engine.create();
            matterRef.current.world = matterRef.current.engine.world;
            matterRef.current.engine.gravity.y = 1;
            matterRef.current.ground = Matter.Bodies.rectangle(p.width / 2, p.height - 20, p.width / 2, 40, {
                isStatic: true,
            });
            Matter.World.add(matterRef.current.world, matterRef.current.ground);
        };

        p.draw = () => {
            if (!matterRef.current.engine || !matterRef.current.ground) return;
            p.background(255);
            Matter.Engine.update(matterRef.current.engine);

            p.fill(100);
            p.rectMode(p.CENTER);
            p.rect(matterRef.current.ground.position.x, matterRef.current.ground.position.y, p.width / 2, 40);
            p.fill(0);
            p.textSize(24);
            p.textAlign(p.CENTER);
            p.text(`Score: ${scoreRef.current}`, p.width / 2, 50);
            p.text("Topic: Delicious dishes!", p.width / 2, 100);
            p.strokeWeight(2);
            for (let i = 0; i < pointsRef.current.length; i++) {
                const point = pointsRef.current[i];
                p.fill("blue");
                p.ellipse(point.x, point.y, 10, 10);
                p.fill(0);
                p.textAlign(p.CENTER, p.CENTER);
                p.text(inputWordsRef.current[i], point.x, point.y - 15);
                if (i > 0) {
                    p.push();
                    p.stroke(0);
                    p.line(pointsRef.current[i - 1].x, pointsRef.current[i - 1].y, point.x, point.y);
                    p.pop();
                }
            }
            if (pointsRef.current.length === 4) {
                p.line(pointsRef.current[3].x, pointsRef.current[3].y, pointsRef.current[0].x, pointsRef.current[0].y);
            }
            for (const s of shapesRef.current) {
                const vertices = s.vertices;
                p.fill(0, 150, 255, 100);
                p.beginShape();
                for (const v of vertices) {
                    p.vertex(v.x, v.y);
                }
                p.endShape(p.CLOSE);

                for (const v of vertices) {
                    if (v.y > p.height) {
                        setGameOver(true);
                    }
                }
            }

            if (gameOverRef.current) {
                p.noLoop();
                p.fill(255, 0, 0);
                p.textSize(36);
                p.textAlign(p.CENTER);
                p.text("Game Over", p.width / 2, p.height / 2);
            }
        };
    }, []);

    useEffect(() => {
        scoreRef.current = score;
    }, [score]);

    useEffect(() => {
        gameOverRef.current = gameOver;
    }, [gameOver]);

    useEffect(() => {
        inputWordsRef.current = inputWords;
    }, [inputWords]);

    useEffect(() => {
        pointsRef.current = points;
    }, [points]);

    const getPCABasedSize = useCallback((pcaCoords: [number, number]): number => {
        const [pcaX, pcaY] = pcaCoords;

        const magnitude = Math.sqrt(pcaX * pcaX + pcaY * pcaY);

        const minScale = 0.8;
        const maxScale = 2.5;
        const maxMagnitude = 5; // Estimated max magnitude

        const normalizedMagnitude = Math.min(magnitude / maxMagnitude, 1);

        const scale = minScale + normalizedMagnitude * (maxScale - minScale);

        return scale;
    }, []);

    const mapPCAToCanvas = useCallback((pcaCoords: [number, number]): [number, number] => {
        const [pcaX, pcaY] = pcaCoords;
        setVectorToShow(pcaCoords);

        const canvasWidth = 800;
        const canvasHeight = 600;

        const clampedX = Math.max(-0.5, Math.min(0.5, pcaX));
        const clampedY = Math.max(-0.5, Math.min(0.5, pcaY));

        const canvasX = canvasWidth / 2 + clampedX * canvasHeight; // Scale by height to maintain aspect ratio
        const canvasY = canvasHeight / 2 - clampedY * canvasHeight + 50;

        return [canvasX, canvasY];
    }, []);

    const createShape = useCallback(() => {
        if (!matterRef.current || !matterRef.current.world) return;
        const currentPoints = pointsRef.current;
        if (currentPoints.length !== 4) return;

        const centerX = currentPoints.reduce((sum, p) => sum + p.x, 0) / 4;
        const centerY = currentPoints.reduce((sum, p) => sum + p.y, 0) / 4;

        let averagePCASize = 1.2; // Increased default fallback
        const validPCACoords = currentPoints.filter((p) => p.pcaCoords);
        if (validPCACoords.length > 0) {
            const totalSize = validPCACoords.reduce((sum, p) => sum + getPCABasedSize(p.pcaCoords!), 0);
            averagePCASize = totalSize / validPCACoords.length;
        }

        const scaledVertices = currentPoints.map((p) => ({
            x: centerX + (p.x - centerX) * averagePCASize,
            y: centerY + (p.y - centerY) * averagePCASize,
        }));

        const body = Matter.Bodies.fromVertices(centerX, centerY, [scaledVertices], {
            restitution: 0.5,
        });

        Matter.World.add(matterRef.current.world, body);
        shapesRef.current.push(body);

        const averageHeight = currentPoints.reduce((acc, p) => acc + p.y, 0) / 4;
        const heightScore = Math.max(1, Math.floor((600 - averageHeight) / 10));
        const sizeBonus = Math.floor(averagePCASize * 10); // Bonus for larger shapes
        const shapeScore = heightScore + sizeBonus;
        setScore((prevScore) => prevScore + shapeScore);
    }, [getPCABasedSize]);

    const addWord = useCallback(async () => {
        if (gameOver) return;

        if (!wordInput) return;

        const word = wordInput.trim();
        setWordInput("");

        if (word === "") return;

        const pcaPosition = await getVectorOfWord(word);
        if (!pcaPosition) {
            alert("Word not found in the model. Please try another word.");
            return;
        }

        const canvasPosition = mapPCAToCanvas(pcaPosition);

        const newPoints = [...points];
        newPoints.push({
            x: canvasPosition[0],
            y: canvasPosition[1],
            pcaCoords: pcaPosition,
        });
        setPoints(newPoints);

        const newInputWords = [...inputWords, word];
        setInputWords(newInputWords);

        if (newPoints.length === 4) {
            setTimeout(() => {
                createShape();
                setInputWords([]);
                setPoints([]);
            }, 100); // Small delay to ensure drawing is visible
        }
    }, [gameOver, wordInput, points, inputWords, createShape, mapPCAToCanvas]);

    useEffect(() => {
        if (canvasRef.current && !p5InstanceRef.current) {
            p5InstanceRef.current = new p5(sketch, canvasRef.current);
            p5InstanceRef.current.disableFriendlyErrors = true;
            console.log("init");
        }

        return () => {
            if (p5InstanceRef.current) {
                p5InstanceRef.current.remove();
                p5InstanceRef.current = null;
            }
        };
    }, [sketch]);

    return (
        <div className="flex flex-col items-center justify-center h-screen relative">
            <div ref={canvasRef} />
            <div className="flex flex-col items-center top-64 absolute bottom-0 left-1/2 transform -translate-x-1/2">
                <input
                    type="text"
                    value={wordInput}
                    onChange={(e) => setWordInput(e.target.value)}
                    className="outline"
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            addWord();
                        }
                    }}
                />
                <button onClick={addWord}>Add Word</button>
                <span>
                    {vectorToShow
                        ? `Vector: [${vectorToShow[0].toFixed(2)}, ${vectorToShow[1].toFixed(2)}]`
                        : "No vector to show"}
                </span>
            </div>
        </div>
    );
};

export default memo(Sketch);
