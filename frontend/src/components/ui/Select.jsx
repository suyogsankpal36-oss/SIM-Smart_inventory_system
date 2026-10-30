export default function Select({
  label,
  value,
  onChange,
  options = [],
  children,
  error,
  helperText,
  required = false,
  disabled = false,
  className = "",
  containerClassName = "",
  ...props
}) {
  return (
    <div className={`form-control w-full ${containerClassName}`}>
      {label && (
        <label className="label pb-1.5 pt-0">
          <span className="label-text font-semibold text-xs text-base-content/90 flex items-center gap-1">
            {label}
            {required && <span className="text-error font-bold">*</span>}
          </span>
        </label>
      )}

      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`select select-bordered w-full rounded-xl text-sm transition-all duration-150 ${
          error ? "select-error border-error" : "focus:border-primary"
        } bg-base-100 text-base-content disabled:opacity-50 ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
        {children}
      </select>

      {(error || helperText) && (
        <label className="label pt-1 pb-0">
          <span className={`label-text-alt text-xs ${error ? "text-error" : "text-base-content/60"}`}>
            {error || helperText}
          </span>
        </label>
      )}
    </div>
  );
}
