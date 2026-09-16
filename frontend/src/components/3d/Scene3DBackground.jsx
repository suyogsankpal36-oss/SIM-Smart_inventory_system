import { useEffect, useRef } from "react";

/**
 * Scene3DBackground - Lightweight 60fps constellation & isometric node canvas.
 * Renders floating particle vertices connected with glowing perspective filaments.
 */
export default function Scene3DBackground({
  particleCount = 35,
  interactive = true,
  opacity = 0.35,
  color = "212, 175, 55", // Metallic Gold RGB
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Mouse tilt tracking
    let targetRotX = 0;
    let targetRotY = 0;
    let currentRotX = 0;
    let currentRotY = 0;

    const handleMouseMove = (e) => {
      if (!interactive) return;
      const nx = (e.clientX / width) * 2 - 1;
      const ny = (e.clientY / height) * 2 - 1;
      targetRotY = nx * 0.35;
      targetRotX = -ny * 0.35;
    };

    if (interactive) {
      window.addEventListener("mousemove", handleMouseMove);
    }

    // Generate particles in a sphere/cube volume
    const particles = [];
    const spread = Math.min(width, height) * 0.9;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: (Math.random() - 0.5) * spread,
        y: (Math.random() - 0.5) * spread,
        z: (Math.random() - 0.5) * 500,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        vz: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2.5 + 1.5,
      });
    }

    const fov = 450;

    const render = () => {
      if (document.hidden) {
        animationId = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      // Smooth camera interpolation
      currentRotX += (targetRotX - currentRotX) * 0.05;
      currentRotY += (targetRotY - currentRotY) * 0.05;

      const cosX = Math.cos(currentRotX);
      const sinX = Math.sin(currentRotX);
      const cosY = Math.cos(currentRotY);
      const sinY = Math.sin(currentRotY);

      const projected = [];
      const cx = width / 2;
      const cy = height / 2;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Animate drift
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Bounce back into volume
        const bound = spread / 2;
        if (p.x < -bound || p.x > bound) p.vx *= -1;
        if (p.y < -bound || p.y > bound) p.vy *= -1;
        if (p.z < -250 || p.z > 250) p.vz *= -1;

        // Rotation Math
        // Rotate around Y
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;

        // Rotate around X
        const y1 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;

        // Perspective Projection
        const scale = fov / (fov + z2 + 300);
        const px = cx + x1 * scale;
        const py = cy + y1 * scale;
        const alpha = Math.max(0.1, Math.min(1, scale * 0.9)) * opacity;

        projected.push({ px, py, scale, alpha, p });

        // Draw glowing particle node
        ctx.beginPath();
        ctx.arc(px, py, Math.max(1, p.radius * scale), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color}, ${alpha})`;
        ctx.shadowBlur = 10 * scale;
        ctx.shadowColor = `rgba(${color}, 0.5)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Draw connecting filaments between close points
      ctx.lineWidth = 0.8;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const p1 = projected[i];
          const p2 = projected[j];
          const dx = p1.px - p2.px;
          const dy = p1.py - p2.py;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const lineAlpha = (1 - dist / 130) * Math.min(p1.alpha, p2.alpha) * 0.7;
            ctx.beginPath();
            ctx.moveTo(p1.px, p1.py);
            ctx.lineTo(p2.px, p2.py);
            ctx.strokeStyle = `rgba(${color}, ${lineAlpha})`;
            ctx.stroke();
          }
        }
      }

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      if (interactive) {
        window.removeEventListener("mousemove", handleMouseMove);
      }
    };
  }, [particleCount, interactive, opacity, color]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 0,
        opacity: 0.85,
      }}
    />
  );
}
