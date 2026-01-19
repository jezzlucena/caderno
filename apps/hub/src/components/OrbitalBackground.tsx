import { useEffect, useRef } from 'react';

interface OrbitalBackgroundProps {
  className?: string;
}

export function OrbitalBackground({ className = '' }: OrbitalBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configuration
    const particleCount = 74;
    const baseSpeed = 0.3;
    const gravityStrength = 0.00015;
    const orbitStrength = 0.00008;

    // State
    let width = 0;
    let height = 0;
    let mouse = { x: 0, y: 0, active: false };
    let isDark = document.documentElement.classList.contains('dark');
    let animationId: number;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
    }

    const particles: Particle[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);

      // Initialize particles if empty
      if (particles.length === 0) {
        for (let i = 0; i < particleCount; i++) {
          particles.push({
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * baseSpeed,
            vy: (Math.random() - 0.5) * baseSpeed,
            size: 1.5 + Math.random() * 2,
            alpha: 0.3 + Math.random() * 0.4,
          });
        }
      }

      // Reset mouse to center
      mouse.x = width / 2;
      mouse.y = height / 2;
    };

    const update = () => {
      for (const p of particles) {
        if (mouse.active) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq);

          if (dist > 5) {
            // Gravitational pull
            const force = gravityStrength / (distSq * 0.0001 + 1);
            p.vx += dx * force;
            p.vy += dy * force;

            // Orbital component (perpendicular force)
            const orbit = orbitStrength / (dist * 0.01 + 1);
            p.vx += -dy * orbit;
            p.vy += dx * orbit;
          }
        }

        // Apply velocity with damping
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Wrap around edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      }
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      const particleColor = isDark ? '79, 70, 229' : '79, 70, 229';
      const lineColor = isDark ? '79, 70, 229' : '79, 70, 229';

      // Draw connections
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 100) {
            const alpha = (1 - dist / 100) * 0.15;
            ctx.strokeStyle = `rgba(${lineColor}, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      for (const p of particles) {
        ctx.fillStyle = `rgba(${particleColor}, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Mouse glow
      if (mouse.active) {
        const gradient = ctx.createRadialGradient(
          mouse.x, mouse.y, 0,
          mouse.x, mouse.y, 120
        );
        gradient.addColorStop(0, `rgba(${particleColor}, 0.05)`);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, 120, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const animate = () => {
      update();
      render();
      animationId = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
    };

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Push particles away from click
      for (const p of particles) {
        const dx = p.x - clickX;
        const dy = p.y - clickY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150 && dist > 0) {
          const force = (1 - dist / 150) * 3;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }
      }
    };

    // Theme observer
    const observer = new MutationObserver(() => {
      isDark = document.documentElement.classList.contains('dark');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    resize();
    window.addEventListener('resize', resize);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleClick);
    animationId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleClick);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
    />
  );
}
