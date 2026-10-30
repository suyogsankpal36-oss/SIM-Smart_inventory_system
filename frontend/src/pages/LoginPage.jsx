import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, Eye, EyeOff, Lock, Mail, ShieldAlert, Sparkles, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import GoogleAuthButton from "../components/GoogleAuthButton";
import ThemeToggle from "../components/ui/ThemeToggle";
import { Button, Card, Input } from "../components/ui";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const { login, loginAsGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const triggerShake = () => {
    setIsShaking(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsShaking(true);
      });
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Please enter your username/email and password.");
      triggerShake();
      return;
    }

    setSubmitting(true);
    try {
      await login(identifier.trim(), password);
      setLoginSuccess(true);
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    } catch (err) {
      let detail =
        err.response?.data?.detail ||
        err.response?.data?.errors?.detail;
      if (!detail) {
        if (!err.response) {
          detail = "Cannot connect to server. Please verify the backend API is running.";
        } else {
          detail = "Invalid username or password. Please try again.";
        }
      } else if (
        detail.toLowerCase().includes("no active account") ||
        detail.toLowerCase().includes("credential")
      ) {
        detail = "Invalid username or password. Please try again.";
      }
      setError(detail);
      triggerShake();
      setSubmitting(false);
    }
  };

  const handleGuestDemo = async () => {
    setError("");
    setSubmitting(true);
    try {
      await loginAsGuest();
      setLoginSuccess(true);
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 1000);
    } catch (err) {
      let detail =
        err.response?.data?.detail ||
        "Unable to start live guest demo. Please verify the backend is running.";
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

      <div className="w-full max-w-md">
        <Card className={`p-6 sm:p-8 border border-base-content/10 shadow-2xl bg-base-100 ${isShaking ? "animate-shake" : ""}`}>
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-3 shadow-md">
              <Sparkles className="w-7 h-7 text-primary" />
            </div>
            <h1 className="text-2xl font-black text-base-content tracking-tight">
              Smart Inventory
            </h1>
            <p className="text-xs text-base-content/60 mt-1">
              Enterprise Business Management & POS Suite
            </p>
          </div>

          {loginSuccess ? (
            <div className="py-8 text-center space-y-3 animate-in fade-in zoom-in duration-300">
              <div className="w-16 h-16 rounded-full bg-success/15 border-2 border-success text-success flex items-center justify-center mx-auto shadow-lg">
                <Check size={32} />
              </div>
              <h2 className="text-xl font-bold text-base-content">Access Authorized</h2>
              <p className="text-xs text-base-content/60">
                Initializing your operational workspace...
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

              <div>
                <label className="label text-xs font-semibold text-base-content/70 pb-1">
                  Username or Email
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
                  <input
                    type="text"
                    required
                    placeholder="admin or user@domain.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="input input-bordered w-full pl-10 text-sm bg-base-100"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center pb-1">
                  <label className="label text-xs font-semibold text-base-content/70 p-0">
                    Security Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input input-bordered w-full pl-10 pr-10 text-sm bg-base-100 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/40 hover:text-base-content"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <Button
                variant="primary"
                type="submit"
                className="w-full mt-2"
                loading={submitting}
              >
                Sign In to Dashboard
              </Button>

              <div className="divider text-xs text-base-content/40 my-3">OR</div>

              {/* 1-Click Guest Demo Button */}
              <Button
                variant="outline"
                type="button"
                className="w-full border-primary/40 text-primary hover:bg-primary hover:text-primary-content gap-2"
                onClick={handleGuestDemo}
                loading={submitting}
              >
                <Sparkles size={16} />
                <span>1-Click Instant Guest Demo</span>
              </Button>

              {/* Google OAuth Button */}
              <GoogleAuthButton
                onSuccess={() => {
                  setLoginSuccess(true);
                  setTimeout(() => navigate(from, { replace: true }), 1000);
                }}
                onError={(err) => setError(err)}
              />

              <div className="text-center pt-2">
                <span className="text-xs text-base-content/60">
                  New to Smart Inventory?{" "}
                  <Link to="/register" className="link link-primary font-bold">
                    Create an account
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
