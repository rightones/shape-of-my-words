"use client";

import React, { useRef, useEffect, useState, useCallback, memo } from "react";
import p5 from "p5";
import Matter from "matter-js";
import { getVectorOfWord } from "./action";

const Sketch = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const p5Instance = useRef<p5 | null>(null);

  const matterRef = useRef({ engine: null, world: null, ground: null });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [inputWords, setInputWords] = useState<string[]>([]);
  const [points, setPoints] = useState<{ x: number; y: number }[]>([]);
  const [wordInput, setWordInput] = useState("");

  const shapesRef = useRef<Matter.Body[]>([]);
  const scoreRef = useRef(score);
  const gameOverRef = useRef(gameOver);
  const inputWordsRef = useRef(inputWords);
  const pointsRef = useRef(points);
  const backgroundStars = useRef<{ x: number; y: number; size: number }[]>([]);
  const fallingWords = useRef<{ word: string; x: number; y: number; speed: number }[]>([]);

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

      matterRef.current.ground = Matter.Bodies.rectangle(p.width / 2, p.height - 20, p.width / 2, 40, { isStatic: true });
      Matter.World.add(matterRef.current.world, matterRef.current.ground);

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
      backgroundStars.current.forEach(star => p.circle(star.x, star.y, star.size));

      Matter.Engine.update(matterRef.current.engine);

      for (const fw of fallingWords.current) {
        fw.y += fw.speed;
        p.push();
        p.translate(fw.x, fw.y);
        p.noStroke();
        p.fill(255, 255, 255, 100);
        p.ellipse(0, 0, 90, 50);
        p.fill(255, 240, 180);
        drawStar(p, 0, 0, 10, 25, 5);
        p.fill(30);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(14);
        p.text(fw.word, 0, 0);
        p.pop();
      }
      fallingWords.current = fallingWords.current.filter(w => w.y < p.height + 50);

      if (matterRef.current.ground) {
        p.noStroke();
        p.fill(30, 20, 40);
        p.rectMode(p.CENTER);
        p.rect(matterRef.current.ground.position.x, matterRef.current.ground.position.y, p.width / 2, 40);
      }

      pointsRef.current.forEach((pt, i) => {
        p.push();
        p.translate(pt.x, pt.y);
        p.fill(255);
        p.stroke(255);
        drawStar(p, 0, 0, 6, 12, 5);
        p.pop();

        p.fill(255);
        p.noStroke();
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(14);
        p.text(inputWordsRef.current[i], pt.x, pt.y - 18);

        if (i > 0) {
          const prev = pointsRef.current[i - 1];
          p.stroke(160, 180, 255, 200);
          p.strokeWeight(1.5);
          p.line(prev.x, prev.y, pt.x, pt.y);
        }
      });

      if (pointsRef.current.length === 4) {
        const first = pointsRef.current[0];
        const last = pointsRef.current[3];
        p.stroke(160, 180, 255, 200);
        p.strokeWeight(1.5);
        p.line(last.x, last.y, first.x, first.y);
      }

      for (const s of shapesRef.current) {
        const vertices = s.vertices;
        p.noFill();
        p.stroke(100, 200, 255, 100);
        p.strokeWeight(1.5);
        p.beginShape();
        for (const v of vertices) {
          p.vertex(v.x, v.y);
        }
        p.endShape(p.CLOSE);

        // Draw star at each vertex
        for (const v of vertices) {
          p.push();
          p.translate(v.x, v.y);
          p.fill(255);
          p.stroke(255);
          drawStar(p, 0, 0, 6, 12, 5);
          p.pop();
        }
      }

      p.noStroke();
      p.fill(255);
      p.textSize(24);
      p.textAlign(p.CENTER);
      p.text(`Score: ${scoreRef.current}`, p.width / 2, 40);
      p.text("Topic: Dreamy Dishes", p.width / 2, 75);

      if (gameOverRef.current) {
        p.noLoop();
        p.fill(255, 100, 100);
        p.textSize(40);
        p.textAlign(p.CENTER);
        p.text("Game Over", p.width / 2, p.height / 2);
      }
    };

    function drawStar(p: p5, x: number, y: number, radius1: number, radius2: number, npoints: number) {
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
  }, [addFallingWord]);

  const createShape = useCallback(() => {
    if (!matterRef.current.world || pointsRef.current.length !== 4) return;
    const centerX = pointsRef.current.reduce((sum, p) => sum + p.x, 0) / 4;
    const centerY = pointsRef.current.reduce((sum, p) => sum + p.y, 0) / 4;
    const scaled = pointsRef.current.map(p => ({
      x: centerX + (p.x - centerX),
      y: centerY + (p.y - centerY)
    }));
    const body = Matter.Bodies.fromVertices(centerX, centerY, [scaled], { restitution: 0.5 });
    Matter.World.add(matterRef.current.world, body);
    shapesRef.current.push(body);

    const averageHeight = pointsRef.current.reduce((sum, p) => sum + p.y, 0) / 4;
    const shapeScore = Math.max(1, Math.floor((600 - averageHeight) / 10));
    setScore(prev => prev + shapeScore);
    setPoints([]);
    setInputWords([]);
  }, [points]);

  const addWord = useCallback(() => {
    if (gameOver || !wordInput.trim()) return;
    const word = wordInput.trim();
    setWordInput("");

    const position = [Math.random() * 600 + 100, Math.random() * 300 + 100];
    const newPoint = { x: position[0], y: position[1] };
    setPoints(prev => [...prev, newPoint]);
    setInputWords(prev => [...prev, word]);
  }, [wordInput, gameOver]);

  useEffect(() => {
    const words = ["pizza", "sushi", "pasta", "burger", "ramen", "steak", "curry", "noodles"];
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

    if (points.length === 4) {
      createShape();
    }
  }, [score, gameOver, inputWords, points, createShape]);

  useEffect(() => {
    if (!p5Instance.current && canvasRef.current) {
      const existing = document.getElementById("main-canvas");
      if (existing) existing.remove();
      p5Instance.current = new p5(sketch, canvasRef.current);
    }
    return () => {
      p5Instance.current?.remove();
      p5Instance.current = null;
    };
  }, [sketch]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black">
      <div className="w-full flex justify-center">
        <div ref={canvasRef} className="z-0" />
      </div>
      <div className="flex flex-col items-center z-10 relative mt-4">
        <input
          id="word-input"
          type="text"
          value={wordInput}
          onChange={(e) => setWordInput(e.target.value)}
          className="outline rounded px-2 py-1 mb-1 bg-white text-black"
          placeholder="Enter a word"
          onKeyDown={(e) => {
            if (e.key === "Enter") addWord();
          }}
        />
        <button onClick={addWord} className="bg-blue-300 text-black px-3 py-1 rounded hover:bg-blue-400">
          Add Word
        </button>
      </div>
    </div>
  );
};

export default memo(Sketch);
