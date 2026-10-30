import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Eye, EyeOff, Lock, Mail, Phone, ShieldAlert, Sparkles, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import GoogleAuthButton from "../components/GoogleAuthButton";
import ThemeToggle from "../components/ui/ThemeToggle";
import { Button, Card, Input, Select } from "../components/ui";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    first_name: "",
    last_name: "",
    phone: "",
    role: "employee",
    password: "",
    password_confirm: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const triggerShake = () => {
    setIsShaking(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsShaking(true);
      });
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email.trim() || !formData.password || !formData.password_confirm) {
      setError("Please fill in all required fields (Email, Password, Confirm).");
      triggerShake();
      return;
    }

    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Please enter a valid email address (e.g. name@domain.com).");
      triggerShake();
      return;
    }

    if (formData.password !== formData.password_confirm) {
      setError("Passwords do not match. Please verify both passwords.");
      triggerShake();
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      triggerShake();
      return;
    }

    if (!/\d/.test(formData.password)) {
      setError("Password must include at least one numeric digit (0-9).");
      triggerShake();
      return;
    }

    setSubmitting(true);

    let cleanUsername = formData.username.trim();
    if (cleanUsername.includes("@")) {
      cleanUsername = cleanUsername.split("@")[0];
    }
    cleanUsername = cleanUsername.replace(/[^a-zA-Z0-9_.-]/g, "");

    let cleanPhone = formData.phone.trim();
    if (cleanPhone.includes("@") || !/\d/.test(cleanPhone)) {
      cleanPhone = "";
    } else {
      cleanPhone = cleanPhone.replace(/[^0-9+]/g, "");
    }

    try {
      await register({
        ...formData,
        email: formData.email.trim(),
        username: cleanUsername || undefined,
        phone: cleanPhone || undefined,
      });

      setRegisterSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      const data = err.response?.data;
      const errorsObj = data?.errors || data || {};
      let detail = data?.detail;

      if (!detail || detail.includes("highlighted validation errors") || detail.includes("An error occurred")) {
        const fieldPriority = ["password", "email", "username", "phone", "first_name", "last_name", "non_field_errors"];
        for (const field of fieldPriority) {
          const val = errorsObj[field] || data?.[field];
          if (val) {
            const msg = Array.isArray(val) ? val[0] : String(val);
            detail = `${field.replace("_", " ").toUpperCase()}: ${msg}`;
            break;
          }
        }
      }

      if (detail && detail.toLowerCase().includes("email") && detail.toLowerCase().includes("already exists")) {
        detail = "This email is already registered. Please sign in instead.";
      } else if (detail && detail.toLowerCase().includes("username") && detail.toLowerCase().includes("already exists")) {
        detail = "This username is already taken. Please choose another.";
      }

      if (!detail) {
        if (!err.response) {
          detail = "Cannot connect to server. Please verify the backend API is running.";
        } else {
          detail = "Registration failed. Please review your input or check if this email already exists.";
        }
      }
      setError(detail);
      triggerShake();
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative bg-base-200">
      {/* Floating Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-lg">
        <Card className={`p-6 sm:p-8 border border-base-content/10 shadow-2xl bg-base-100 ${isShaking ? "animate-shake" : ""}`}>
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-3 shadow-md">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-base-content tracking-tight">
              Create Account
            </h1>
            <p className="text-xs text-base-content/60 mt-1">
              Join Smart Inventory System & Launch Your Workspace
            </p>
          </div>

          {registerSuccess ? (
            <div className="py-8 text-center space-y-3 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-success/15 border-2 border-success text-success flex items-center justify-center mx-auto shadow-lg">
                <Check size={32} />
              </div>
              <h2 className="text-xl font-bold text-base-content">Registration Complete</h2>
              <p className="text-xs text-base-content/60">
                Your profile is active. Redirecting to sign in...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-error/10 border border-error/20 flex items-start gap-2.5 text-error text-xs">
                  <ShieldAlert size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs font-semibold text-base-content/70 pb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    placeholder="e.g. John"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="input input-bordered input-sm w-full bg-base-100 text-sm"
                  />
                </div>
                <div>
                  <label className="label text-xs font-semibold text-base-content/70 pb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    placeholder="e.g. Doe"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="input input-bordered input-sm w-full bg-base-100 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs font-semibold text-base-content/70 pb-1">
                    Email Address <span className="text-error">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="john@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="input input-bordered input-sm w-full bg-base-100 text-sm"
                  />
                </div>
                <div>
                  <label className="label text-xs font-semibold text-base-content/70 pb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="username"
                    placeholder="johndoe"
                    value={formData.username}
                    onChange={handleChange}
                    className="input input-bordered input-sm w-full bg-base-100 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs font-semibold text-base-content/70 pb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input input-bordered input-sm w-full bg-base-100 text-sm"
                  />
                </div>
                <div>
                  <label className="label text-xs font-semibold text-base-content/70 pb-1">
                    Role
                  </label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="select select-bordered select-sm w-full bg-base-100 text-sm"
                  >
                    <option value="employee">Cashier / Staff</option>
                    <option value="manager">Store Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs font-semibold text-base-content/70 pb-1">
                    Password <span className="text-error">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      required
                      placeholder="Min 6 chars + digit"
                      value={formData.password}
                      onChange={handleChange}
                      className="input input-bordered input-sm w-full pr-8 bg-base-100 text-sm font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label text-xs font-semibold text-base-content/70 pb-1">
                    Confirm Password <span className="text-error">*</span>
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password_confirm"
                    required
                    placeholder="Repeat password"
                    value={formData.password_confirm}
                    onChange={handleChange}
                    className="input input-bordered input-sm w-full bg-base-100 text-sm font-mono"
                  />
                </div>
              </div>

              <Button
                variant="primary"
                type="submit"
                className="w-full mt-2"
                loading={submitting}
              >
                Create Account
              </Button>

              <div className="divider text-xs text-base-content/40 my-2">OR</div>

              {/* Google OAuth Button */}
              <GoogleAuthButton
                onSuccess={() => {
                  setRegisterSuccess(true);
                  setTimeout(() => navigate("/"), 1000);
                }}
                onError={(err) => setError(err)}
              />

              <div className="text-center pt-2">
                <span className="text-xs text-base-content/60">
                  Already have an account?{" "}
                  <Link to="/login" className="link link-primary font-bold">
                    Sign in here
                  </Link>
                </span>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
