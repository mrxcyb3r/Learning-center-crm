import React, { useEffect, useRef } from 'react';

interface Particle {
  x: number;
  y: number;
  radius: number;
  color: string;
  speedY: number;
  speedX: number;
  opacity: number;
  twinkleSpeed: number;
  twinkleDirection: number;
}

export const ParticleBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Limit count for top performance
    const particleCount = Math.min(Math.floor((width * height) / 11000), 85);
    const colors = [
      'rgba(255, 255, 255, ',
      'rgba(245, 158, 11, ',  // warm amber glow
      'rgba(6, 182, 212, ',   // cyan star glow
      'rgba(147, 197, 253, ', // soft blue
      'rgba(236, 72, 153, '   // subtle magenta star
    ];

    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.8 + 0.6,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedY: Math.random() * 0.35 + 0.08, // gentle downward cosmic drift
      speedX: (Math.random() - 0.5) * 0.12, // light horizontal sway
      opacity: Math.random() * 0.7 + 0.2,
      twinkleSpeed: Math.random() * 0.015 + 0.005,
      twinkleDirection: Math.random() > 0.5 ? 1 : -1
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((p) => {
        // Drift movement
        p.y += p.speedY;
        p.x += p.speedX;

        // Wrap around boundaries
        if (p.y > height) {
          p.y = -5;
          p.x = Math.random() * width;
        }
        if (p.x > width) p.x = 0;
        if (p.x < 0) p.x = width;

        // Twinkle animation
        p.opacity += p.twinkleSpeed * p.twinkleDirection;
        if (p.opacity >= 0.85) {
          p.opacity = 0.85;
          p.twinkleDirection = -1;
        } else if (p.opacity <= 0.15) {
          p.opacity = 0.15;
          p.twinkleDirection = 1;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `${p.color}${p.opacity.toFixed(2)})`;
        ctx.shadowBlur = p.radius * 2.5;
        ctx.shadowColor = p.color + '0.6)';
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-70 dark:opacity-90 transition-opacity duration-300"
    />
  );
};
