import React from 'react';
import { Bookmark, BookmarkCheck, MapPin } from 'lucide-react';
import { AirLocation } from '../types/airQuality';

interface SavedCitiesBarProps {
  savedLocations: AirLocation[];
  currentLocation: AirLocation;
  onSelectLocation: (loc: AirLocation) => void;
  onToggleSave: (loc: AirLocation) => void;
}

export const SavedCitiesBar: React.FC<SavedCitiesBarProps> = ({
  savedLocations,
  currentLocation,
  onSelectLocation,
  onToggleSave
}) => {
  const isCurrentSaved = savedLocations.some(
    (l) => l.latitude.toFixed(2) === currentLocation.latitude.toFixed(2) && 
           l.longitude.toFixed(2) === currentLocation.longitude.toFixed(2)
  );

  return (
    <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-2xl sm:rounded-3xl liquid-glass border border-white/20 dark:border-white/10 text-xs shadow-sm">
      <div className="flex items-center gap-2 overflow-x-auto py-0.5 scrollbar-none">
        <span className="text-slate-600 dark:text-slate-400 font-bold flex items-center gap-1.5 whitespace-nowrap pl-1">
          <Bookmark className="w-3.5 h-3.5 text-teal-500" />
          Saved Stations ({savedLocations.length}):
        </span>

        {savedLocations.length === 0 ? (
          <span className="text-slate-400 dark:text-slate-500 italic">
            Bookmark cities for quick comparisons
          </span>
        ) : (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            {savedLocations.map((loc) => {
              const isSelected = 
                loc.latitude.toFixed(2) === currentLocation.latitude.toFixed(2) &&
                loc.longitude.toFixed(2) === currentLocation.longitude.toFixed(2);
              return (
                <button
                  key={`${loc.latitude}-${loc.longitude}`}
                  onClick={() => onSelectLocation(loc)}
                  className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 whitespace-nowrap transition m3-state-layer ${
                    isSelected
                      ? 'bg-teal-500 text-slate-950 font-bold border-teal-500 shadow-md shadow-teal-500/25'
                      : 'liquid-glass hover:bg-white/30 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border-white/20 dark:border-white/10 font-semibold'
                  }`}
                >
                  <MapPin className={`w-3 h-3 ${isSelected ? 'text-slate-950' : 'text-teal-500'}`} />
                  <span>{loc.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Bookmark Action */}
      <button
        onClick={() => onToggleSave(currentLocation)}
        className={`px-3.5 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition shrink-0 m3-state-layer ${
          isCurrentSaved
            ? 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border border-teal-500/30'
            : 'liquid-glass hover:bg-white/30 dark:hover:bg-white/10 text-slate-700 dark:text-slate-200 border border-white/20 dark:border-white/10'
        }`}
      >
        {isCurrentSaved ? (
          <>
            <BookmarkCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span>Bookmarked</span>
          </>
        ) : (
          <>
            <Bookmark className="w-3.5 h-3.5" />
            <span>Bookmark City</span>
          </>
        )}
      </button>
    </div>
  );
};
