import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Sparkles } from "lucide-react";
import Tilt3D from "../components/3d/Tilt3D";
import Button3D from "../components/3d/Button3D";

export default function ModulePlaceholder({ title, phase, description, features = [] }) {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-white">
      <Tilt3D intensity={14}>
        <div className="card-3d p-8 rounded-3xl border-2 border-[#d4af37]/30 text-center shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#d4af37]/15 border border-[#d4af37]/40 text-xs font-bold text-[#d4af37] mb-4 uppercase tracking-wider">
            <Clock size={14} />
            <span>Scheduled for {phase}</span>
          </div>

          <h1 className="text-2xl font-black bg-gradient-to-r from-amber-100 via-[#d4af37] to-amber-500 bg-clip-text text-transparent mb-2">
            {title}
          </h1>
          <p className="text-sm text-neutral-400 max-w-lg mx-auto mb-6 leading-relaxed">
            {description}
          </p>

          {features.length > 0 && (
            <div className="p-4 rounded-2xl bg-black/60 border border-[#d4af37]/20 text-left max-w-md mx-auto mb-6 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                <Sparkles size={14} className="text-[#d4af37]" />
                <span>Features planned in this release:</span>
              </div>
              <ul className="space-y-1.5 text-xs text-neutral-300 pl-1">
                {features.map((feat, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-[#d4af37] font-bold">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-center">
            <Link to="/">
              <Button3D variant="gold" icon={ArrowLeft}>
                Back to Dashboard
              </Button3D>
            </Link>
          </div>
        </div>
      </Tilt3D>
    </div>
  );
}
