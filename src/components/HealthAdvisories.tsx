import React from 'react';
import { 
  HeartHandshake, 
  Bike, 
  Wind, 
  ShieldCheck, 
  Sparkles, 
  Baby, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle,
  Home
} from 'lucide-react';
import { AirQualityData } from '../types/airQuality';

interface HealthAdvisoriesProps {
  advisory: AirQualityData['healthAdvisory'];
  aqi: number;
}

export const HealthAdvisories: React.FC<HealthAdvisoriesProps> = ({ advisory, aqi }) => {
  const getLevelIcon = (level: 'safe' | 'caution' | 'avoid' | 'open' | 'limited' | 'closed') => {
    switch (level) {
      case 'safe':
      case 'open':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'caution':
      case 'limited':
        return <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'avoid':
      case 'closed':
        return <XCircle className="w-5 h-5 text-rose-500 shrink-0" />;
    }
  };

  return (
    <div className="rounded-3xl liquid-glass-elevated p-5 sm:p-7 shadow-2xl space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
            <HeartHandshake className="w-4 h-4" />
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Personal Health & Protection Guidelines
          </h2>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Contextual actions calibrated to current air quality severity ({aqi} AQI)
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Outdoor Sports & Exercise */}
        <div className="p-4 sm:p-5 rounded-2xl liquid-glass border border-white/20 dark:border-white/10 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
              <Bike className="w-4 h-4 text-cyan-500" />
              <span>Outdoor Exercise</span>
            </div>
            {getLevelIcon(advisory.outdoorActivities.level)}
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
            {advisory.outdoorActivities.text}
          </p>
        </div>

        {/* 2. Sensitive Groups */}
        <div className="p-4 sm:p-5 rounded-2xl liquid-glass border border-white/20 dark:border-white/10 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
              <Baby className="w-4 h-4 text-amber-500" />
              <span>Vulnerable Groups</span>
            </div>
            {getLevelIcon(advisory.sensitiveGroups.level)}
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
            {advisory.sensitiveGroups.text}
          </p>
        </div>

        {/* 3. Window & Ventilation */}
        <div className="p-4 sm:p-5 rounded-2xl liquid-glass border border-white/20 dark:border-white/10 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
              <Wind className="w-4 h-4 text-teal-500" />
              <span>Window Ventilation</span>
            </div>
            {getLevelIcon(advisory.ventilation.level)}
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
            {advisory.ventilation.text}
          </p>
        </div>

        {/* 4. Mask Protection */}
        <div className="p-4 sm:p-5 rounded-2xl liquid-glass border border-white/20 dark:border-white/10 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span>Respirator / Mask</span>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${advisory.maskProtection.required ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`}>
              {advisory.maskProtection.type}
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
            {advisory.maskProtection.text}
          </p>
        </div>

        {/* 5. Air Purifier */}
        <div className="p-4 sm:p-5 rounded-2xl liquid-glass border border-white/20 dark:border-white/10 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
              <Home className="w-4 h-4 text-violet-500" />
              <span>HEPA Air Purifier</span>
            </div>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${advisory.airPurifier.needed ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`}>
              {advisory.airPurifier.needed ? 'Recommended' : 'Optional'}
            </span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
            {advisory.airPurifier.text}
          </p>
        </div>

        {/* 6. WHO Safe Limit Reference */}
        <div className="p-4 sm:p-5 rounded-2xl liquid-glass border border-white/20 dark:border-white/10 space-y-2.5 shadow-sm">
          <div className="flex items-center gap-2 text-sm font-extrabold text-slate-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-teal-500" />
            <span>WHO 2021 Reference</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            WHO recommends maintaining 24-hr PM2.5 levels below 15 µg/m³ to protect cardiovascular and pulmonary vitality.
          </p>
        </div>
      </div>
    </div>
  );
};
