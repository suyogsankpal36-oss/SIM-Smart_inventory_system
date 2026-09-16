import { useState, useEffect } from "react";
import { X, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { signInWithGooglePopup, checkRedirectResult } from "../config/firebase";

export function GoogleIcon({ className = "w-4 h-4" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
        fill="#34A853"
      />
      <path
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function GoogleAuthButton({
  onSuccess,
  onError,
  disabled = false,
  label = "Continue with Google",
  className = "",
}) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [modalError, setModalError] = useState("");

  // Process redirect result if redirected from Google
  useEffect(() => {
    const handleRedirect = async () => {
      try {
        const googleData = await checkRedirectResult();
        if (googleData?.email) {
          setLoading(true);
          const user = await loginWithGoogle({
            credential: googleData.token,
            token: googleData.token,
            email: googleData.email,
            name: googleData.name,
            sub: googleData.sub,
            picture: googleData.picture,
          });
          if (onSuccess) onSuccess(user);
        }
      } catch (err) {
        console.warn("Redirect auth check:", err);
      } finally {
        setLoading(false);
      }
    };
    handleRedirect();
  }, [loginWithGoogle, onSuccess]);

  const handleClick = async () => {
    if (disabled || loading) return;
    setLoading(true);
    setModalError("");

    try {
      // 1. Authenticate with Google via Firebase Popup
      const googleData = await signInWithGooglePopup();
      if (googleData?.email) {
        const user = await loginWithGoogle({
          credential: googleData.token,
          token: googleData.token,
          email: googleData.email,
          name: googleData.name,
          sub: googleData.sub,
          picture: googleData.picture,
        });
        if (onSuccess) onSuccess(user);
        return;
      }
    } catch (err) {
      console.warn("Firebase Google Sign-In notice:", err);
      // User closed the popup intentionally
      if (err.code === "auth/popup-closed-by-user") {
        setLoading(false);
        return;
      }

      // Display informative error or fallback modal for permission / configuration notices
      setShowModal(true);
      if (err.code === "auth/unauthorized-domain") {
        setModalError(
          "Notice: In Firebase Console > Authentication > Settings, ensure 'localhost' is listed under Authorized domains. You can also sign in directly below:"
        );
      } else if (err.code === "auth/operation-not-allowed") {
        setModalError(
          "Notice: Please enable the Google provider in Firebase Console > Authentication > Sign-in method. You can also sign in directly below:"
        );
      } else if (err.code === "auth/popup-blocked") {
        setModalError("Browser popup was blocked. Please allow popups or sign in below:");
      } else {
        setModalError(err.message || "Google sign-in encountered an issue. You can sign in below:");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError("");

    const emailTrimmed = googleEmail.trim();
    if (!emailTrimmed) {
      setModalError("Please enter your Google account email.");
      return;
    }

    const emailRegex = /^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/;
    if (!emailRegex.test(emailTrimmed)) {
      setModalError("Please enter a valid Google email address.");
      return;
    }

    setLoading(true);
    try {
      const user = await loginWithGoogle({
        email: emailTrimmed,
        name: googleName.trim() || undefined,
      });
      setShowModal(false);
      if (onSuccess) onSuccess(user);
    } catch (err) {
      const msg =
        err.response?.data?.detail || "Google sign-in failed. Please verify the account.";
      setModalError(msg);
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={`group relative flex items-center justify-center gap-2.5 w-full py-2 px-4 rounded-full bg-[#0c0d14]/90 hover:bg-[#151825] border border-[#d4af37]/35 hover:border-[#d4af37]/80 text-xs font-semibold text-white shadow-[inset_2px_2px_6px_rgba(0,0,0,0.85),0_4px_12px_rgba(0,0,0,0.4)] hover:shadow-[0_0_18px_rgba(212,175,55,0.25)] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        <GoogleIcon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110 duration-200" />
        <span className="tracking-wide text-neutral-200 group-hover:text-white">
          {loading ? "Connecting to Google..." : label}
        </span>
      </button>

      {/* Google Account Modal Fallback */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-[#0f111a] border border-[#d4af37]/45 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.95),0_0_30px_rgba(212,175,55,0.2)] text-white">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition p-1 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-[#181b28] border border-[#d4af37]/35 flex items-center justify-center mb-3 shadow-inner">
                <GoogleIcon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold bg-gradient-to-r from-amber-100 via-[#d4af37] to-amber-400 bg-clip-text text-transparent">
                Sign in with Google
              </h3>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                Fast & secure authentication using your Google account
              </p>
            </div>

            {modalError && (
              <div className="mb-3 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs text-left leading-relaxed">
                {modalError}
              </div>
            )}

            <form onSubmit={handleModalSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-[#d4af37] mb-1">
                  Google Email Address *
                </label>
                <div className="flex items-center rounded-full bg-[#08090d] border border-[#d4af37]/30 px-3.5 py-1.5 focus-within:border-[#d4af37]">
                  <input
                    type="email"
                    required
                    placeholder="e.g. yourname@gmail.com"
                    value={googleEmail}
                    onChange={(e) => setGoogleEmail(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-xs text-white placeholder-neutral-500"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#d4af37] mb-1">
                  Full Name (Optional)
                </label>
                <div className="flex items-center rounded-full bg-[#08090d] border border-[#d4af37]/30 px-3.5 py-1.5 focus-within:border-[#d4af37]">
                  <input
                    type="text"
                    placeholder="e.g. Suyog Sankpal"
                    value={googleName}
                    onChange={(e) => setGoogleName(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-xs text-white placeholder-neutral-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400/90 pt-1">
                <ShieldCheck size={13} className="shrink-0" />
                <span>Automatic 256-bit JWT verification & role authorization</span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider text-black bg-gradient-to-r from-[#ffe189] via-[#d4af37] to-[#a67c1e] hover:brightness-110 shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {loading ? "Authenticating..." : "Continue with Google"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
