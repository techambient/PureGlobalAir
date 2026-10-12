import React, { useEffect, useRef } from 'react';
import { X, MapPin, Globe2 } from 'lucide-react';
import L from 'leaflet';
import { AirLocation } from '../types/airQuality';
import { POPULAR_CITIES } from '../services/airQualityService';

interface AirMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: AirLocation;
  currentAqi: number;
  onSelectLocation: (loc: AirLocation) => void;
  isDark?: boolean;
}

export const AirMapModal: React.FC<AirMapModalProps> = ({
  isOpen,
  onClose,
  currentLocation,
  currentAqi,
  onSelectLocation,
  isDark = true
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [currentLocation.latitude, currentLocation.longitude],
        zoom: 5,
        attributionControl: false
      });

      // CartoDB tiles adapt to theme
      const tileUrl = isDark
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

      L.tileLayer(tileUrl, {
        maxZoom: 19,
        subdomains: 'abcd'
      }).addTo(map);

      const getAqiColor = (val: number) => {
        if (val <= 50) return '#10B981';
        if (val <= 100) return '#F59E0B';
        if (val <= 150) return '#F97316';
        if (val <= 200) return '#EF4444';
        if (val <= 300) return '#8B5CF6';
        return '#991B1B';
      };

      const currentColor = getAqiColor(currentAqi);

      const currentIcon = L.divIcon({
        className: 'custom-aqi-marker',
        html: `
          <div style="
            background-color: ${currentColor};
            color: #020617;
            font-weight: 900;
            font-size: 13px;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 3px solid #FFFFFF;
            box-shadow: 0 0 20px ${currentColor}aa;
          ">
            ${currentAqi}
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const currentMarker = L.marker([currentLocation.latitude, currentLocation.longitude], {
        icon: currentIcon
      }).addTo(map);

      currentMarker.bindPopup(`
        <div style="color: #0f172a; padding: 4px; font-family: sans-serif;">
          <b style="font-size: 14px;">${currentLocation.name}</b><br/>
          <span>Current AQI: <b style="color: ${currentColor}; font-size: 15px;">${currentAqi}</b></span><br/>
          <span style="font-size: 11px; color: #64748b;">${currentLocation.latitude.toFixed(2)}°, ${currentLocation.longitude.toFixed(2)}°</span>
        </div>
      `).openPopup();

      POPULAR_CITIES.forEach((city) => {
        if (city.name === currentLocation.name) return;

        const cityMarker = L.circleMarker([city.latitude, city.longitude], {
          radius: 9,
          fillColor: '#14B8A6',
          color: '#FFFFFF',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.85
        }).addTo(map);

        cityMarker.bindTooltip(`<b>${city.name}</b>, ${city.country}<br/><span style="color:#0ea5e9;">Click to inspect AQI</span>`, {
          direction: 'top'
        });

        cityMarker.on('click', () => {
          onSelectLocation(city);
          onClose();
        });
      });

      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        onSelectLocation({
          name: `Location (${lat.toFixed(2)}°, ${lng.toFixed(2)}°)`,
          country: 'Selected Coordinates',
          latitude: lat,
          longitude: lng,
          isCurrentLocation: false
        });
        onClose();
      });

      mapInstanceRef.current = map;
    }, 100);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, currentLocation, currentAqi, isDark]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl h-[88vh] sm:h-[85vh] rounded-3xl liquid-glass-elevated shadow-2xl flex flex-col overflow-hidden border border-white/20 dark:border-white/10">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/15 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <Globe2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Worldwide Air Quality Station Map
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Tap any city marker or click anywhere on earth to inspect real-time metrics
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

        {/* Map Container */}
        <div className="relative flex-1 w-full h-full bg-slate-900">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Scale Legend Overlay */}
          <div className="absolute bottom-4 left-4 z-[400] p-3 rounded-2xl liquid-glass text-xs shadow-xl space-y-1.5 border border-white/20 dark:border-white/10 pointer-events-auto">
            <span className="font-extrabold text-slate-900 dark:text-white block text-[11px] uppercase tracking-wider">
              EPA AQI Scale
            </span>
            <div className="flex items-center gap-2 font-medium">
              <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm" />
              <span className="text-slate-700 dark:text-slate-300">0-50 Good</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm" />
              <span className="text-slate-700 dark:text-slate-300">51-100 Moderate</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm" />
              <span className="text-slate-700 dark:text-slate-300">101-150 Sensitive</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <span className="w-3 h-3 rounded-full bg-rose-500 shadow-sm" />
              <span className="text-slate-700 dark:text-slate-300">151-200 Unhealthy</span>
            </div>
            <div className="flex items-center gap-2 font-medium">
              <span className="w-3 h-3 rounded-full bg-purple-500 shadow-sm" />
              <span className="text-slate-700 dark:text-slate-300">201-300 Very Unhealthy</span>
            </div>
          </div>

          {/* Location Badge Overlay */}
          <div className="absolute top-4 right-4 z-[400] p-3 rounded-2xl liquid-glass text-xs shadow-xl flex items-center gap-3 border border-white/20 dark:border-white/10">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-teal-500" />
              <div>
                <span className="font-extrabold text-slate-900 dark:text-white block">{currentLocation.name}</span>
                <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">Active Center</span>
              </div>
            </div>
            <div className="px-3 py-1 rounded-xl bg-teal-500 text-slate-950 font-black font-mono shadow-sm">
              AQI {currentAqi}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
