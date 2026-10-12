import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  fetchAirQuality, 
  reverseGeocode, 
  POPULAR_CITIES 
} from './services/airQualityService';
import { 
  getStoredNotificationSettings, 
  getNotificationLogs, 
  startHourlyNotificationScheduler, 
  stopHourlyNotificationScheduler 
} from './services/notificationService';
import { useTheme } from './hooks/useTheme';
import { 
  AirLocation, 
  AirQualityData, 
  NotificationSettings, 
  MobileNavTab 
} from './types/airQuality';
import { Header } from './components/Header';
import { SearchBar } from './components/SearchBar';
import { AqiGauge } from './components/AqiGauge';
import { Forecast24h } from './components/Forecast24h';
import { PollutantsGrid } from './components/PollutantsGrid';
import { HealthAdvisories } from './components/HealthAdvisories';
import { AirMapModal } from './components/AirMapModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { AqiScaleGuideModal } from './components/AqiScaleGuideModal';
import { SavedCitiesBar } from './components/SavedCitiesBar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { 
  AlertCircle, 
  Loader2, 
  RefreshCw, 
  ShieldCheck, 
  BellRing,
  Radio
} from 'lucide-react';

const SAVED_CITIES_STORAGE_KEY = 'aura_saved_cities';

export default function App() {
  const { themeMode, isDark, setThemeMode } = useTheme();
  const [currentLocation, setCurrentLocation] = useState<AirLocation>(POPULAR_CITIES[1]); // New York default
  const [data, setData] = useState<AirQualityData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Mobile navigation active tab
  const [activeMobileTab, setActiveMobileTab] = useState<MobileNavTab>('dashboard');

  // Modals state
  const [showNotificationModal, setShowNotificationModal] = useState<boolean>(false);
  const [showMapModal, setShowMapModal] = useState<boolean>(false);
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Notifications status
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(getStoredNotificationSettings());
  const [unreadLogsCount, setUnreadLogsCount] = useState<number>(() => getNotificationLogs().length);

  // Section references for mobile tab auto-scrolling
  const overviewRef = useRef<HTMLElement>(null);
  const forecastRef = useRef<HTMLElement>(null);
  const pollutantsRef = useRef<HTMLElement>(null);
  const healthRef = useRef<HTMLElement>(null);

  // Saved/Bookmarked cities
  const [savedLocations, setSavedLocations] = useState<AirLocation[]>(() => {
    try {
      const raw = localStorage.getItem(SAVED_CITIES_STORAGE_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // fallback
    }
    return [POPULAR_CITIES[0], POPULAR_CITIES[1], POPULAR_CITIES[2]];
  });

  // Load air quality data
  const loadAirQuality = useCallback(async (loc: AirLocation) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchAirQuality(loc.latitude, loc.longitude, loc);
      setData(result);
      setCurrentLocation(loc);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Failed to fetch air quality data.';
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Browser Geolocation
  const handleUseCurrentLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          const detectedLoc = await reverseGeocode(lat, lon);
          await loadAirQuality(detectedLoc);
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Failed to resolve location.';
          setError(errMsg);
        } finally {
          setIsLocating(false);
        }
      },
      (geoError) => {
        setIsLocating(false);
        console.warn('Geolocation failed:', geoError);
      },
      { timeout: 12000, enableHighAccuracy: false }
    );
  }, [loadAirQuality]);

  // Initial load
  useEffect(() => {
    let mounted = true;
    startHourlyNotificationScheduler();

    if ('geolocation' in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (!mounted) return;
          try {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const loc = await reverseGeocode(lat, lon);
            await loadAirQuality(loc);
          } catch {
            await loadAirQuality(POPULAR_CITIES[1]);
          } finally {
            if (mounted) setIsLocating(false);
          }
        },
        async () => {
          if (!mounted) return;
          setIsLocating(false);
          await loadAirQuality(POPULAR_CITIES[1]);
        },
        { timeout: 8000 }
      );
    } else {
      loadAirQuality(POPULAR_CITIES[1]);
    }

    return () => {
      mounted = false;
      stopHourlyNotificationScheduler();
    };
  }, [loadAirQuality]);

  // Listen to notification events
  useEffect(() => {
    const handleLogAdded = () => {
      setUnreadLogsCount(getNotificationLogs().length);
    };
    const handleSettingsChanged = (e: CustomEvent) => {
      if (e.detail) setNotificationSettings(e.detail);
    };

    window.addEventListener('aura-notification-log-added', handleLogAdded);
    window.addEventListener('aura-notification-settings-changed', handleSettingsChanged as EventListener);
    return () => {
      window.removeEventListener('aura-notification-log-added', handleLogAdded);
      window.removeEventListener('aura-notification-settings-changed', handleSettingsChanged as EventListener);
    };
  }, []);

  // Theme cycler: system -> dark -> light -> system
  const handleCycleTheme = () => {
    if (themeMode === 'system') setThemeMode('dark');
    else if (themeMode === 'dark') setThemeMode('light');
    else setThemeMode('system');
  };

  // Mobile Tab switching
  const handleMobileTabChange = (tab: MobileNavTab) => {
    setActiveMobileTab(tab);
    if (tab === 'map') {
      setShowMapModal(true);
      return;
    }
    const targetMap: Record<string, React.RefObject<HTMLElement | null>> = {
      dashboard: overviewRef,
      forecast: forecastRef,
      pollutants: pollutantsRef,
      health: healthRef
    };
    const targetRef = targetMap[tab];
    if (targetRef && targetRef.current) {
      targetRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Toggle bookmark
  const handleToggleSaveLocation = (loc: AirLocation) => {
    setSavedLocations((prev) => {
      const exists = prev.some(
        (l) => l.latitude.toFixed(2) === loc.latitude.toFixed(2) && 
               l.longitude.toFixed(2) === loc.longitude.toFixed(2)
      );
      let updated: AirLocation[];
      if (exists) {
        updated = prev.filter(
          (l) => !(l.latitude.toFixed(2) === loc.latitude.toFixed(2) && 
                   l.longitude.toFixed(2) === loc.longitude.toFixed(2))
        );
      } else {
        updated = [...prev, loc];
      }
      localStorage.setItem(SAVED_CITIES_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const categoryColor = data?.current.category.color || '#14B8A6';

  return (
    <div className="min-h-screen relative flex flex-col font-sans transition-colors duration-500 overflow-x-hidden pb-16 md:pb-0">
      {/* 100% REAL Liquid Glass Ambient Backlight Canvas */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        {/* Primary Liquid Orb */}
        <div 
          className="absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full blur-[110px] opacity-25 dark:opacity-20 animate-fluid-1 transition-colors duration-1000"
          style={{ backgroundColor: categoryColor }}
        />
        {/* Secondary Cyan/Teal Liquid Orb */}
        <div 
          className="absolute top-1/3 -right-32 w-[600px] h-[600px] rounded-full blur-[130px] opacity-20 dark:opacity-15 animate-fluid-2 bg-cyan-500 transition-colors duration-1000"
        />
        {/* Subtle Bottom Ambient Orb */}
        <div 
          className="absolute -bottom-48 left-10 w-[650px] h-[650px] rounded-full blur-[140px] opacity-15 dark:opacity-10 bg-teal-600 transition-colors duration-1000"
        />
      </div>

      {/* Material 3 Top Navigation Bar */}
      <Header
        currentLocation={currentLocation}
        isLoading={isLoading}
        onRefresh={() => loadAirQuality(currentLocation)}
        onOpenNotifications={() => setShowNotificationModal(true)}
        onOpenMap={() => setShowMapModal(true)}
        onOpenGuide={() => setShowGuideModal(true)}
        notificationsEnabled={notificationSettings.enabled}
        unreadCount={unreadLogsCount}
        onUseCurrentLocation={handleUseCurrentLocation}
        themeMode={themeMode}
        onCycleTheme={handleCycleTheme}
        isDark={isDark}
      />

      {/* Main Responsive Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-7 space-y-6">
        {/* Worldwide Search & Megacity Chips */}
        <section aria-label="Location Search">
          <SearchBar
            onSelectLocation={loadAirQuality}
            onUseCurrentLocation={handleUseCurrentLocation}
            isLocating={isLocating}
            selectedCityName={currentLocation.name}
          />
        </section>

        {/* Saved Cities Bar */}
        <section aria-label="Saved Cities">
          <SavedCitiesBar
            savedLocations={savedLocations}
            currentLocation={currentLocation}
            onSelectLocation={loadAirQuality}
            onToggleSave={handleToggleSaveLocation}
          />
        </section>

        {/* Hourly Notification Status Banner */}
        {notificationSettings.enabled && (
          <div className="p-3.5 rounded-2xl liquid-glass border border-teal-500/30 text-xs flex items-center justify-between gap-3 text-teal-800 dark:text-teal-300 shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center shrink-0">
                <BellRing className="w-4 h-4 text-teal-600 dark:text-teal-400 animate-bounce" />
              </div>
              <span className="font-medium">
                <b className="font-bold">Hourly GPS Alert Active:</b> System checks your current location every hour and sends desktop air quality notifications.
              </span>
            </div>
            <button
              onClick={() => setShowNotificationModal(true)}
              className="text-[11px] underline hover:text-teal-900 dark:hover:text-teal-100 font-bold shrink-0"
            >
              Configure
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 sm:p-5 rounded-2xl liquid-glass border border-rose-500/30 text-rose-700 dark:text-rose-300 flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <div className="text-sm">
                <span className="font-black block">Air Quality Data Notice</span>
                <span className="font-medium">{error}</span>
              </div>
            </div>
            <button
              onClick={() => loadAirQuality(currentLocation)}
              className="px-3.5 py-1.5 rounded-full bg-rose-500/20 hover:bg-rose-500/30 text-rose-800 dark:text-rose-200 text-xs font-bold flex items-center gap-1.5 transition m3-state-layer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && !data && (
          <div className="py-24 flex flex-col items-center justify-center space-y-4 liquid-glass rounded-3xl p-8">
            <Loader2 className="w-10 h-10 animate-spin text-teal-500" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              Querying Air Quality Open Data Platform & Copernicus CAMS...
            </p>
          </div>
        )}

        {/* Main Dashboard Sections */}
        {data && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Overview / Primary Gauge */}
            <section ref={overviewRef} aria-label="Current Air Quality Status" className="scroll-mt-24">
              <AqiGauge data={data} />
            </section>

            {/* From Current Time 24-Hour Real Forecast */}
            <section ref={forecastRef} aria-label="24-Hour Real Forecast" className="scroll-mt-24">
              <Forecast24h
                forecast={data.forecast24h}
                forecastStats={data.forecastStats}
              />
            </section>

            {/* Pollutant Diagnostics */}
            <section ref={pollutantsRef} aria-label="Pollutant Breakdown" className="scroll-mt-24">
              <PollutantsGrid pollutants={data.current.pollutants} />
            </section>

            {/* Health Advisories */}
            <section ref={healthRef} aria-label="Health Recommendations" className="scroll-mt-24">
              <HealthAdvisories
                advisory={data.healthAdvisory}
                aqi={data.current.aqi}
              />
            </section>
          </div>
        )}
      </main>

      {/* Desktop / Laptop Footer */}
      <footer className="border-t border-white/10 dark:border-white/5 py-8 px-4 text-xs text-slate-500 dark:text-slate-400 mt-12 transition-colors">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-medium">
            <ShieldCheck className="w-4 h-4 text-teal-500" />
            <span>
              AuraAir Worldwide • Powered by Air Quality Open Data Platform (WAQI) & Copernicus CAMS
            </span>
          </div>

          <div className="flex items-center gap-4 font-semibold">
            <button
              onClick={() => setShowGuideModal(true)}
              className="hover:text-teal-600 dark:hover:text-teal-400 transition"
            >
              EPA AQI Guidelines
            </button>
            <span>•</span>
            <button
              onClick={() => setShowMapModal(true)}
              className="hover:text-teal-600 dark:hover:text-teal-400 transition"
            >
              World Map
            </button>
            <span>•</span>
            <button
              onClick={() => setShowNotificationModal(true)}
              className="hover:text-teal-600 dark:hover:text-teal-400 transition"
            >
              Hourly Alerts
            </button>
          </div>
        </div>
      </footer>

      {/* Native Mobile Bottom Navigation Bar (Material 3 Liquid Glass) */}
      <MobileBottomNav
        activeTab={activeMobileTab}
        onTabChange={handleMobileTabChange}
        onOpenNotifications={() => setShowNotificationModal(true)}
        unreadCount={unreadLogsCount}
      />

      {/* Modals & Dialogs */}
      <NotificationCenterModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        onSettingsChanged={setNotificationSettings}
      />

      {data && (
        <AirMapModal
          isOpen={showMapModal}
          onClose={() => setShowMapModal(false)}
          currentLocation={currentLocation}
          currentAqi={data.current.aqi}
          onSelectLocation={loadAirQuality}
          isDark={isDark}
        />
      )}

      <AqiScaleGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />
    </div>
  );
}
