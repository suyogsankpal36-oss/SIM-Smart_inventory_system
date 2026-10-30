export default function Card({
  children,
  title,
  subtitle,
  icon: Icon,
  action,
  interactive = false,
  className = "",
  bodyClassName = "",
  ...props
}) {
  return (
    <div
      className={`card bg-base-200 border border-base-300/80 rounded-2xl shadow-sm text-base-content transition-all duration-200 ${
        interactive ? "hover:border-primary/40 hover:shadow-lg hover:-translate-y-0.5 cursor-pointer" : ""
      } ${className}`}
      {...props}
    >
      {(title || action || Icon) && (
        <div className="flex items-center justify-between px-6 pt-5 pb-2 border-b border-base-300/40">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              {title && <h3 className="font-bold text-base tracking-tight text-base-content">{title}</h3>}
              {subtitle && <p className="text-xs text-base-content/60 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      <div className={`card-body p-6 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
