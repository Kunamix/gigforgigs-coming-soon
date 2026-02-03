import React, { useState, useEffect, useRef, useCallback } from "react";

// Type Definitions
interface Ship {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
}

interface Asteroid {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  rotation: number;
  rotationSpeed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

interface GameState {
  ship: Ship;
  bullets: Bullet[];
  asteroids: Asteroid[];
  particles: Particle[];
  targetX: number;
  targetY: number;
  canShoot: boolean;
  animationId: number | null;
  keys: { [key: string]: boolean };
}

interface BackgroundParticle {
  width: string;
  height: string;
  left: string;
  top: string;
  animation: string;
  animationDelay: string;
}

// Pre-generated background particles (static, deterministic values)
const BACKGROUND_PARTICLES: BackgroundParticle[] = [
  {
    width: "4px",
    height: "3px",
    left: "5%",
    top: "10%",
    animation: "float 15s infinite",
    animationDelay: "0s",
  },
  {
    width: "6px",
    height: "5px",
    left: "15%",
    top: "25%",
    animation: "float 18s infinite",
    animationDelay: "2s",
  },
  {
    width: "3px",
    height: "4px",
    left: "25%",
    top: "40%",
    animation: "float 12s infinite",
    animationDelay: "4s",
  },
  {
    width: "5px",
    height: "6px",
    left: "35%",
    top: "15%",
    animation: "float 20s infinite",
    animationDelay: "1s",
  },
  {
    width: "4px",
    height: "4px",
    left: "45%",
    top: "55%",
    animation: "float 14s infinite",
    animationDelay: "6s",
  },
  {
    width: "6px",
    height: "3px",
    left: "55%",
    top: "70%",
    animation: "float 16s infinite",
    animationDelay: "3s",
  },
  {
    width: "3px",
    height: "5px",
    left: "65%",
    top: "30%",
    animation: "float 19s infinite",
    animationDelay: "5s",
  },
  {
    width: "5px",
    height: "4px",
    left: "75%",
    top: "85%",
    animation: "float 13s infinite",
    animationDelay: "7s",
  },
  {
    width: "4px",
    height: "6px",
    left: "85%",
    top: "20%",
    animation: "float 17s infinite",
    animationDelay: "8s",
  },
  {
    width: "6px",
    height: "4px",
    left: "92%",
    top: "60%",
    animation: "float 11s infinite",
    animationDelay: "9s",
  },
  {
    width: "3px",
    height: "3px",
    left: "8%",
    top: "75%",
    animation: "float 15s infinite",
    animationDelay: "10s",
  },
  {
    width: "5px",
    height: "5px",
    left: "20%",
    top: "90%",
    animation: "float 18s infinite",
    animationDelay: "11s",
  },
];

// Get initial high score from localStorage
const getInitialHighScore = (): number => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("spaceDefenderHighScore");
    return saved ? parseInt(saved) : 0;
  }
  return 0;
};

const ComingSoon: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(getInitialHighScore);
  const [lives, setLives] = useState<number>(5);
  const [gameOver, setGameOver] = useState<boolean>(false);
  const [finalScore, setFinalScore] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Use refs for game values to avoid re-creating the game loop
  const scoreRef = useRef<number>(0);
  const livesRef = useRef<number>(5);
  const highScoreRef = useRef<number>(getInitialHighScore());
  const gameOverRef = useRef<boolean>(false);
  const isPlayingRef = useRef<boolean>(false);

  const gameStateRef = useRef<GameState>({
    ship: { x: 0, y: 0, width: 30, height: 30 },
    bullets: [],
    asteroids: [],
    particles: [],
    targetX: 0,
    targetY: 0,
    canShoot: true,
    animationId: null,
    keys: {},
  });

  const startGame = useCallback(() => {
    setIsPlaying(true);
    isPlayingRef.current = true;
    gameOverRef.current = false;
    scoreRef.current = 0;
    livesRef.current = 5;
    setGameOver(false);
    setScore(0);
    setLives(5);
    setFinalScore(0);
    const state = gameStateRef.current;
    state.bullets = [];
    state.asteroids = [];
    state.particles = [];
    state.keys = {};
  }, []);

  const exitGame = useCallback(() => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    const state = gameStateRef.current;
    if (state.animationId) {
      cancelAnimationFrame(state.animationId);
      state.animationId = null;
    }
    state.bullets = [];
    state.asteroids = [];
    state.particles = [];
    state.keys = {};
  }, []);

  const restartGame = useCallback(() => {
    gameOverRef.current = false;
    scoreRef.current = 0;
    livesRef.current = 5;
    setGameOver(false);
    setScore(0);
    setLives(5);
    setFinalScore(0);
    const state = gameStateRef.current;
    state.bullets = [];
    state.asteroids = [];
    state.particles = [];
    const canvas = canvasRef.current;
    if (canvas) {
      state.ship.x = canvas.width / 2;
      state.ship.y = canvas.height - 80;
      state.targetX = canvas.width / 2;
      state.targetY = canvas.height - 80;
    }
  }, []);

  useEffect(() => {
    if (!isPlaying) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;

    // Set canvas size to full window
    const resizeCanvas = (): void => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      state.ship.x = canvas.width / 2;
      state.ship.y = canvas.height - 80;
      state.targetX = canvas.width / 2;
      state.targetY = canvas.height - 80;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Keyboard handlers
    const handleKeyDown = (e: KeyboardEvent): void => {
      state.keys[e.key] = true;
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        shoot();
      }
      if (e.key === "Escape") {
        exitGame();
      }
    };

    const handleKeyUp = (e: KeyboardEvent): void => {
      state.keys[e.key] = false;
    };

    // Mouse/Touch handlers
    const handleMouseMove = (e: MouseEvent): void => {
      state.targetX = e.clientX;
      state.targetY = e.clientY;
    };

    const handleTouchMove = (e: TouchEvent): void => {
      e.preventDefault();
      const touch = e.touches[0];
      state.targetX = touch.clientX;
      state.targetY = touch.clientY;
    };

    const shoot = (): void => {
      if (state.canShoot && !gameOverRef.current) {
        state.bullets.push({
          x: state.ship.x,
          y: state.ship.y,
          width: 4,
          height: 12,
          speed: 10,
        });
        state.canShoot = false;
        setTimeout(() => (state.canShoot = true), 150);
      }
    };

    const handleClick = (): void => shoot();
    const handleTouchStart = (e: TouchEvent): void => {
      e.preventDefault();
      const touch = e.touches[0];
      state.targetX = touch.clientX;
      state.targetY = touch.clientY;
      shoot();
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });

    // Game functions
    const createAsteroid = (): void => {
      state.asteroids.push({
        x: Math.random() * (canvas.width - 60),
        y: -60,
        width: 40 + Math.random() * 40,
        height: 40 + Math.random() * 40,
        speed: 1 + Math.random() * 1.5,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
      });
    };

    const createParticles = (x: number, y: number): void => {
      for (let i = 0; i < 8; i++) {
        state.particles.push({
          x: x,
          y: y,
          vx: (Math.random() - 0.5) * 4,
          vy: (Math.random() - 0.5) * 4,
          life: 1,
        });
      }
    };

    const drawShip = (): void => {
      ctx.save();
      ctx.translate(state.ship.x, state.ship.y);

      ctx.fillStyle = "#00d4ff";
      ctx.beginPath();
      ctx.moveTo(0, -15);
      ctx.lineTo(-12, 15);
      ctx.lineTo(0, 10);
      ctx.lineTo(12, 15);
      ctx.closePath();
      ctx.fill();

      ctx.shadowBlur = 15;
      ctx.shadowColor = "#00d4ff";
      ctx.stroke();

      ctx.restore();
    };

    const drawBullets = (): void => {
      ctx.fillStyle = "#ff6b6b";
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#ff6b6b";
      state.bullets.forEach((bullet) => {
        ctx.fillRect(
          bullet.x - bullet.width / 2,
          bullet.y,
          bullet.width,
          bullet.height,
        );
      });
      ctx.shadowBlur = 0;
    };

    const drawAsteroids = (): void => {
      state.asteroids.forEach((asteroid) => {
        ctx.save();
        ctx.translate(
          asteroid.x + asteroid.width / 2,
          asteroid.y + asteroid.height / 2,
        );
        ctx.rotate(asteroid.rotation);

        ctx.fillStyle = "#8b5cf6";
        ctx.strokeStyle = "#a78bfa";
        ctx.lineWidth = 2;

        ctx.beginPath();
        const sides = 8;
        for (let i = 0; i < sides; i++) {
          const angle = (i / sides) * Math.PI * 2;
          const radius = asteroid.width / 2 + Math.sin(i) * 3;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
      });
    };

    const drawParticles = (): void => {
      state.particles.forEach((p) => {
        ctx.fillStyle = `rgba(255, 107, 107, ${p.life})`;
        ctx.fillRect(p.x, p.y, 3, 3);
      });
    };

    const SHIP_SPEED = 6;

    const update = (): void => {
      if (gameOverRef.current) return;

      // Keyboard movement
      if (state.keys["ArrowUp"] || state.keys["w"] || state.keys["W"]) {
        state.ship.y -= SHIP_SPEED;
      }
      if (state.keys["ArrowDown"] || state.keys["s"] || state.keys["S"]) {
        state.ship.y += SHIP_SPEED;
      }
      if (state.keys["ArrowLeft"] || state.keys["a"] || state.keys["A"]) {
        state.ship.x -= SHIP_SPEED;
      }
      if (state.keys["ArrowRight"] || state.keys["d"] || state.keys["D"]) {
        state.ship.x += SHIP_SPEED;
      }

      // Mouse/touch follow (only if no keys pressed)
      const anyKeyPressed =
        state.keys["ArrowUp"] ||
        state.keys["ArrowDown"] ||
        state.keys["ArrowLeft"] ||
        state.keys["ArrowRight"] ||
        state.keys["w"] ||
        state.keys["a"] ||
        state.keys["s"] ||
        state.keys["d"] ||
        state.keys["W"] ||
        state.keys["A"] ||
        state.keys["S"] ||
        state.keys["D"];

      if (!anyKeyPressed) {
        state.ship.x += (state.targetX - state.ship.x) * 0.08;
        state.ship.y += (state.targetY - state.ship.y) * 0.08;
      }

      // Clamp ship position
      state.ship.x = Math.max(20, Math.min(canvas.width - 20, state.ship.x));
      state.ship.y = Math.max(20, Math.min(canvas.height - 20, state.ship.y));

      // Update bullets
      state.bullets = state.bullets.filter((bullet) => {
        bullet.y -= bullet.speed;
        return bullet.y > -bullet.height;
      });

      // Update asteroids
      state.asteroids = state.asteroids.filter((asteroid) => {
        asteroid.y += asteroid.speed;
        asteroid.rotation += asteroid.rotationSpeed;

        if (asteroid.y > canvas.height + 50) {
          livesRef.current -= 1;
          setLives(livesRef.current);
          createParticles(asteroid.x + asteroid.width / 2, canvas.height);

          if (livesRef.current <= 0) {
            gameOverRef.current = true;
            setGameOver(true);
            setFinalScore(scoreRef.current);
          }
          return false;
        }

        return true;
      });

      // Ship collision
      for (let index = state.asteroids.length - 1; index >= 0; index--) {
        const asteroid = state.asteroids[index];
        const dx = state.ship.x - (asteroid.x + asteroid.width / 2);
        const dy = state.ship.y - (asteroid.y + asteroid.height / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < asteroid.width / 2 + 15) {
          state.asteroids.splice(index, 1);
          livesRef.current -= 1;
          setLives(livesRef.current);
          createParticles(
            asteroid.x + asteroid.width / 2,
            asteroid.y + asteroid.height / 2,
          );
          createParticles(state.ship.x, state.ship.y);

          if (livesRef.current <= 0) {
            gameOverRef.current = true;
            setGameOver(true);
            setFinalScore(scoreRef.current);
          }
        }
      }

      // Update particles
      state.particles = state.particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        return p.life > 0;
      });

      // Bullet collision
      for (let bIndex = state.bullets.length - 1; bIndex >= 0; bIndex--) {
        const bullet = state.bullets[bIndex];
        let bulletHit = false;

        for (let aIndex = state.asteroids.length - 1; aIndex >= 0; aIndex--) {
          const asteroid = state.asteroids[aIndex];
          const dx = bullet.x - (asteroid.x + asteroid.width / 2);
          const dy = bullet.y - (asteroid.y + asteroid.height / 2);
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < asteroid.width / 2) {
            state.asteroids.splice(aIndex, 1);
            createParticles(
              asteroid.x + asteroid.width / 2,
              asteroid.y + asteroid.height / 2,
            );
            scoreRef.current += 10;
            setScore(scoreRef.current);

            if (scoreRef.current > highScoreRef.current) {
              highScoreRef.current = scoreRef.current;
              setHighScore(highScoreRef.current);
              localStorage.setItem(
                "spaceDefenderHighScore",
                highScoreRef.current.toString(),
              );
            }
            bulletHit = true;
            break;
          }
        }

        if (bulletHit) {
          state.bullets.splice(bIndex, 1);
        }
      }

      // Spawn asteroids
      if (Math.random() < 0.025) {
        createAsteroid();
      }
    };

    const draw = (): void => {
      // Clear with space background
      ctx.fillStyle = "#0a0a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      for (let i = 0; i < 100; i++) {
        const x = (i * 137) % canvas.width;
        const y = (i * 349 + Date.now() * 0.02) % canvas.height;
        ctx.fillRect(x, y, 1, 1);
      }

      drawParticles();
      drawAsteroids();
      drawBullets();
      drawShip();
    };

    const gameLoop = (): void => {
      if (!isPlayingRef.current) return;
      update();
      draw();
      state.animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("touchstart", handleTouchStart);
      if (state.animationId) {
        cancelAnimationFrame(state.animationId);
      }
    };
  }, [isPlaying, exitGame]);

  // Fullscreen game mode
  if (isPlaying) {
    return (
      <div className="fixed inset-0 bg-[#0a0a1a] z-50">
        <canvas
          ref={canvasRef}
          className="w-full h-full block"
          style={{ touchAction: "none" }}
        />

        {/* HUD - Top Left */}
        <div className="fixed top-3 left-3 flex items-center gap-3 text-white text-xs font-mono z-50">
          <span className="bg-black/50 px-2 py-1 rounded">Score: {score}</span>
          <span className="bg-black/50 px-2 py-1 rounded">
            Best: {highScore}
          </span>
          <span className="bg-black/50 px-2 py-1 rounded">Lives: {lives}</span>
        </div>

        {/* Exit Button - Top Right */}
        <button
          onClick={exitGame}
          className="fixed top-3 right-3 w-8 h-8 bg-black/50 hover:bg-red-500/70 rounded flex items-center justify-center text-white text-lg font-bold z-50 transition-colors"
          title="Exit Game (Esc)"
        >
          ×
        </button>

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/85 z-50">
            <div className="text-center p-8 border border-red-500/50 rounded-2xl bg-black/90 max-w-sm mx-4">
              <h2 className="text-3xl md:text-4xl font-bold text-red-400 mb-4">
                Game Over
              </h2>
              <p className="text-lg mb-2 text-white">
                Score: <strong className="text-2xl">{finalScore}</strong>
              </p>
              <p className="text-lg mb-6 text-white">
                Best: <strong className="text-2xl">{highScore}</strong>
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={restartGame}
                  className="px-6 py-3 text-base font-bold bg-gradient-to-r from-[#0ea5e9] to-[#2563eb] rounded-full hover:scale-105 transition-transform text-white"
                >
                  Play Again
                </button>
                <button
                  onClick={exitGame}
                  className="px-6 py-3 text-base font-bold bg-white/10 border border-white/20 rounded-full hover:bg-white/20 transition-colors text-white"
                >
                  Exit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Controls hint */}
        <div className="fixed bottom-3 left-1/2 -translate-x-1/2 text-white/50 text-xs font-mono z-50">
          Arrow keys / WASD to move • Space / Click to shoot • Esc to exit
        </div>
      </div>
    );
  }

  // Coming Soon page with Start Game button
  return (
    <div className="min-h-dvh w-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#0b1f33] to-[#0ea5e9] text-white overflow-x-hidden overflow-y-auto relative">
      {/* Animated Background Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {BACKGROUND_PARTICLES.map((particle, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-30 particle-float"
            style={{
              width: particle.width,
              height: particle.height,
              left: particle.left,
              top: particle.top,
              animation: particle.animation,
              animationDelay: particle.animationDelay,
            }}
          />
        ))}
      </div>

      {/* Top Right Redirect Button */}
      <a
        href="https://kunamix.com"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute top-4 right-4 z-50 px-4 py-2 bg-white/15 backdrop-blur-sm rounded-full hover:bg-white/25 transition-all shadow-lg text-xs md:text-sm font-semibold pointer-events-auto border border-white/20"
      >
        Visit Kunamix
      </a>

      <div className="container max-w-3xl w-full px-4 sm:px-6 py-8 md:py-12 text-center relative z-10 flex flex-col items-center justify-center gap-6">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold drop-shadow-lg coming-soon-title">
          Coming Soon
        </h1>
        <p className="text-lg md:text-xl lg:text-2xl opacity-90 coming-soon-subtitle max-w-xl">
          We are building something new. Stay tuned for updates.
        </p>

        {/* Start Game Card */}
        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 md:p-8 shadow-2xl coming-soon-fade-in border border-white/10 max-w-md w-full mt-4">
          <h2 className="text-xl md:text-2xl font-semibold mb-3">
            Space Defender
          </h2>
          <p className="text-sm md:text-base opacity-80 mb-5">
            Play a quick game while you wait. Destroy asteroids and survive as
            long as you can.
          </p>

          {highScore > 0 && (
            <p className="text-sm opacity-70 mb-4">
              Your best score: <span className="font-bold">{highScore}</span>
            </p>
          )}

          <button
            onClick={startGame}
            className="w-full px-8 py-4 text-lg font-bold bg-gradient-to-r from-[#0ea5e9] to-[#2563eb] rounded-2xl hover:scale-105 transition-transform shadow-lg"
          >
            Start Game
          </button>

          <p className="text-xs opacity-60 mt-4">
            Use arrow keys or mouse to move. Click or press space to shoot.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
