import { Loader2 } from "lucide-react";

/**
 * Button3D - Standardized tactile button with physical depression,
 * GPU-accelerated elevation, and bevel compression.
 */
export default function Button3D({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  loading = false,
  disabled = false,
  onClick,
  type = "button",
  className = "",
  style = {},
  ...props
}) {
  const sizeStyles = {
    sm: { padding: "0.45rem 0.85rem", fontSize: "0.8rem", borderRadius: "8px" },
    md: { padding: "0.65rem 1.25rem", fontSize: "0.875rem", borderRadius: "10px" },
    lg: { padding: "0.85rem 1.65rem", fontSize: "1rem", borderRadius: "12px" },
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`btn-3d btn-3d-${variant} ${className}`}
      style={{
        ...currentSize,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled || loading ? "not-allowed" : "pointer",
        ...style,
      }}
      {...props}
    >
      {loading ? (
        <Loader2 size={size === "sm" ? 14 : 18} className="animate-spin" />
      ) : Icon ? (
        <Icon size={size === "sm" ? 14 : 18} />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
