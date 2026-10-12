import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2, X, Compass, Globe, Sparkles } from 'lucide-react';
import { AirLocation, CitySearchResult } from '../types/airQuality';
import { searchCities, POPULAR_CITIES } from '../services/airQualityService';

interface SearchBarProps {
  onSelectLocation: (loc: AirLocation) => void;
  onUseCurrentLocation: () => void;
  isLocating: boolean;
  selectedCityName?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectLocation,
  onUseCurrentLocation,
  isLocating,
  selectedCityName
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CitySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const cities = await searchCities(query);
      setResults(cities);
      setIsSearching(false);
      setIsOpen(true);
    }, 280);

    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: CitySearchResult) => {
    onSelectLocation({
      name: item.name,
      adminRegion: item.admin1,
      country: item.country,
      countryCode: item.country_code,
      latitude: item.latitude,
      longitude: item.longitude,
      timezone: item.timezone,
      isCurrentLocation: false
    });
    setQuery('');
    setIsOpen(false);
  };

  const handlePresetSelect = (preset: AirLocation) => {
    onSelectLocation({ ...preset, isCurrentLocation: false });
  };

  return (
    <div className="w-full space-y-3" ref={dropdownRef}>
      {/* Material 3 Search Bar with Liquid Glass */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
        <div className="relative flex-1">
          <div className="liquid-glass rounded-2xl sm:rounded-full px-4 py-1.5 flex items-center gap-3 transition-all focus-within:ring-2 focus-within:ring-teal-500/40 focus-within:border-teal-500/50 shadow-lg">
            <div className="text-slate-400 dark:text-slate-500 shrink-0">
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
              ) : (
                <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              )}
            </div>

            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => {
                if (results.length > 0) setIsOpen(true);
              }}
              placeholder="Search any worldwide city, capital, or coordinates..."
              className="w-full bg-transparent text-sm py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none font-medium"
            />

            {query && (
              <button
                onClick={() => {
                  setQuery('');
                  setResults([]);
                  setIsOpen(false);
                }}
                className="p-1 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown with Liquid Glass */}
          {isOpen && results.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 z-50 liquid-glass-elevated rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-72 overflow-y-auto divide-y divide-white/10 dark:divide-white/5 border border-white/20 dark:border-white/10">
              {results.map((city) => (
                <button
                  key={`${city.id}-${city.latitude}-${city.longitude}`}
                  onClick={() => handleSelect(city)}
                  className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-teal-500/10 dark:hover:bg-teal-500/15 transition group m3-state-layer"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-teal-500/15 flex items-center justify-center shrink-0 text-teal-600 dark:text-teal-400">
                      <Globe className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-teal-600 dark:group-hover:text-teal-300">
                        {city.name}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {[city.admin1, city.country].filter(Boolean).join(', ')}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0 ml-2">
                    {city.latitude.toFixed(1)}°, {city.longitude.toFixed(1)}°
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* GPS Locate Action (Material 3 Filled Tonal Button) */}
        <button
          onClick={onUseCurrentLocation}
          disabled={isLocating}
          className="liquid-glass hover:bg-teal-500/20 active:scale-[0.98] rounded-2xl sm:rounded-full px-5 py-3 sm:py-2.5 flex items-center justify-center gap-2 text-sm font-bold text-teal-700 dark:text-teal-300 border border-teal-500/30 transition shadow-md shrink-0 m3-state-layer"
        >
          {isLocating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
              <span>Detecting GPS...</span>
            </>
          ) : (
            <>
              <Compass className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <span>Current GPS</span>
            </>
          )}
        </button>
      </div>

      {/* Material 3 Assist / Filter Chips for Popular Cities */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
        <span className="text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap pl-1 pr-1 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-teal-500" />
          Megacities:
        </span>
        {POPULAR_CITIES.map((city) => {
          const isActive = selectedCityName === city.name;
          return (
            <button
              key={city.name}
              onClick={() => handlePresetSelect(city)}
              className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition m3-state-layer ${
                isActive
                  ? 'bg-teal-500 text-slate-950 font-bold shadow-md shadow-teal-500/30 scale-105'
                  : 'liquid-glass text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-white/20 dark:border-white/10'
              }`}
            >
              {city.name}
            </button>
          );
        })}
      </div>
    </div>
  );
};
