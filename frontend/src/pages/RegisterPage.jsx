import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Check, Eye, EyeOff, Lock, Mail, Phone, ShieldAlert, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import Scene3DBackground from "../components/3d/Scene3DBackground";
import Tilt3D from "../components/3d/Tilt3D";
import GoogleAuthButton from "../components/GoogleAuthButton";

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

    // Sanitize username: if user or browser autofill placed an email in username, extract username
    let cleanUsername = formData.username.trim();
    if (cleanUsername.includes("@")) {
      cleanUsername = cleanUsername.split("@")[0];
    }
    cleanUsername = cleanUsername.replace(/[^a-zA-Z0-9_.-]/g, "");

    // Sanitize phone: if user or browser autofill placed an email into phone, discard it
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
      }, 1500);
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
          detail = "Cannot connect to server. Please verify the backend API is running on port 8000.";
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
    <div className="register-page-root min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden bg-[#070709] text-white">
      <style>{`
        .register-page-root {
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
        .register-circle {
          width: 550px;
          max-width: 95vw;
          min-height: 550px;
          border-radius: 48px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 38px 28px;
          position: relative;
          box-sizing: border-box;
          background: radial-gradient(circle at 35% 35%, #1a1d29 0%, #10121a 60%, #07080c 100%);
          box-shadow: 25px 25px 65px rgba(0,0,0,0.95), -12px -12px 45px rgba(212,175,55,0.18), inset 2px 2px 4px rgba(255,235,170,0.35);
          border: 2px solid rgba(212, 175, 55, 0.45);
        }
        @media (min-width: 640px) {
          .register-circle {
            border-radius: 50%;
            aspect-ratio: 1 / 1;
            padding: 44px 36px;
          }
        }
        .form-content {
          width: 100%;
          max-width: 390px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          z-index: 10;
          box-sizing: border-box;
        }
        .form-content h2 {
          margin: 0;
          font-size: 26px;
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
          padding: 6px 12px;
          box-shadow: inset 3px 3px 8px rgba(0,0,0,0.95), inset -2px -2px 6px rgba(212,175,55,0.08);
          border: 1px solid rgba(212, 175, 55, 0.3);
          transition: all 0.2s ease;
          box-sizing: border-box;
        }
        .input-group:focus-within {
          border-color: rgba(212, 175, 55, 0.9);
          box-shadow: inset 3px 3px 8px rgba(0,0,0,0.9), inset -2px -2px 6px rgba(212,175,55,0.15), 0 0 16px rgba(212,175,55,0.35);
        }
        .input-group input, .input-group select {
          width: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: #ffffff;
          padding: 2px 6px;
          font-size: 12px;
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
        intensity={10}
        glare={false}
        float={true}
        className="z-10 relative rounded-full"
        style={{ borderRadius: "50%" }}
      >
        <div
          id="registerContainer"
          onAnimationEnd={() => setIsShaking(false)}
          className={`register-circle login-circle preserve-3d relative transition-all duration-300 ${
            isShaking
              ? "animate-error-shake !border-rose-500 shadow-[0_0_45px_rgba(239,68,68,0.55),inset_0_0_20px_rgba(239,68,68,0.25)]"
              : error
              ? "!border-rose-500/70 shadow-[0_0_30px_rgba(239,68,68,0.35)]"
              : ""
          }`}
        >
          {/* Outer Concentric Metallic Rings */}
          <div className="absolute inset-3.5 rounded-[42px] sm:rounded-full border border-[#d4af37]/20 pointer-events-none" />
          <div className="absolute inset-5 rounded-[38px] sm:rounded-full border border-dashed border-[#d4af37]/20 pointer-events-none animate-[spin_80s_linear_infinite]" />

          {registerSuccess ? (
            /* SUCCESS STATE - EXACT MATCH TO USER'S REEL ARCHITECTURE */
            <div id="successMsg" className="success-msg flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in zoom-in duration-300">
              {/* Embossed circular well with green checkmark */}
              <div className="check-circle w-20 h-20 rounded-full flex items-center justify-center text-emerald-400 text-3xl font-black shadow-lg">
                <Check size={40} strokeWidth={3.5} className="text-emerald-400" />
              </div>
              <div className="space-y-1">
                <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-white via-amber-100 to-[#d4af37] bg-clip-text text-transparent tracking-tight">
                  Welcome Aboard!
                </h2>
                <p className="text-xs sm:text-sm text-neutral-300 font-medium tracking-wide">
                  Account Created Successfully
                </p>
              </div>
              <span className="text-[11px] text-[#d4af37]/80 font-mono animate-pulse">
                Redirecting to login portal...
              </span>
            </div>
          ) : (
            /* REGISTRATION FORM STATE */
            <div id="formContent" className="form-content w-full max-w-[390px] flex flex-col items-center z-10 space-y-3.5">
              <div className="text-center space-y-0.5">
                <h2 className="text-2xl sm:text-3xl font-black bg-gradient-to-r from-amber-100 via-[#d4af37] to-amber-500 bg-clip-text text-transparent tracking-widest uppercase">
                  SIGN UP
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

              <form onSubmit={handleSubmit} className="w-full space-y-2.5">
                {/* Row 1: First Name & Last Name */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="input-group relative flex items-center rounded-full px-3 py-1">
                    <User size={13} className="text-[#d4af37]/70 shrink-0 ml-0.5" />
                    <input
                      type="text"
                      name="first_name"
                      autoComplete="given-name"
                      placeholder="First Name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="w-full bg-transparent border-none outline-none px-2 py-1 text-xs text-white placeholder-neutral-500 font-medium"
                    />
                  </div>
                  <div className="input-group relative flex items-center rounded-full px-3 py-1">
                    <User size={13} className="text-[#d4af37]/70 shrink-0 ml-0.5" />
                    <input
                      type="text"
                      name="last_name"
                      autoComplete="family-name"
                      placeholder="Last Name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="w-full bg-transparent border-none outline-none px-2 py-1 text-xs text-white placeholder-neutral-500 font-medium"
                    />
                  </div>
                </div>

                {/* Row 2: Email & Username */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="input-group relative flex items-center rounded-full px-3 py-1">
                    <Mail size={13} className="text-[#d4af37]/70 shrink-0 ml-0.5" />
                    <input
                      type="email"
                      required
                      name="email"
                      autoComplete="email"
                      placeholder="Email Address *"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-transparent border-none outline-none px-2 py-1 text-xs text-white placeholder-neutral-500 font-medium"
                    />
                  </div>
                  <div className="input-group relative flex items-center rounded-full px-3 py-1">
                    <User size={13} className="text-[#d4af37]/70 shrink-0 ml-0.5" />
                    <input
                      type="text"
                      name="username"
                      autoComplete="username"
                      placeholder="Username (optional)"
                      value={formData.username}
                      onChange={handleChange}
                      className="w-full bg-transparent border-none outline-none px-2 py-1 text-xs text-white placeholder-neutral-500 font-medium"
                    />
                  </div>
                </div>

                {/* Row 3: Phone & Role */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="input-group relative flex items-center rounded-full px-3 py-1">
                    <Phone size={13} className="text-[#d4af37]/70 shrink-0 ml-0.5" />
                    <input
                      type="tel"
                      name="phone"
                      autoComplete="tel"
                      placeholder="Phone (optional)"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-transparent border-none outline-none px-2 py-1 text-xs text-white placeholder-neutral-500 font-medium"
                    />
                  </div>
                  <div className="input-group relative flex items-center rounded-full px-3 py-1">
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full bg-transparent border-none outline-none px-2 py-1 text-xs text-neutral-300 font-medium cursor-pointer"
                    >
                      <option value="employee" className="bg-[#10121a] text-white">Staff / Cashier</option>
                      <option value="manager" className="bg-[#10121a] text-white">Store Manager</option>
                      <option value="admin" className="bg-[#10121a] text-white">Administrator</option>
                    </select>
                  </div>
                </div>

                {/* Row 4: Password & Confirm Password */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="input-group relative flex items-center rounded-full px-3 py-1">
                    <Lock size={13} className="text-[#d4af37]/70 shrink-0 ml-0.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      name="password"
                      autoComplete="new-password"
                      placeholder="Password *"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full bg-transparent border-none outline-none px-2 py-1 text-xs text-white placeholder-neutral-500 font-medium"
                    />
                  </div>
                  <div className="input-group relative flex items-center rounded-full px-3 py-1">
                    <Lock size={13} className="text-[#d4af37]/70 shrink-0 ml-0.5" />
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      name="password_confirm"
                      autoComplete="new-password"
                      placeholder="Confirm *"
                      value={formData.password_confirm}
                      onChange={handleChange}
                      className="w-full bg-transparent border-none outline-none px-2 py-1 text-xs text-white placeholder-neutral-500 font-medium"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between px-2 text-[10px]">
                  <span className="text-neutral-400 font-mono">Min. 6 chars (incl. number)</span>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-neutral-400 hover:text-[#d4af37] flex items-center gap-1 cursor-pointer transition"
                  >
                    {showPassword ? <EyeOff size={11} /> : <Eye size={11} />}
                    <span>{showPassword ? "Hide Passwords" : "Show Passwords"}</span>
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-submit w-full py-2.5 rounded-full text-xs font-black text-black tracking-wider uppercase disabled:opacity-60 cursor-pointer mt-1"
                >
                  {submitting ? "Registering..." : "Create Account"}
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
                  label="Sign up with Google"
                  disabled={submitting}
                  onSuccess={() => {
                    setRegisterSuccess(true);
                    setTimeout(() => {
                      navigate("/dashboard");
                    }, 1250);
                  }}
                  onError={(msg) => {
                    setError(msg);
                    triggerShake();
                  }}
                />
              </form>

              <div className="text-[11px] text-neutral-400 text-center">
                Already registered?{" "}
                <Link to="/login" className="text-[#d4af37] font-bold hover:underline">
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </Tilt3D>
    </div>
  );
}
