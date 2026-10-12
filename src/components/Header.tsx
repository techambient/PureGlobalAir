import React from 'react';
import { 
  Wind, 
  Bell, 
  MapPin, 
  RefreshCw, 
  Info, 
  Map as MapIcon, 
  Sun, 
  Moon, 
  Laptop, 
  Compass,
  Radio
} from 'lucide-react';
import { AirLocation, ThemeMode } from '../types/airQuality';

interface HeaderProps {
  currentLocation?: AirLocation;
  isLoading: boolean;
  onRefresh: () => void;
  onOpenNotifications: () => void;
  onOpenMap: () => void;
  onOpenGuide: () => void;
  notificationsEnabled: boolean;
  unreadCount: number;
  onUseCurrentLocation: () => void;
  themeMode: ThemeMode;
  onCycleTheme: () => void;
  isDark: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  isLoading,
  onRefresh,
  onOpenNotifications,
  onOpenMap,
  onOpenGuide,
  notificationsEnabled,
  unreadCount,
  onUseCurrentLocation,
  themeMode,
  onCycleTheme,
  isDark
}) => {
  const getThemeIcon = () => {
    if (themeMode === 'system') return <Laptop className="w-3.5 h-3.5 text-teal-500 dark:text-teal-400" />;
    if (themeMode === 'dark') return <Moon className="w-3.5 h-3.5 text-indigo-400" />;
    return <Sun className="w-3.5 h-3.5 text-amber-500" />;
  };

  const getThemeLabel = () => {
    if (themeMode === 'system') return 'Auto System';
    if (themeMode === 'dark') return 'Obsidian Dark';
    return 'Liquid Light';
  };

  return (
    <header className="sticky top-0 z-40 px-3 sm:px-6 lg:px-8 py-2.5 transition-colors">
      <div className="max-w-7xl mx-auto liquid-glass rounded-2xl sm:rounded-3xl px-3.5 sm:px-5 py-2.5 flex items-center justify-between gap-3 shadow-xl">
        {/* Brand with Liquid Glass Glow */}
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-teal-500 via-teal-400 to-cyan-300 text-slate-950 shadow-md shadow-teal-500/25 transition-transform hover:scale-105">
            <Wind className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-lg sm:text-xl font-black tracking-tight bg-gradient-to-r from-slate-900 via-slate-700 to-slate-900 dark:from-white dark:via-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
                AuraAir
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 animate-pulse text-teal-500" />
                <span className="hidden xs:inline">Open Data</span>
                <span>API</span>
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Worldwide Air Quality Index & 24h Real Forecast
            </p>
          </div>
        </div>

        {/* Center / Location badge (visible on tablet/laptop) */}
        {currentLocation && (
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1.5 rounded-full liquid-glass text-xs text-slate-700 dark:text-slate-300 border border-white/20 dark:border-white/10 shadow-sm">
            <MapPin className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            <span className="font-semibold truncate max-w-[220px]">
              {currentLocation.name}{currentLocation.country ? `, ${currentLocation.country}` : ''}
            </span>
            {currentLocation.isCurrentLocation && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-700 dark:text-teal-300 font-bold uppercase tracking-wider">
                GPS
              </span>
            )}
          </div>
        )}

        {/* Actions Suite */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Theme Toggle Button (Supports Device Default System + Switchable) */}
          <button
            onClick={onCycleTheme}
            title={`Current theme: ${getThemeLabel()} (Click to toggle)`}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full liquid-glass hover:bg-white/30 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-semibold transition shadow-sm m3-state-layer"
          >
            {getThemeIcon()}
            <span className="hidden md:inline text-[11px] font-medium">{getThemeLabel()}</span>
          </button>

          {/* GPS Locate Me on desktop/tablet */}
          <button
            onClick={onUseCurrentLocation}
            title="Locate via GPS"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass hover:bg-white/30 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-medium transition m3-state-layer"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-500 dark:text-cyan-400" />
            <span className="hidden md:inline">My GPS</span>
          </button>

          {/* Interactive World Map */}
          <button
            onClick={onOpenMap}
            title="World Air Quality Map"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full liquid-glass hover:bg-white/30 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-medium transition m3-state-layer"
          >
            <MapIcon className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Map</span>
          </button>

          {/* Hourly Alerts Bell Button */}
          <button
            onClick={onOpenNotifications}
            title="Hourly Location Alerts"
            className="relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full liquid-glass hover:bg-white/30 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 text-xs font-medium transition m3-state-layer"
          >
            <Bell className={`w-3.5 h-3.5 ${notificationsEnabled ? 'text-amber-500 dark:text-amber-400 fill-amber-500/20' : 'text-slate-400'}`} />
            <span className="hidden lg:inline">Hourly Alerts</span>
            {notificationsEnabled ? (
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" title="Hourly active" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-slate-400" title="Alerts paused" />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[9px] font-bold shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>

          {/* AQI Guide Modal */}
          <button
            onClick={onOpenGuide}
            title="AQI Guide Scale"
            className="p-2 rounded-full liquid-glass hover:bg-white/30 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 transition m3-state-layer"
          >
            <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </button>

          {/* Refresh Data */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh Station Data"
            className="p-2 rounded-full liquid-glass hover:bg-white/30 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition m3-state-layer"
          >
            <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isLoading ? 'animate-spin text-teal-500' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
