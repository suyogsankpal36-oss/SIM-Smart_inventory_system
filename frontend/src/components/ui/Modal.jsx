import { useEffect } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  actions,
  maxWidth = "max-w-lg",
  className = "",
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && onClose) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm cursor-pointer"
          />

          {/* Dialog Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className={`relative w-full ${maxWidth} bg-base-200 border border-base-300 rounded-3xl shadow-2xl overflow-hidden z-10 text-base-content my-8 ${className}`}
            role="dialog"
            aria-modal="true"
          >
            {/* Header */}
            {(title || onClose) && (
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-base-300/50">
                <div>
                  {title && (
                    <h3 className="text-lg font-bold tracking-tight text-base-content">
                      {title}
                    </h3>
                  )}
                  {subtitle && (
                    <p className="text-xs text-base-content/60 mt-0.5">{subtitle}</p>
                  )}
                </div>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="btn btn-sm btn-ghost btn-circle text-base-content/60 hover:text-base-content cursor-pointer"
                    aria-label="Close modal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}

            {/* Body */}
            <div className="p-6 max-h-[calc(85vh-130px)] overflow-y-auto mobile-touch-scroll">
              {children}
            </div>

            {/* Actions Footer */}
            {actions && (
              <div className="flex items-center justify-end gap-3 px-6 py-4 bg-base-300/30 border-t border-base-300/50">
                {actions}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
