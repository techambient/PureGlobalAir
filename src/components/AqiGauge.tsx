import React from 'react';
import { 
  Thermometer, 
  Droplets, 
  Wind, 
  Radio, 
  ExternalLink, 
  Activity, 
  Sparkles,
  AlertOctagon,
  Clock,
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { AirQualityData } from '../types/airQuality';

interface AqiGaugeProps {
  data: AirQualityData;
}

export const AqiGauge: React.FC<AqiGaugeProps> = ({ data }) => {
  const { current, location, fetchedAt } = data;
  const aqi = current.aqi;
  const category = current.category;

  const normalizedAqi = Math.min(Math.max(aqi, 0), 500);
  const percentage = normalizedAqi / 500;
  const radius = 88;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference * (1 - percentage);

  const fetchDate = new Date(fetchedAt);
  const timeFormatted = fetchDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative overflow-hidden rounded-3xl liquid-glass-elevated p-5 sm:p-7 shadow-2xl transition-all">
      {/* Dynamic Fluid Atmospheric Glow */}
      <div 
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-25 dark:opacity-30 transition-all duration-1000 animate-fluid-1"
        style={{ backgroundColor: category.color }}
      />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left Column: Location & Category Status */}
        <div className="lg:col-span-4 space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              <span 
                className="inline-block w-2.5 h-2.5 rounded-full animate-ping" 
                style={{ backgroundColor: category.color }}
              />
              <span>Live Atmospheric Monitoring</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-1">
              {location.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
              {[location.adminRegion, location.country].filter(Boolean).join(', ')}
            </p>
          </div>

          {/* Liquid Glass Category Card */}
          <div 
            className="p-4 rounded-2xl border transition-all shadow-md relative overflow-hidden"
            style={{ 
              backgroundColor: `${category.color}15`,
              borderColor: `${category.color}40`,
            }}
          >
            <div className="flex items-center gap-2.5 font-black text-base sm:text-lg" style={{ color: category.color }}>
              {aqi > 150 ? (
                <AlertOctagon className="w-5 h-5 shrink-0" />
              ) : (
                <Activity className="w-5 h-5 shrink-0" />
              )}
              <span>{category.label}</span>
            </div>
            <p className="text-xs mt-1.5 text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
              {category.description}
            </p>
          </div>

          {/* Dominant Pollutant & Standards Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl liquid-glass border border-white/20 dark:border-white/10 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Dominant:
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {current.dominantPollutant.name} ({current.dominantPollutant.value.toFixed(1)} {current.dominantPollutant.unit})
              </span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl liquid-glass border border-white/20 dark:border-white/10 shadow-sm">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                EU Standard AQI:
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {current.europeanAqi} (EU Scale)
              </span>
            </div>
          </div>
        </div>

        {/* Center Column: Radial Liquid Arc Gauge */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center py-2 sm:py-4">
          <div className="relative w-64 h-36 flex items-end justify-center">
            <svg className="w-64 h-36 overflow-visible" viewBox="0 0 200 110">
              <defs>
                <filter id="liquidGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {/* Background Glass Track */}
              <path
                d="M 12 100 A 88 88 0 0 1 188 100"
                fill="none"
                stroke="currentColor"
                className="text-slate-200/80 dark:text-slate-800/80"
                strokeWidth="14"
                strokeLinecap="round"
              />

              {/* Dynamic Value Arc with Specular Glow */}
              <path
                d="M 12 100 A 88 88 0 0 1 188 100"
                fill="none"
                stroke={category.color}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                filter="url(#liquidGlow)"
                className="transition-all duration-1000 ease-out"
              />

              {/* Scale Ticks */}
              <text x="12" y="118" fill="#64748B" fontSize="9" textAnchor="middle" fontFamily="monospace">0</text>
              <text x="56" y="85" fill="#64748B" fontSize="8" textAnchor="middle" fontFamily="monospace">50</text>
              <text x="100" y="70" fill="#64748B" fontSize="8" textAnchor="middle" fontFamily="monospace">100</text>
              <text x="144" y="85" fill="#64748B" fontSize="8" textAnchor="middle" fontFamily="monospace">200</text>
              <text x="188" y="118" fill="#64748B" fontSize="9" textAnchor="middle" fontFamily="monospace">500</text>
            </svg>

            {/* Centered Numbers */}
            <div className="absolute -bottom-2 flex flex-col items-center select-none">
              <span 
                className="text-5xl sm:text-6xl font-black tracking-tight drop-shadow-sm transition-all" 
                style={{ color: category.color }}
              >
                {aqi}
              </span>
              <span className="text-[10px] sm:text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-0.5">
                US EPA AQI
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>Updated: {timeFormatted}</span>
          </div>
        </div>

        {/* Right Column: Dispersion Weather & Station Details */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Dispersion Weather Conditions
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Temperature */}
            <div className="p-3 rounded-2xl liquid-glass text-center border border-white/20 dark:border-white/10 shadow-sm">
              <Thermometer className="w-4 h-4 mx-auto text-amber-500 mb-1" />
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {current.weather?.temperatureC !== undefined ? `${current.weather.temperatureC}°C` : '--'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Temp</div>
            </div>

            {/* Humidity */}
            <div className="p-3 rounded-2xl liquid-glass text-center border border-white/20 dark:border-white/10 shadow-sm">
              <Droplets className="w-4 h-4 mx-auto text-cyan-500 mb-1" />
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {current.weather?.relativeHumidity !== undefined ? `${current.weather.relativeHumidity}%` : '--'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Humidity</div>
            </div>

            {/* Wind Speed */}
            <div className="p-3 rounded-2xl liquid-glass text-center border border-white/20 dark:border-white/10 shadow-sm">
              <Wind className="w-4 h-4 mx-auto text-teal-500 mb-1" />
              <div className="text-sm font-black text-slate-900 dark:text-white">
                {current.weather?.windSpeedKmh !== undefined ? `${current.weather.windSpeedKmh} km/h` : '--'}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Wind</div>
            </div>
          </div>

          {/* Station Attribution Card */}
          <div className="p-3.5 rounded-2xl liquid-glass text-xs space-y-1.5 border border-white/20 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold">
              <Radio className="w-3.5 h-3.5 text-teal-500" />
              <span className="truncate">{current.station?.name || 'Copernicus Atmospheric Station'}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="truncate">{current.station?.attribution}</span>
              {current.station?.url && (
                <a
                  href={current.station.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-teal-600 dark:text-teal-400 hover:underline ml-1 shrink-0 font-medium"
                >
                  <span>Portal</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
