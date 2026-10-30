import { motion } from "framer-motion";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconRight: IconRight,
  loading = false,
  disabled = false,
  fullWidth = false,
  className = "",
  type = "button",
  onClick,
  ...props
}) {
  const variantClasses = {
    primary: "btn-primary text-black font-semibold shadow-md hover:brightness-105",
    gold: "bg-gradient-to-r from-amber-200 via-[#d4af37] to-amber-500 text-black border-none font-bold shadow-md hover:brightness-110",
    secondary: "btn-secondary text-white font-medium",
    accent: "btn-accent text-white font-medium",
    outline: "btn-outline border-base-300 hover:border-primary hover:bg-primary/10 text-base-content hover:text-primary",
    ghost: "btn-ghost text-base-content hover:text-primary",
    danger: "btn-error text-white font-medium",
    dark: "bg-neutral text-neutral-content border border-base-300 hover:border-primary/40",
  }[variant] || "btn-primary";

  const sizeClasses = {
    xs: "btn-xs text-[11px] h-7 px-2.5",
    sm: "btn-sm text-xs h-9 px-3.5",
    md: "btn-md text-sm h-11 px-5",
    lg: "btn-lg text-base h-13 px-6",
  }[size] || "btn-md";

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <motion.button
      type={type}
      whileHover={disabled || loading ? {} : { y: -1 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      disabled={disabled || loading}
      onClick={onClick}
      className={`btn rounded-xl transition-all duration-150 inline-flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${variantClasses} ${sizeClasses} ${widthClass} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="loading loading-spinner loading-xs text-current" />
      ) : (
        Icon && <Icon className="w-4 h-4 shrink-0" />
      )}
      <span>{children}</span>
      {!loading && IconRight && <IconRight className="w-4 h-4 shrink-0" />}
    </motion.button>
  );
}
