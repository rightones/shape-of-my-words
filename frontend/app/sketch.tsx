"use client";

import React, { useRef, useEffect, useState, useCallback, memo } from "react";
import p5 from "p5";
import Matter from "matter-js";
import { getVectorOfWord } from "./action";

const Sketch = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);

  const matterRef = useRef<{
    engine: Matter.Engine | null;
    world: Matter.World | null;
    ground: Matter.Body | null;
  }>({ engine: null, world: null, ground: null });

  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [inputWords, setInputWords] = useState<string[]>([]);
  const [points, setPoints] = useState<
    { x: number; y: number; pcaCoords?: [number, number] }[]
  >([]);
  const [wordInput, setWordInput] = useState("");

  const fallingWords = useRef<
    { word: string; x: number; y: number; speed: number }[]
  >([]);
  const shapesRef = useRef<Matter.Body[]>([]);
  const scoreRef = useRef(score);
  const gameOverRef = useRef(gameOver);
  const inputWordsRef = useRef(inputWords);
  const pointsRef = useRef(points);

  const addFallingWord = useCallback((word: string) => {
    fallingWords.current.push({
      word,
      x: Math.random() * 700 + 50,
      y: Math.random() * -200 - 100,
      speed: Math.random() * 1.5 + 1.5,
    });
  }, []);

  const sketch = useCallback((p: p5) => {
    p.setup = () => {
      const cnv = p.createCanvas(800, 600);
      cnv.id("main-canvas");

      matterRef.current.engine = Matter.Engine.create();
      matterRef.current.world = matterRef.current.engine.world;
      matterRef.current.engine.gravity.y = 1;

      const ground = Matter.Bodies.rectangle(
        p.width / 2,
        p.height - 20,
        p.width / 2,
        40,
        { isStatic: true }
      );

      matterRef.current.ground = ground;
      Matter.World.add(matterRef.current.world, ground);
    };

    p.draw = () => {
      if (!matterRef.current.engine) return;

      p.background(10);
      Matter.Engine.update(matterRef.current.engine);

      // 🌟 Draw falling words with white background
      for (const fw of fallingWords.current) {
        fw.y += fw.speed;

        p.push();
        p.translate(fw.x, fw.y);

        // White circular background
        p.noStroke();
        p.fill(255);
        p.ellipse(0, 0, 100, 60); // white background behind star/text

        // Star shape
        p.fill(255, 215, 0);
        p.stroke(255, 180, 0);
        p.strokeWeight(1);
        drawStar(p, 0, 0, 20, 40, 5);

        // Word text
        p.noStroke();
        p.fill(0);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(16);
        p.text(fw.word, 0, 0);

        p.pop();
      }

      fallingWords.current = fallingWords.current.filter((w) => w.y < p.height + 50);

      // Draw ground
      if (matterRef.current.ground) {
        p.fill(100);
        p.rectMode(p.CENTER);
        p.rect(
          matterRef.current.ground.position.x,
          matterRef.current.ground.position.y,
          p.width / 2,
          40
        );
      }

      // Draw points and lines
      pointsRef.current.forEach((pt, i) => {
        p.fill("blue");
        p.ellipse(pt.x, pt.y, 10, 10);
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(inputWordsRef.current[i], pt.x, pt.y - 15);

        if (i > 0) {
          const prev = pointsRef.current[i - 1];
          p.stroke(255);
          p.line(prev.x, prev.y, pt.x, pt.y);
        }
      });

      if (pointsRef.current.length === 4) {
        const first = pointsRef.current[0];
        const last = pointsRef.current[3];
        p.stroke(255);
        p.line(last.x, last.y, first.x, first.y);
      }

      for (const s of shapesRef.current) {
        p.fill(0, 150, 255, 100);
        p.beginShape();
        for (const v of s.vertices) {
          p.vertex(v.x, v.y);
          if (v.y > p.height) {
            setGameOver(true);
          }
        }
        p.endShape(p.CLOSE);
      }

      p.fill(255);
      p.textSize(24);
      p.textAlign(p.CENTER);
      p.text(`Score: ${scoreRef.current}`, p.width / 2, 50);
      p.text("Topic: Delicious dishes!", p.width / 2, 90);

      if (gameOverRef.current) {
        p.noLoop();
        p.fill(255, 0, 0);
        p.textSize(36);
        p.text("Game Over", p.width / 2, p.height / 2);
      }
    };

    function drawStar(
      p: p5,
      x: number,
      y: number,
      radius1: number,
      radius2: number,
      npoints: number
    ) {
      const angle = p.TWO_PI / npoints;
      const halfAngle = angle / 2.0;
      p.beginShape();
      for (let a = 0; a < p.TWO_PI; a += angle) {
        const sx = x + Math.cos(a) * radius2;
        const sy = y + Math.sin(a) * radius2;
        p.vertex(sx, sy);
        const sx2 = x + Math.cos(a + halfAngle) * radius1;
        const sy2 = y + Math.sin(a + halfAngle) * radius1;
        p.vertex(sx2, sy2);
      }
      p.endShape(p.CLOSE);
    }
  }, []);

  useEffect(() => {
    const words = [
      "pizza", "sushi", "pasta", "burger", "ramen", "steak", "curry", "noodles",
      "bibimbap", "taco", "dumpling", "paella", "croissant", "sandwich", "salad",
      "kimchi", "hotdog", "lasagna", "falafel", "pho", "gnocchi", "bruschetta",
      "ceviche", "gimbap", "risotto", "hamburger", "burrito", "yakitori",
      "shawarma", "udon"
    ];

    const interval = setInterval(() => {
      const rand = words[Math.floor(Math.random() * words.length)];
      addFallingWord(rand);
    }, 1500);

    return () => clearInterval(interval);
  }, [addFallingWord]);

  useEffect(() => {
    scoreRef.current = score;
    gameOverRef.current = gameOver;
    inputWordsRef.current = inputWords;
    pointsRef.current = points;
  }, [score, gameOver, inputWords, points]);

  const getPCABasedSize = useCallback((pcaCoords: [number, number]) => {
    const [x, y] = pcaCoords;
    const mag = Math.sqrt(x * x + y * y);
    const scale = 0.8 + Math.min(mag / 5, 1) * (2.5 - 0.8);
    return scale;
  }, []);

  const mapPCAToCanvas = useCallback((pca: [number, number]): [number, number] => {
    const [x, y] = pca;
    const canvasX = 800 / 2 + Math.max(-0.5, Math.min(0.5, x)) * 600;
    const canvasY = 600 / 2 - Math.max(-0.5, Math.min(0.5, y)) * 600 + 50;
    return [canvasX, canvasY];
  }, []);

  const createShape = useCallback(() => {
    const pts = pointsRef.current;
    if (!matterRef.current.world || pts.length !== 4) return;

    const centerX = pts.reduce((sum, p) => sum + p.x, 0) / 4;
    const centerY = pts.reduce((sum, p) => sum + p.y, 0) / 4;
    const scale = pts
      .filter(p => p.pcaCoords)
      .reduce((sum, p) => sum + getPCABasedSize(p.pcaCoords!), 0) / 4 || 1.2;

    const scaled = pts.map(p => ({
      x: centerX + (p.x - centerX) * scale,
      y: centerY + (p.y - centerY) * scale
    }));

    const body = Matter.Bodies.fromVertices(centerX, centerY, [scaled], {
      restitution: 0.5,
    });

    Matter.World.add(matterRef.current.world, body);
    shapesRef.current.push(body);

    const avgY = pts.reduce((sum, p) => sum + p.y, 0) / 4;
    const scoreBonus = Math.max(1, Math.floor((600 - avgY) / 10)) + Math.floor(scale * 10);
    setScore(prev => prev + scoreBonus);
  }, [getPCABasedSize]);

  const addWord = useCallback(async () => {
    if (gameOver || !wordInput.trim()) return;

    const word = wordInput.trim();
    setWordInput("");

    const pca = await getVectorOfWord(word);
    if (!pca) {
      alert("Word not found.");
      return;
    }

    const canvasPos = mapPCAToCanvas(pca);
    const newPts = [...points, { x: canvasPos[0], y: canvasPos[1], pcaCoords: pca }];
    const newWords = [...inputWords, word];

    setPoints(newPts);
    setInputWords(newWords);

    if (newPts.length === 4) {
      setTimeout(() => {
        createShape();
        setPoints([]);
        setInputWords([]);
      }, 100);
    }
  }, [wordInput, gameOver, points, inputWords, createShape, mapPCAToCanvas]);

  useEffect(() => {
    if (canvasRef.current && !p5Instance.current) {
      p5Instance.current = new p5(sketch, canvasRef.current);
    }
    return () => {
      p5Instance.current?.remove();
      p5Instance.current = null;
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
            if (e.key === "Enter") addWord();
          }}
        />
        <button onClick={addWord}>Add Word</button>
      </div>
    </div>
  );
};

export default memo(Sketch);
