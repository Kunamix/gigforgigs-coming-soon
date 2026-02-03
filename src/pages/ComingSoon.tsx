import React, { useState, useEffect, useRef } from "react";

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
  mouseX: number;
  mouseY: number;
  canShoot: boolean;
  animationId: number | null;
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
  {
    width: "4px",
    height: "3px",
    left: "30%",
    top: "5%",
    animation: "float 12s infinite",
    animationDelay: "12s",
  },
  {
    width: "6px",
    height: "6px",
    left: "40%",
    top: "35%",
    animation: "float 20s infinite",
    animationDelay: "13s",
  },
  {
    width: "3px",
    height: "4px",
    left: "50%",
    top: "80%",
    animation: "float 14s infinite",
    animationDelay: "14s",
  },
  {
    width: "5px",
    height: "3px",
    left: "60%",
    top: "45%",
    animation: "float 16s infinite",
    animationDelay: "1s",
  },
  {
    width: "4px",
    height: "5px",
    left: "70%",
    top: "95%",
    animation: "float 19s infinite",
    animationDelay: "3s",
  },
  {
    width: "6px",
    height: "4px",
    left: "80%",
    top: "50%",
    animation: "float 13s infinite",
    animationDelay: "5s",
  },
  {
    width: "3px",
    height: "6px",
    left: "90%",
    top: "12%",
    animation: "float 17s infinite",
    animationDelay: "7s",
  },
  {
    width: "5px",
    height: "4px",
    left: "3%",
    top: "65%",
    animation: "float 11s infinite",
    animationDelay: "9s",
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

  // Use refs for game values to avoid re-creating the game loop
  const scoreRef = useRef<number>(0);
  const livesRef = useRef<number>(5);
  const highScoreRef = useRef<number>(getInitialHighScore());
  const gameOverRef = useRef<boolean>(false);

  const gameStateRef = useRef<GameState>({
    ship: { x: 0, y: 0, width: 30, height: 30 },
    bullets: [],
    asteroids: [],
    particles: [],
    mouseX: 0,
    mouseY: 0,
    canShoot: true,
    animationId: null,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const state = gameStateRef.current;

    // Set canvas size
    const resizeCanvas = (): void => {
      const parent = canvas.parentElement;
      if (!parent) return;

      // Get available space
      const parentWidth = parent.clientWidth;
      const parentHeight = parent.clientHeight;

      // Calculate optimal size maintaining aspect ratio
      const aspectRatio = 4 / 3;
      let canvasWidth = parentWidth;
      let canvasHeight = parentWidth / aspectRatio;

      // If height is too large, constrain by height
      if (canvasHeight > parentHeight) {
        canvasHeight = parentHeight;
        canvasWidth = parentHeight * aspectRatio;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
      state.ship.x = canvas.width / 2;
      state.ship.y = canvas.height - 50;
      state.mouseX = canvas.width / 2;
      state.mouseY = canvas.height - 50;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Mouse/Touch handlers
    const handleMouseMove = (e: MouseEvent): void => {
      const rect = canvas.getBoundingClientRect();
      state.mouseX = e.clientX - rect.left;
      state.mouseY = e.clientY - rect.top;
    };

    const handleTouchMove = (e: TouchEvent): void => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      state.mouseX = touch.clientX - rect.left;
      state.mouseY = touch.clientY - rect.top;
    };

    const shoot = (): void => {
      if (state.canShoot && !gameOverRef.current) {
        state.bullets.push({
          x: state.ship.x,
          y: state.ship.y,
          width: 4,
          height: 12,
          speed: 7,
        });
        state.canShoot = false;
        setTimeout(() => (state.canShoot = true), 200);
      }
    };

    const handleClick = (): void => shoot();
    const handleTouchStart = (e: TouchEvent): void => {
      e.preventDefault();
      shoot();
    };

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("touchmove", handleTouchMove, { passive: false });
    canvas.addEventListener("click", handleClick);
    canvas.addEventListener("touchstart", handleTouchStart, { passive: false });

    // Game functions
    const createAsteroid = (): void => {
      state.asteroids.push({
        x: Math.random() * (canvas.width - 30),
        y: -30,
        width: 25 + Math.random() * 20,
        height: 25 + Math.random() * 20,
        speed: 0.5 + Math.random() * 1,
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

    const update = (): void => {
      if (gameOverRef.current) return;

      // Update ship - slower movement
      state.ship.x += (state.mouseX - state.ship.x) * 0.05;
      state.ship.y += (state.mouseY - state.ship.y) * 0.05;
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
          // Ship stays in place - no position reset
        }
      }

      // Update particles
      state.particles = state.particles.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.02;
        return p.life > 0;
      });

      // Bullet collision - iterate backwards to avoid index issues
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
      if (Math.random() < 0.02) {
        createAsteroid();
      }
    };

    const draw = (): void => {
      ctx.fillStyle = "rgba(26, 26, 46, 0.2)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Stars
      ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
      for (let i = 0; i < 50; i++) {
        const x = (i * 123) % canvas.width;
        const y = (i * 456 + Date.now() * 0.01) % canvas.height;
        ctx.fillRect(x, y, 1, 1);
      }

      drawParticles();
      drawAsteroids();
      drawBullets();
      drawShip();
    };

    const gameLoop = (): void => {
      update();
      draw();
      state.animationId = requestAnimationFrame(gameLoop);
    };

    gameLoop();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("touchmove", handleTouchMove);
      canvas.removeEventListener("click", handleClick);
      canvas.removeEventListener("touchstart", handleTouchStart);
      if (state.animationId) {
        cancelAnimationFrame(state.animationId);
      }
    };
  }, []); // Empty dependency array - game loop runs once

  const restartGame = (): void => {
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
      state.ship.y = canvas.height - 50;
      state.mouseX = canvas.width / 2;
      state.mouseY = canvas.height - 50;
    }
  };

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

      <div className="container max-w-4xl w-full flex-1 min-h-0 px-4 sm:px-6 py-6 md:py-8 text-center relative z-10 flex flex-col justify-center overflow-visible mx-auto gap-3">
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-1 drop-shadow-lg coming-soon-title">
          Coming Soon
        </h1>
        <p className="text-base md:text-lg lg:text-xl mb-2 opacity-95 coming-soon-subtitle">
          We are building something new—stay tuned.
        </p>

        <div className="bg-white/10 backdrop-blur-md rounded-3xl p-3 md:p-6 shadow-2xl coming-soon-fade-in flex-1 flex flex-col overflow-visible border border-white/10">
          <h2 className="text-lg md:text-xl lg:text-2xl font-semibold mb-2 md:mb-3">
            Play While You Wait: Space Defender
          </h2>

          <div className="flex flex-col md:flex-row justify-around gap-2 md:gap-3 mb-3 md:mb-4">
            <div className="bg-white/15 px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm border border-white/10">
              <span className="font-semibold">Score</span>
              <span className="text-lg md:text-xl ml-2 font-semibold">
                {score}
              </span>
            </div>
            <div className="bg-white/15 px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm border border-white/10">
              <span className="font-semibold">High Score</span>
              <span className="text-lg md:text-xl ml-2 font-semibold">
                {highScore}
              </span>
            </div>
            <div className="bg-white/15 px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm border border-white/10 flex items-center justify-center gap-2">
              <span className="font-semibold">Lives</span>
              <span className="text-lg md:text-xl font-semibold">{lives}</span>
            </div>
          </div>

          <div className="relative flex-1 flex flex-col overflow-hidden w-full max-w-[min(100vw-2rem,640px)] self-center aspect-3/2 min-h-64">
            <canvas
              ref={canvasRef}
              className="w-full h-full max-w-full max-h-full bg-gradient-to-b from-[#0b1f33] to-[#0a2e42] rounded-2xl shadow-2xl mx-auto block"
              width="600"
              height="400"
              style={{ touchAction: "none" }}
            />

            {gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/85 rounded-2xl game-over-pop-in">
                <div className="text-center p-6 md:p-10 border border-red-500/70 rounded-3xl bg-black/80 max-w-md mx-4">
                  <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-red-400 mb-4 md:mb-6">
                    Game Over
                  </h2>
                  <p className="text-lg md:text-xl mb-2 md:mb-3">
                    Final Score:{" "}
                    <strong className="text-2xl md:text-3xl">
                      {finalScore}
                    </strong>
                  </p>
                  <p className="text-lg md:text-xl mb-6 md:mb-8">
                    High Score:{" "}
                    <strong className="text-2xl md:text-3xl">
                      {highScore}
                    </strong>
                  </p>
                  <button
                    onClick={restartGame}
                    className="px-8 md:px-10 py-3 md:py-4 text-lg md:text-xl font-bold bg-gradient-to-r from-[#0ea5e9] to-[#2563eb] rounded-full hover:scale-105 transition-transform shadow-lg"
                  >
                    Play Again
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 md:mt-3 text-xs md:text-sm opacity-90">
            <p className="font-semibold mb-1">Controls:</p>
            <p>
              Move mouse or touch to steer. Click or tap to shoot. Destroy
              asteroids to score.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
