import { useRef, useState } from "react";

/**
 * Tilt3D - Ultra-smooth 60fps GPU-accelerated tilt component with dynamic specular glare.
 * Wraps any card, widget, or button in full perspective space.
 */
export default function Tilt3D({
  children,
  maxTilt = 12,
  perspective = 1000,
  scale = 1.02,
  glare = true,
  glareColor = "255, 235, 170",
  float = false,
  className = "",
  style = {},
  onClick,
}) {
  const containerRef = useRef(null);
  const [coords, setCoords] = useState({ rotateX: 0, rotateY: 0, scale: 1 });
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50, opacity: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const rotateX = (0.5 - y) * (maxTilt * 2);
    const rotateY = (x - 0.5) * (maxTilt * 2);

    setCoords({ rotateX, rotateY, scale });
    if (glare) {
      setGlarePos({
        x: x * 100,
        y: y * 100,
        opacity: 0.35,
      });
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setCoords({ rotateX: 0, rotateY: 0, scale: 1 });
    if (glare) {
      setGlarePos((prev) => ({ ...prev, opacity: 0 }));
    }
  };

  const transformStyle = isHovered
    ? `perspective(${perspective}px) rotateX(${coords.rotateX.toFixed(2)}deg) rotateY(${coords.rotateY.toFixed(2)}deg) scale3d(${coords.scale}, ${coords.scale}, ${coords.scale})`
    : `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={`${float && !isHovered ? "floating-3d" : ""} ${className}`}
      style={{
        transform: transformStyle,
        transition: isHovered
          ? "transform 0.08s ease-out"
          : "transform 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s ease",
        transformStyle: "preserve-3d",
        position: "relative",
        willChange: "transform",
        ...style,
      }}
    >
      {children}

      {/* Dynamic Specular Sheen Layer */}
      {glare && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: style?.borderRadius || (className?.includes("rounded-full") ? "50%" : "inherit"),
            pointerEvents: "none",
            zIndex: 10,
            overflow: "hidden",
            background: `radial-gradient(circle 280px at ${glarePos.x}% ${glarePos.y}%, rgba(${glareColor}, ${glarePos.opacity}), transparent 80%)`,
            transition: "opacity 0.25s ease",
          }}
        />
      )}
    </div>
  );
}
