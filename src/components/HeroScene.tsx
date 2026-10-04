'use client';

import { useEffect, useRef } from 'react';
import styles from '@/styles/HeroScene.module.css';

type Particle = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  phase: number;
  opacity: number;
  color: string;
};

const COLORS = ['220, 240, 255', '255, 250, 225', '190, 225, 255'];
const FRAME_MS = 1000 / 30;

export default function HeroScene() {
  const sceneRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    const canvas = canvasRef.current;
    const hero = scene?.parentElement;
    const context = canvas?.getContext('2d');
    if (!scene || !canvas || !hero || !context) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let inView = false;
    let frame = 0;
    let lastTime = 0;
    let elapsed = 0;
    let pointerX = 0;
    let pointerY = 0;
    let targetX = 0;
    let targetY = 0;

    const resetPointer = () => {
      targetX = targetY = pointerX = pointerY = 0;
      scene.style.setProperty('--pointer-x', '0px');
      scene.style.setProperty('--pointer-y', '0px');
    };

    const resize = () => {
      const bounds = scene.getBoundingClientRect();
      width = bounds.width;
      height = bounds.height;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      particles = Array.from({ length: width <= 768 ? 18 : 42 }, (_, index) => ({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 0.7 + Math.random() * 1.8,
        speed: 6 + Math.random() * 14,
        phase: Math.random() * Math.PI * 2,
        opacity: 0.22 + Math.random() * 0.4,
        color: COLORS[index % COLORS.length],
      }));
    };

    const animate = (time: number) => {
      frame = window.requestAnimationFrame(animate);
      if (lastTime && time - lastTime < FRAME_MS) return;
      // Clamp the step after a stall so particles never jump across the image.
      const delta = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 1 / 30;
      lastTime = time;
      elapsed += delta;
      context.clearRect(0, 0, width, height);

      pointerX += (targetX - pointerX) * 0.075;
      pointerY += (targetY - pointerY) * 0.075;
      scene.style.setProperty('--pointer-x', `${pointerX.toFixed(3)}px`);
      scene.style.setProperty('--pointer-y', `${pointerY.toFixed(3)}px`);

      for (const particle of particles) {
        particle.y -= particle.speed * delta;
        particle.x += Math.sin(elapsed * 0.35 + particle.phase) * delta * 5;
        if (particle.y < -12) {
          particle.y = height + 12;
          particle.x = Math.random() * width;
        }
        if (particle.x < -12) particle.x = width + 12;
        if (particle.x > width + 12) particle.x = -12;

        const shimmer = 0.7 + Math.sin(elapsed * 0.8 + particle.phase) * 0.3;
        context.beginPath();
        context.fillStyle = `rgba(${particle.color}, ${particle.opacity * shimmer})`;
        context.shadowColor = `rgba(${particle.color}, 0.5)`;
        context.shadowBlur = particle.radius * 3;
        context.arc(particle.x + pointerX * 1.5, particle.y + pointerY * 1.5, particle.radius, 0, Math.PI * 2);
        context.fill();
      }
    };

    const updateMotion = () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
      if (reducedMotion.matches) {
        scene.dataset.motion = 'reduced';
        resetPointer();
        context.clearRect(0, 0, width, height);
      } else if (inView && !document.hidden) {
        scene.dataset.motion = 'active';
        frame = window.requestAnimationFrame(animate);
      } else {
        scene.dataset.motion = 'paused';
      }
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!finePointer.matches || reducedMotion.matches || event.pointerType === 'touch') return;
      const bounds = hero.getBoundingClientRect();
      targetX = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1)) * -8;
      targetY = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1)) * -6;
    };
    const onPointerLeave = () => { targetX = targetY = 0; };
    const onPointerChange = () => { if (!finePointer.matches) resetPointer(); };
    const onResize = () => { resize(); updateMotion(); };

    resize();
    const resizeObserver = new ResizeObserver(onResize);
    resizeObserver.observe(scene);
    const visibilityObserver = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      updateMotion();
    });
    visibilityObserver.observe(hero);
    // Also refresh pixel density when a window moves between displays.
    window.addEventListener('resize', onResize, { passive: true });
    hero.addEventListener('pointermove', onPointerMove, { passive: true });
    hero.addEventListener('pointerleave', onPointerLeave);
    document.addEventListener('visibilitychange', updateMotion);
    reducedMotion.addEventListener('change', updateMotion);
    finePointer.addEventListener('change', onPointerChange);
    updateMotion();

    return () => {
      window.cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      window.removeEventListener('resize', onResize);
      hero.removeEventListener('pointermove', onPointerMove);
      hero.removeEventListener('pointerleave', onPointerLeave);
      document.removeEventListener('visibilitychange', updateMotion);
      reducedMotion.removeEventListener('change', updateMotion);
      finePointer.removeEventListener('change', onPointerChange);
    };
  }, []);

  return (
    <div ref={sceneRef} className={styles.scene} data-hero-scene data-motion="paused" aria-hidden="true">
      <div className={styles.imageFrame} data-hero-image-frame>
        <div className={styles.image} data-hero-image />
      </div>
      <div className={styles.ambient} />
      <canvas ref={canvasRef} className={styles.particles} />
    </div>
  );
}
