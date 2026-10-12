import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Clock, 
  Sparkles, 
  Layers,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { HourlyForecastPoint } from '../types/airQuality';

interface Forecast24hProps {
  forecast: HourlyForecastPoint[];
  forecastStats: {
    peakAqi: number;
    peakHour: string;
    lowestAqi: number;
    lowestHour: string;
    averageAqi: number;
    trend: 'improving' | 'stable' | 'deteriorating';
    trendSummary: string;
  };
}

type ForecastMetric = 'aqi' | 'pm2_5' | 'pm10' | 'o3' | 'uvIndex';

export const Forecast24h: React.FC<Forecast24hProps> = ({ forecast, forecastStats }) => {
  const [selectedHourIdx, setSelectedHourIdx] = useState<number>(0);
  const [activeMetric, setActiveMetric] = useState<ForecastMetric>('aqi');

  if (!forecast || forecast.length === 0) {
    return null;
  }

  const selectedPoint = forecast[selectedHourIdx] || forecast[0];

  const chartHeight = 160;
  const chartWidth = 800;
  const paddingX = 35;
  const paddingY = 25;
  const innerWidth = chartWidth - paddingX * 2;
  const innerHeight = chartHeight - paddingY * 2;

  const getMetricValue = (pt: HourlyForecastPoint, metric: ForecastMetric): number => {
    switch (metric) {
      case 'aqi': return pt.aqi;
      case 'pm2_5': return pt.pm2_5;
      case 'pm10': return pt.pm10;
      case 'o3': return pt.o3;
      case 'uvIndex': return pt.uvIndex;
    }
  };

  const values = forecast.map(pt => getMetricValue(pt, activeMetric));
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const minVal = activeMetric === 'aqi' ? Math.max(0, Math.floor(rawMin / 10) * 10 - 10) : 0;
  const maxVal = Math.max(activeMetric === 'aqi' ? 60 : 20, Math.ceil(rawMax * 1.15));

  const pointsCount = forecast.length;
  const stepX = innerWidth / (pointsCount - 1);

  const svgCoords = forecast.map((pt, idx) => {
    const val = getMetricValue(pt, activeMetric);
    const x = paddingX + idx * stepX;
    const yRatio = (val - minVal) / (maxVal - minVal || 1);
    const y = paddingY + innerHeight * (1 - yRatio);
    return { x, y, pt, val, idx };
  });

  const pathD = svgCoords.reduce((acc, coord, idx) => {
    if (idx === 0) return `M ${coord.x} ${coord.y}`;
    const prev = svgCoords[idx - 1];
    const cx1 = prev.x + (coord.x - prev.x) / 2;
    const cy1 = prev.y;
    const cx2 = prev.x + (coord.x - prev.x) / 2;
    const cy2 = coord.y;
    return `${acc} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${coord.x} ${coord.y}`;
  }, '');

  const areaD = `${pathD} L ${svgCoords[svgCoords.length - 1].x} ${chartHeight - paddingY} L ${svgCoords[0].x} ${chartHeight - paddingY} Z`;
  const selectedCoord = svgCoords[selectedHourIdx] || svgCoords[0];

  return (
    <div className="rounded-3xl liquid-glass-elevated p-5 sm:p-7 shadow-2xl space-y-6">
      {/* Header & Material 3 Segmented Metric Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <Clock className="w-4 h-4" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              24-Hour Real Air Quality Forecast
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-mono">
              Next 24h
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Atmospheric dispersion simulation from current local time forward
          </p>
        </div>

        {/* Material 3 Segmented Buttons */}
        <div className="flex items-center p-1 rounded-full liquid-glass border border-white/20 dark:border-white/10 text-xs overflow-x-auto shadow-sm self-start lg:self-auto">
          {(['aqi', 'pm2_5', 'pm10', 'o3', 'uvIndex'] as ForecastMetric[]).map((metric) => {
            const labels: Record<ForecastMetric, string> = {
              aqi: 'US AQI',
              pm2_5: 'PM2.5',
              pm10: 'PM10',
              o3: 'Ozone',
              uvIndex: 'UV Index'
            };
            const isActive = activeMetric === metric;
            return (
              <button
                key={metric}
                onClick={() => setActiveMetric(metric)}
                className={`px-3 py-1.5 rounded-full font-bold transition whitespace-nowrap m3-state-layer ${
                  isActive
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/25'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {labels[metric]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 24-Hour Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Peak Window */}
        <div className="p-4 rounded-2xl liquid-glass border border-white/20 dark:border-white/10 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
              Peak Pollution
            </span>
            <span className="text-xl font-black text-rose-500">
              AQI {forecastStats.peakAqi}
            </span>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {forecastStats.peakHour}
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-rose-500/15 flex items-center justify-center text-rose-500">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Cleanest Window */}
        <div className="p-4 rounded-2xl liquid-glass border border-white/20 dark:border-white/10 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
              Cleanest Air Window
            </span>
            <span className="text-xl font-black text-emerald-500">
              AQI {forecastStats.lowestAqi}
            </span>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {forecastStats.lowestHour}
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center text-emerald-500">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* 24h Trend */}
        <div className="p-4 rounded-2xl liquid-glass border border-white/20 dark:border-white/10 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider block">
              24-Hour Projection
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              {forecastStats.trend === 'improving' ? (
                <TrendingDown className="w-4 h-4 text-emerald-500" />
              ) : forecastStats.trend === 'deteriorating' ? (
                <TrendingUp className="w-4 h-4 text-rose-500" />
              ) : (
                <Minus className="w-4 h-4 text-amber-500" />
              )}
              <span className="text-base font-black text-slate-800 dark:text-slate-200 capitalize">
                {forecastStats.trend}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
              Avg: {forecastStats.averageAqi} AQI
            </div>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-teal-500/15 flex items-center justify-center text-teal-600 dark:text-teal-400">
            <Sparkles className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Interactive SVG Chart HUD in Liquid Glass Surface */}
      <div className="relative p-4 sm:p-5 rounded-2xl liquid-glass border border-white/20 dark:border-white/10 shadow-inner">
        <div className="w-full overflow-x-auto scrollbar-none">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full min-w-[650px] h-44 overflow-visible select-none"
          >
            <defs>
              <linearGradient id="forecastAreaGradTheme" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.33, 0.66, 1].map((ratio, i) => {
              const y = paddingY + innerHeight * ratio;
              const val = Math.round(maxVal - ratio * (maxVal - minVal));
              return (
                <g key={i}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                    strokeDasharray="4 4"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    fill="#94A3B8"
                    fontSize="9"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Area */}
            <path d={areaD} fill="url(#forecastAreaGradTheme)" />

            {/* Curve */}
            <path
              d={pathD}
              fill="none"
              stroke="#0D9488"
              className="dark:stroke-teal-400"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Guideline */}
            {selectedCoord && (
              <line
                x1={selectedCoord.x}
                y1={paddingY}
                x2={selectedCoord.x}
                y2={chartHeight - paddingY}
                stroke="currentColor"
                className="text-teal-600 dark:text-teal-300"
                strokeWidth="2"
                strokeDasharray="3 3"
                opacity="0.9"
              />
            )}

            {/* Interactive Points */}
            {svgCoords.map(({ x, y, pt, idx }) => {
              const isSelected = selectedHourIdx === idx;
              return (
                <g
                  key={idx}
                  onClick={() => setSelectedHourIdx(idx)}
                  className="cursor-pointer group"
                >
                  <rect
                    x={x - stepX / 2}
                    y={paddingY}
                    width={stepX}
                    height={innerHeight}
                    fill="transparent"
                  />

                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r="9"
                      fill="none"
                      stroke={pt.category.color}
                      strokeWidth="3"
                      className="animate-ping opacity-60"
                    />
                  )}

                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 6.5 : 4}
                    fill={isSelected ? '#FFFFFF' : pt.category.color}
                    stroke={pt.category.color}
                    strokeWidth={isSelected ? 3.5 : 1.5}
                    className="transition-all duration-150"
                  />

                  {idx % 3 === 0 && (
                    <text
                      x={x}
                      y={chartHeight - 4}
                      fill="#94A3B8"
                      fontSize="9"
                      textAnchor="middle"
                      fontFamily="monospace"
                    >
                      {pt.hourLabel}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>

        {/* Selected Hour Details HUD in Liquid Glass */}
        <div className="mt-4 p-4 rounded-2xl liquid-glass border border-white/20 dark:border-white/10 grid grid-cols-1 md:grid-cols-12 gap-4 items-center shadow-md">
          <div className="md:col-span-4 flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl text-slate-950 shadow-lg shrink-0"
              style={{ backgroundColor: selectedPoint.category.color }}
            >
              {selectedPoint.aqi}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-base">
                  {selectedPoint.dateLabel} at {selectedPoint.hourLabel}
                </span>
                <span 
                  className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                  style={{ backgroundColor: `${selectedPoint.category.color}25`, color: selectedPoint.category.color }}
                >
                  +{selectedPoint.hoursFromNow}h
                </span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {selectedPoint.category.label} • Dominant: {selectedPoint.dominantPollutant}
              </div>
            </div>
          </div>

          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-xl liquid-glass border border-white/10 text-center">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-medium">PM2.5 Fine</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedPoint.pm2_5} µg/m³</span>
            </div>
            <div className="p-2.5 rounded-xl liquid-glass border border-white/10 text-center">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-medium">PM10 Dust</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedPoint.pm10} µg/m³</span>
            </div>
            <div className="p-2.5 rounded-xl liquid-glass border border-white/10 text-center">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-medium">Ozone (O₃)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedPoint.o3} µg/m³</span>
            </div>
            <div className="p-2.5 rounded-xl liquid-glass border border-white/10 text-center">
              <span className="text-slate-500 dark:text-slate-400 block text-[10px] font-medium">UV Radiation</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{selectedPoint.uvIndex} UV</span>
            </div>
          </div>
        </div>
      </div>

      {/* 24-Hour Scroller Carousel */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-teal-500" />
            24-Hour Consecutive Sequence
          </span>
          <span>Tap or drag any card</span>
        </div>

        <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1 scrollbar-thin">
          {forecast.map((pt, idx) => {
            const isSelected = selectedHourIdx === idx;
            return (
              <button
                key={idx}
                onClick={() => setSelectedHourIdx(idx)}
                className={`min-w-[88px] p-3 rounded-2xl border text-center transition flex flex-col items-center gap-1.5 shrink-0 m3-state-layer ${
                  isSelected
                    ? 'liquid-glass-elevated border-teal-500 ring-2 ring-teal-500/40 scale-105 shadow-lg'
                    : 'liquid-glass hover:bg-white/30 dark:hover:bg-white/10 border-white/20 dark:border-white/10'
                }`}
              >
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 font-bold">
                  {pt.hourLabel}
                </span>

                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-slate-950 shadow-sm"
                  style={{ backgroundColor: pt.category.color }}
                >
                  {pt.aqi}
                </div>

                <span className="text-[9px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[70px]">
                  {pt.category.name}
                </span>

                <span className="text-[9px] text-slate-400 dark:text-slate-500 font-mono">
                  {pt.pm2_5}µg
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
