import React from 'react';
import { 
  Atom, 
  AlertCircle, 
  CheckCircle, 
  ShieldAlert
} from 'lucide-react';
import { PollutantDetail } from '../types/airQuality';

interface PollutantsGridProps {
  pollutants: {
    pm2_5: PollutantDetail;
    pm10: PollutantDetail;
    o3: PollutantDetail;
    no2: PollutantDetail;
    so2: PollutantDetail;
    co: PollutantDetail;
    dust: PollutantDetail;
    uvIndex: PollutantDetail;
  };
}

export const PollutantsGrid: React.FC<PollutantsGridProps> = ({ pollutants }) => {
  const pollutantList: PollutantDetail[] = [
    pollutants.pm2_5,
    pollutants.pm10,
    pollutants.o3,
    pollutants.no2,
    pollutants.so2,
    pollutants.co,
    pollutants.dust,
    pollutants.uvIndex
  ];

  return (
    <div className="rounded-3xl liquid-glass-elevated p-5 sm:p-7 shadow-2xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <Atom className="w-4 h-4" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Atmospheric Pollutant Diagnostics
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Real-time sensor measurements evaluated against World Health Organization (WHO) 24h limits
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 font-semibold">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Safe
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Moderate
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> High
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {pollutantList.map((p) => {
          const isElevated = p.ratioToWho > 1.0;
          const isHigh = p.ratioToWho > 2.5;

          const statusBadge = isHigh ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-3 h-3" />
              {p.statusLabel}
            </span>
          ) : isElevated ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              <AlertCircle className="w-3 h-3" />
              {p.statusLabel}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <CheckCircle className="w-3 h-3" />
              Within Limit
            </span>
          );

          const barPercent = Math.min(Math.round((p.value / (p.whoLimit * 2.5)) * 100), 100);

          return (
            <div
              key={p.id}
              className="p-4 sm:p-5 rounded-2xl liquid-glass hover:bg-white/40 dark:hover:bg-white/10 border border-white/20 dark:border-white/10 transition-all shadow-sm flex flex-col justify-between group m3-state-layer"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-slate-900 dark:text-white text-base">
                        {p.formula}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                        {p.name}
                      </span>
                    </div>
                  </div>
                  {statusBadge}
                </div>

                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="text-3xl font-black text-slate-900 dark:text-white font-mono tracking-tight">
                    {p.value}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                    {p.unit}
                  </span>
                </div>

                {/* Progress bar relative to WHO reference */}
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
                    <span>WHO: {p.whoLimit} {p.unit}</span>
                    <span>{p.ratioToWho}× limit</span>
                  </div>
                  <div className="w-full h-2 bg-slate-200/80 dark:bg-slate-800/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        isHigh ? 'bg-rose-500 shadow-sm shadow-rose-500/50' : isElevated ? 'bg-amber-500 shadow-sm shadow-amber-500/50' : 'bg-emerald-500 shadow-sm shadow-emerald-500/50'
                      }`}
                      style={{ width: `${Math.max(barPercent, 6)}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800/50 text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed font-medium">
                {p.description}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
