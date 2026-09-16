import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Check, Eye, EyeOff, Lock, Mail, ShieldAlert, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Scene3DBackground from "../components/3d/Scene3DBackground";
import Tilt3D from "../components/3d/Tilt3D";
import Button3D from "../components/3d/Button3D";
import GoogleAuthButton from "../components/GoogleAuthButton";

export default function LoginPage() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [isShaking, setIsShaking] = useState(false);

  const { login } = useAuth();
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
      }, 1250);
    } catch (err) {
      let detail =
        err.response?.data?.detail ||
        err.response?.data?.errors?.detail;
      if (!detail) {
        if (!err.response) {
          detail = "Cannot connect to server. Please verify the Django backend API is running on port 8000.";
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

  return (
    <div className="login-page-root min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#070709] text-white">
      <style>{`
        .login-page-root {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
          background: #070709;
          color: #ffffff;
          padding: 16px;
          box-sizing: border-box;
        }
        .login-circle {
          width: 440px;
          max-width: 92vw;
          aspect-ratio: 1 / 1;
          border-radius: 50%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 32px;
          position: relative;
          box-sizing: border-box;
          background: radial-gradient(circle at 35% 35%, #1a1d29 0%, #10121a 60%, #07080c 100%);
          box-shadow: 25px 25px 65px rgba(0,0,0,0.95), -12px -12px 45px rgba(212,175,55,0.18), inset 2px 2px 4px rgba(255,235,170,0.35);
          border: 2px solid rgba(212, 175, 55, 0.45);
        }
        .form-content {
          width: 100%;
          max-width: 310px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 14px;
          z-index: 10;
          box-sizing: border-box;
        }
        .form-content h2 {
          margin: 0;
          font-size: 28px;
          font-weight: 900;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          background: linear-gradient(135deg, #fff2cc 0%, #d4af37 55%, #b38728 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-align: center;
        }
        .hint {
          margin: 0;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.05em;
          color: rgba(212, 175, 55, 0.85);
          text-align: center;
        }
        .check-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at 35% 35%, #181c24 0%, #0d0f15 100%);
          box-shadow: inset 4px 4px 10px rgba(0,0,0,0.9), inset -3px -3px 8px rgba(212,175,55,0.2), 0 0 35px rgba(16,185,129,0.45);
          border: 2.5px solid #10b981;
          color: #10b981;
        }
        .success-msg {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          gap: 14px;
          z-index: 10;
        }
        .success-msg h2 {
          margin: 0;
          font-size: 28px;
          font-weight: 900;
          background: linear-gradient(135deg, #ffffff 0%, #fef3c7 40%, #d4af37 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .success-msg p {
          margin: 0;
          font-size: 13px;
          color: #d1d5db;
          font-weight: 500;
        }
        .input-group {
          width: 100%;
          display: flex;
          align-items: center;
          background: #090a0f;
          border-radius: 9999px;
          padding: 8px 14px;
          box-shadow: inset 3px 3px 8px rgba(0,0,0,0.95), inset -2px -2px 6px rgba(212,175,55,0.08);
          border: 1px solid rgba(212, 175, 55, 0.3);
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .input-group:focus-within {
          border-color: rgba(212, 175, 55, 0.9);
          box-shadow: inset 3px 3px 8px rgba(0,0,0,0.9), inset -2px -2px 6px rgba(212,175,55,0.15), 0 0 16px rgba(212,175,55,0.35);
        }
        .input-group input {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: #ffffff;
          padding: 2px 8px;
          font-size: 13px;
          font-family: inherit;
        }
        .input-group input::placeholder {
          color: #6b7280;
        }
        .btn-submit {
          width: 100%;
          padding: 11px 20px;
          border-radius: 9999px;
          border: none;
          background: linear-gradient(135deg, #fce08b 0%, #d4af37 50%, #996515 100%);
          box-shadow: 0 4px 0 #785310, 0 10px 25px rgba(212, 175, 55, 0.35);
          font-weight: 900;
          font-size: 12px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: #0b0c10;
          cursor: pointer;
          transition: all 0.15s ease;
          margin-top: 4px;
        }
        .btn-submit:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 0 #785310, 0 14px 30px rgba(212, 175, 55, 0.45);
        }
        .btn-submit:active:not(:disabled) {
          transform: translateY(2px);
          box-shadow: 0 2px 0 #785310, 0 6px 15px rgba(212, 175, 55, 0.3);
        }
      `}</style>

      {/* Ambient Constellation Layer with Metallic Gold Particles */}
      <Scene3DBackground opacity={0.35} particleCount={40} color="212, 175, 55" />

      {/* Main Embossed Circle Plaque - Strictly Circular Movement */}
      <Tilt3D
        intensity={12}
        glare={false}
        float={true}
        className="z-10 relative rounded-full"
        style={{ borderRadius: "50%" }}
      >
        <div
          id="loginContainer"
          onAnimationEnd={() => setIsShaking(false)}
          className={`login-circle preserve-3d relative transition-all duration-300 ${
            isShaking
              ? "animate-error-shake !border-rose-500 shadow-[0_0_45px_rgba(239,68,68,0.55),inset_0_0_20px_rgba(239,68,68,0.25)]"
              : error
              ? "!border-rose-500/70 shadow-[0_0_30px_rgba(239,68,68,0.35)]"
              : ""
          }`}
        >
          {/* Outer Concentric Metallic Rings */}
          <div className="absolute inset-3.5 rounded-full border border-[#d4af37]/20 pointer-events-none" />
          <div className="absolute inset-5 rounded-full border border-dashed border-[#d4af37]/20 pointer-events-none animate-[spin_80s_linear_infinite]" />

          {loginSuccess ? (
            /* SUCCESS STATE - EXACT MATCH TO USER'S REEL IMAGE */
            <div id="successMsg" className="success-msg flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
              {/* Embossed circular well with green checkmark */}
              <div className="check-circle w-20 h-20 rounded-full flex items-center justify-center text-emerald-400 text-3xl font-black shadow-lg">
                <Check size={40} strokeWidth={3.5} className="text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white via-amber-100 to-[#d4af37] bg-clip-text text-transparent tracking-tight">
                  Welcome Back!
                </h2>
                <p className="text-xs sm:text-sm text-neutral-300 font-medium tracking-wide">
                  Login Successful
                </p>
              </div>
              <span className="text-[11px] text-[#d4af37]/80 font-mono animate-pulse">
                Entering Dashboard...
              </span>
            </div>
          ) : (
            /* FORM CONTENT STATE - EXACT MATCH TO CODE IN USER'S REEL */
            <div id="formContent" className="form-content w-full max-w-[305px] flex flex-col items-center z-10 space-y-4">
              <div className="text-center space-y-0.5">
                <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-100 via-[#d4af37] to-amber-500 bg-clip-text text-transparent tracking-widest uppercase">
                  SIGN IN
                </h2>
                <p className="hint text-[11px] text-[#d4af37]/80 font-medium tracking-wide">
                  Smart Business & Inventory
                </p>
              </div>

              {error && (
                <div className="w-full p-2.5 rounded-2xl bg-rose-500/20 border border-rose-500/50 text-rose-200 text-xs flex items-center gap-2.5 shadow-[0_0_20px_rgba(239,68,68,0.3)] animate-in fade-in zoom-in-95 duration-200">
                  <ShieldAlert size={16} className="shrink-0 text-rose-400 animate-pulse" />
                  <span className="font-semibold leading-tight text-left">{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="w-full space-y-3">
                {/* Username Input Group */}
                <div className={`input-group relative flex items-center rounded-full px-3.5 py-1.5 transition-colors ${
                  error ? "!border-rose-500/60 shadow-[0_0_12px_rgba(239,68,68,0.2)]" : ""
                }`}>
                  <User size={14} className={`${error ? "text-rose-400" : "text-[#d4af37]/70"} shrink-0 ml-1`} />
                  <input
                    type="text"
                    id="username"
                    required
                    placeholder="Username or Email"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (error) setError("");
                    }}
                    className="w-full bg-transparent border-none outline-none px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 font-medium"
                  />
                </div>

                {/* Password Input Group */}
                <div className={`input-group relative flex items-center rounded-full px-3.5 py-1.5 transition-colors ${
                  error ? "!border-rose-500/60 shadow-[0_0_12px_rgba(239,68,68,0.2)]" : ""
                }`}>
                  <Lock size={14} className={`${error ? "text-rose-400" : "text-[#d4af37]/70"} shrink-0 ml-1`} />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    required
                    placeholder="Password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    className="w-full bg-transparent border-none outline-none px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 font-medium pr-7"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-neutral-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-submit w-full py-2.5 rounded-full text-xs font-black text-black tracking-wider uppercase disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? "Authenticating..." : "Login"}
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center w-full py-0.5">
                  <div className="w-full border-t border-[#d4af37]/20" />
                  <span className="absolute px-2.5 text-[9px] uppercase font-bold tracking-widest bg-[#12141c] text-[#d4af37]/75 rounded-full border border-[#d4af37]/15">
                    OR
                  </span>
                </div>

                {/* Google Sign-In with Official Google Symbol */}
                <GoogleAuthButton
                  disabled={submitting}
                  onSuccess={() => {
                    setLoginSuccess(true);
                    setTimeout(() => {
                      navigate(from, { replace: true });
                    }, 1250);
                  }}
                  onError={(msg) => {
                    setError(msg);
                    triggerShake();
                  }}
                />
              </form>

              <div className="text-[11px] text-neutral-400 text-center">
                Don't have an account?{" "}
                <Link to="/register" className="text-[#d4af37] font-bold hover:underline">
                  Sign Up
                </Link>
              </div>
            </div>
          )}
        </div>
      </Tilt3D>
    </div>
  );
}
