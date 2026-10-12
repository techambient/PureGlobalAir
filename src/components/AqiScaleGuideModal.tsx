import React from 'react';
import { X, Info } from 'lucide-react';
import { AQI_CATEGORIES } from '../utils/aqiCalculations';

interface AqiScaleGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AqiScaleGuideModal: React.FC<AqiScaleGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const categories = Object.values(AQI_CATEGORIES);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[88vh] rounded-3xl liquid-glass-elevated shadow-2xl flex flex-col overflow-hidden border border-white/20 dark:border-white/10">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-white/15 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Global Air Quality Index (AQI) Reference Scale
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Official US EPA & World Health Organization (WHO) benchmarks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-500 hover:text-slate-900 dark:hover:text-white transition m3-state-layer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            The Air Quality Index is a standardized index for reporting air quality levels. The higher the AQI value, the greater the level of air pollution and the greater the health concern.
          </p>

          <div className="space-y-3">
            {categories.map((cat) => (
              <div
                key={cat.level}
                className="p-4 sm:p-5 rounded-2xl liquid-glass border border-white/20 dark:border-white/10 space-y-2.5 shadow-sm"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-black text-slate-900 dark:text-white text-base">
                      {cat.name}
                    </span>
                    <span
                      className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                    >
                      {cat.range[0]} – {cat.range[1]}
                    </span>
                  </div>

                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    {cat.label}
                  </span>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                  {cat.description}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 text-[11px] border-t border-slate-200/50 dark:border-slate-800/50">
                  <div className="p-3 rounded-xl liquid-glass text-slate-700 dark:text-slate-200">
                    <b className="text-slate-900 dark:text-white block mb-0.5 font-bold">General Public:</b>
                    <span className="font-medium">{cat.generalAdvice}</span>
                  </div>
                  <div className="p-3 rounded-xl liquid-glass text-slate-700 dark:text-slate-200">
                    <b className="text-slate-900 dark:text-white block mb-0.5 font-bold">Sensitive Groups:</b>
                    <span className="font-medium">{cat.sensitiveAdvice}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
