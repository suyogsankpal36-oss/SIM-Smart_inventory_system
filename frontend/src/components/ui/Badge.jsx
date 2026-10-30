export default function Badge({
  children,
  variant,
  status,
  size = "sm",
  outline = false,
  dot = false,
  className = "",
}) {
  let computedVariant = variant || "neutral";

  if (status) {
    const s = String(status).toLowerCase();
    if (["in_stock", "completed", "active", "paid", "delivered"].includes(s)) {
      computedVariant = "success";
    } else if (["low_stock", "pending", "partially_paid"].includes(s)) {
      computedVariant = "warning";
    } else if (["out_of_stock", "cancelled", "inactive", "overdue", "failed"].includes(s)) {
      computedVariant = "error";
    } else if (["admin", "manager"].includes(s)) {
      computedVariant = "primary";
    } else {
      computedVariant = "neutral";
    }
  }

  const variantClasses = {
    primary: "badge-primary text-black font-semibold",
    secondary: "badge-secondary text-white",
    accent: "badge-accent text-white",
    neutral: "badge-neutral text-base-content",
    success: "badge-success text-black font-semibold",
    warning: "badge-warning text-black font-semibold",
    error: "badge-error text-white font-semibold",
    info: "badge-info text-white font-semibold",
    ghost: "badge-ghost",
  }[computedVariant] || "badge-neutral";

  const sizeClasses = {
    xs: "badge-xs text-[10px] py-1 px-1.5",
    sm: "badge-sm text-xs py-2 px-2.5",
    md: "badge-md text-sm py-2.5 px-3",
    lg: "badge-lg text-base py-3 px-4",
  }[size] || "badge-sm";

  const outlineClass = outline ? "badge-outline" : "";

  return (
    <span
      className={`badge inline-flex items-center gap-1.5 font-medium rounded-full ${variantClasses} ${sizeClasses} ${outlineClass} ${className}`}
    >
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />}
      <span>{children}</span>
    </span>
  );
}
