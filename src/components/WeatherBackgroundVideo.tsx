import React, { useRef, useEffect } from 'react';

interface WeatherBackgroundVideoProps {
  currentVideoUrl: string;
  previousVideoUrl?: string;
  isTransitioning: boolean;
  transitionProgress: number; // 0.0 to 1.0
  posterUrl: string;
  isRaining?: boolean;
}

export const WeatherBackgroundVideo: React.FC<WeatherBackgroundVideoProps> = ({
  currentVideoUrl,
  previousVideoUrl,
  isTransitioning,
  transitionProgress,
  posterUrl,
  isRaining = true,
}) => {
  const currentVideoRef = useRef<HTMLVideoElement | null>(null);
  const previousVideoRef = useRef<HTMLVideoElement | null>(null);

  // Auto-play videos whenever URLs change
  useEffect(() => {
    if (currentVideoRef.current) {
      currentVideoRef.current.play().catch(() => {
        // Autoplay may need muted
        if (currentVideoRef.current) {
          currentVideoRef.current.muted = true;
          currentVideoRef.current.play().catch(() => {});
        }
      });
    }
  }, [currentVideoUrl]);

  useEffect(() => {
    if (previousVideoRef.current && isTransitioning) {
      previousVideoRef.current.play().catch(() => {});
    }
  }, [previousVideoUrl, isTransitioning]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none select-none z-0">
      {/* 1. Previous Video (Fading Out during transition) */}
      {previousVideoUrl && isTransitioning && (
        <video
          ref={previousVideoRef}
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
          style={{
            opacity: Math.max(0, 1 - transitionProgress),
            filter: 'brightness(0.92) contrast(1.04)',
          }}
        >
          <source src={previousVideoUrl.replace('.mp4', '.webm')} type="video/webm" />
          <source src={previousVideoUrl} type="video/mp4" />
        </video>
      )}

      {/* 2. Current Video (Fading In smoothly) */}
      <video
        ref={currentVideoRef}
        key={currentVideoUrl}
        poster={posterUrl}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        style={{
          opacity: isTransitioning ? transitionProgress : 1,
          filter: 'brightness(0.92) contrast(1.04)',
        }}
      >
        <source src={currentVideoUrl.replace('.mp4', '.webm')} type="video/webm" />
        <source src={currentVideoUrl} type="video/mp4" />
      </video>

      {/* 3. Atmospheric Procedural Rain Streaks Canvas on Glass Overlay */}
      {isRaining && <RainGlassCanvas />}
    </div>
  );
};

// Procedural dynamic raindrops and streaks on glass canvas
const RainGlassCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.clientWidth);
    let height = (canvas.height = canvas.clientHeight);

    interface Drop {
      x: number;
      y: number;
      radius: number;
      speed: number;
      length: number;
      opacity: number;
    }

    const drops: Drop[] = [];
    const dropCount = Math.floor(width * 0.12);

    for (let i = 0; i < dropCount; i++) {
      drops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: Math.random() * 2.2 + 0.8,
        speed: Math.random() * 0.4 + 0.1,
        length: Math.random() * 18 + 8,
        opacity: Math.random() * 0.45 + 0.15,
      });
    }

    let animId: number;

    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw subtle condensation layer
      ctx.fillStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.fillRect(0, 0, width, height);

      // Render drops
      for (const d of drops) {
        // Drop head
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${d.opacity})`;
        ctx.fill();

        // Wet drip trail
        ctx.beginPath();
        ctx.moveTo(d.x, d.y - d.length);
        ctx.lineTo(d.x, d.y);
        ctx.strokeStyle = `rgba(255, 255, 255, ${d.opacity * 0.4})`;
        ctx.lineWidth = d.radius * 0.8;
        ctx.stroke();

        // Specular micro-highlight
        ctx.beginPath();
        ctx.arc(d.x - d.radius * 0.3, d.y - d.radius * 0.3, d.radius * 0.35, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${d.opacity * 0.9})`;
        ctx.fill();

        // Move down
        d.y += d.speed;
        if (d.y > height + 20) {
          d.y = -10;
          d.x = Math.random() * width;
        }
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    const handleResize = () => {
      width = canvas.width = canvas.clientWidth;
      height = canvas.height = canvas.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
      style={{ opacity: 0.85 }}
    />
  );
};
