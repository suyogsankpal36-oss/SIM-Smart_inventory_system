import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

export default function ThemeToggle({ className = "", size = "sm" }) {
  const { isDark, toggleTheme } = useTheme();

  const sizeClasses = {
    xs: "btn-xs h-7 w-7 min-h-7",
    sm: "btn-sm h-9 w-9 min-h-9",
    md: "btn-md h-11 w-11 min-h-11",
  }[size] || "btn-sm h-9 w-9 min-h-9";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "Light" : "Dark"} mode`}
      title={`Switch to ${isDark ? "Light" : "Dark"} mode`}
      className={`btn btn-ghost btn-circle border border-base-300 hover:border-primary/50 text-base-content hover:text-primary transition-all duration-200 cursor-pointer ${sizeClasses} ${className}`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform hover:rotate-45 duration-300" />
      ) : (
        <Moon className="w-4 h-4 text-slate-700 transition-transform hover:-rotate-12 duration-300" />
      )}
    </button>
  );
}
