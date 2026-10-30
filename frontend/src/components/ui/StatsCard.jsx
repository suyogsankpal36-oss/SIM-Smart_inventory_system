import { TrendingUp, TrendingDown } from "lucide-react";

export default function StatsCard({
  title,
  value,
  icon: Icon,
  trend,
  trendPositive = true,
  trendLabel = "",
  description,
  accentColor = "primary",
  className = "",
}) {
  const accentClasses = {
    primary: "bg-primary/10 text-primary border-primary/20",
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    error: "bg-error/10 text-error border-error/20",
    info: "bg-info/10 text-info border-info/20",
  }[accentColor] || "bg-primary/10 text-primary border-primary/20";

  return (
    <div
      className={`card bg-base-200 border border-base-300/80 rounded-2xl p-5 shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-200 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-base-content/60">
            {title}
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-base-content mt-1.5 tracking-tight">
            {value}
          </div>
        </div>
        {Icon && (
          <div className={`p-3 rounded-2xl border shrink-0 ${accentClasses}`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        )}
      </div>

      {(trend !== undefined || description) && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-base-300/40 text-xs">
          {trend !== undefined && (
            <span
              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                trendPositive
                  ? "bg-success/15 text-success"
                  : "bg-error/15 text-error"
              }`}
            >
              {trendPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {trend}
            </span>
          )}
          {trendLabel && <span className="text-base-content/60">{trendLabel}</span>}
          {description && !trendLabel && (
            <span className="text-base-content/60 truncate">{description}</span>
          )}
        </div>
      )}
    </div>
  );
}
