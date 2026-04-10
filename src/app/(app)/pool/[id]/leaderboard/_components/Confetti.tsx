"use client";

import { useEffect, useState, useRef } from "react";

const COLORS = ["#C4973B", "#2D7A4F", "#1B5E3B", "#A3342D", "#3B6B8A", "#8A6B1E"];
const PARTICLE_COUNT = 60;

interface Particle {
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  velocityX: number;
  velocityY: number;
  rotationSpeed: number;
  opacity: number;
  shape: "rect" | "circle";
}

function createParticle(): Particle {
  return {
    x: 50 + (Math.random() - 0.5) * 40,
    y: -10 - Math.random() * 20,
    rotation: Math.random() * 360,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    size: 4 + Math.random() * 6,
    velocityX: (Math.random() - 0.5) * 3,
    velocityY: 1.5 + Math.random() * 3,
    rotationSpeed: (Math.random() - 0.5) * 8,
    opacity: 1,
    shape: Math.random() > 0.5 ? "rect" : "circle",
  };
}

export function Confetti({ poolId }: { poolId: string }) {
  const [show, setShow] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const key = `confetti-shown-${poolId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    setShow(true);
    setParticles(Array.from({ length: PARTICLE_COUNT }, createParticle));

    let frame = 0;
    const maxFrames = 120; // ~2 seconds at 60fps

    function animate() {
      frame++;
      if (frame > maxFrames) {
        setShow(false);
        return;
      }

      setParticles((prev) =>
        prev.map((p) => ({
          ...p,
          x: p.x + p.velocityX * 0.3,
          y: p.y + p.velocityY * 0.5,
          rotation: p.rotation + p.rotationSpeed,
          velocityY: p.velocityY + 0.05, // gravity
          opacity: frame > maxFrames - 30 ? Math.max(0, p.opacity - 0.035) : p.opacity,
        }))
      );

      frameRef.current = requestAnimationFrame(animate);
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, [poolId]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden" aria-hidden="true">
      {particles.map((p, i) => (
        <div
          key={i}
          className={p.shape === "circle" ? "rounded-full" : ""}
          style={{
            position: "absolute",
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.shape === "rect" ? p.size * 0.6 : p.size,
            backgroundColor: p.color,
            transform: `rotate(${p.rotation}deg)`,
            opacity: p.opacity,
            willChange: "transform, top, left, opacity",
          }}
        />
      ))}
    </div>
  );
}
