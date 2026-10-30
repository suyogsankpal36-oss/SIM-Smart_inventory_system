import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export default function Input({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  helperText,
  required = false,
  disabled = false,
  icon: Icon,
  endIcon: EndIcon,
  className = "",
  containerClassName = "",
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

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

      <div className="relative flex items-center">
        {Icon && (
          <div className="absolute left-3.5 text-base-content/50 pointer-events-none">
            <Icon className="w-4 h-4" />
          </div>
        )}

        <input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`input input-bordered w-full rounded-xl text-sm transition-all duration-150 ${
            Icon ? "pl-10" : "pl-4"
          } ${isPassword || EndIcon ? "pr-11" : "pr-4"} ${
            error ? "input-error border-error focus:border-error" : "focus:border-primary"
          } bg-base-100 text-base-content placeholder:text-base-content/40 disabled:opacity-50 ${className}`}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 text-base-content/50 hover:text-base-content cursor-pointer"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}

        {!isPassword && EndIcon && (
          <div className="absolute right-3.5 text-base-content/50 pointer-events-none">
            <EndIcon className="w-4 h-4" />
          </div>
        )}
      </div>

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
