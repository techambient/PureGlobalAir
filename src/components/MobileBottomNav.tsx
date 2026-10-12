import React from 'react';
import { 
  Gauge, 
  Clock, 
  Atom, 
  HeartHandshake, 
  Map as MapIcon, 
  Bell 
} from 'lucide-react';
import { MobileNavTab } from '../types/airQuality';

interface MobileBottomNavProps {
  activeTab: MobileNavTab;
  onTabChange: (tab: MobileNavTab) => void;
  onOpenNotifications: () => void;
  unreadCount: number;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onTabChange,
  onOpenNotifications,
  unreadCount
}) => {
  const tabs = [
    { id: 'dashboard' as MobileNavTab, label: 'Overview', icon: Gauge },
    { id: 'forecast' as MobileNavTab, label: '24h Forecast', icon: Clock },
    { id: 'pollutants' as MobileNavTab, label: 'Pollutants', icon: Atom },
    { id: 'health' as MobileNavTab, label: 'Health', icon: HeartHandshake },
    { id: 'map' as MobileNavTab, label: 'Map', icon: MapIcon },
  ];

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-safe pt-1 liquid-glass-elevated border-t border-white/10 dark:border-white/10 shadow-2xl transition-all"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto py-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className="flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all group m3-state-layer relative"
            >
              {/* Material 3 active pill background */}
              <div 
                className={`flex items-center justify-center w-12 h-7 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-teal-500/25 text-teal-600 dark:text-teal-300 scale-105 shadow-sm' 
                    : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-800 dark:group-hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform ${isActive ? 'scale-110 stroke-[2.5]' : ''}`} />
              </div>
              <span 
                className={`text-[10px] font-medium tracking-tight mt-0.5 transition-colors ${
                  isActive 
                    ? 'font-bold text-teal-700 dark:text-teal-300' 
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}

        {/* Quick notification trigger */}
        <button
          onClick={onOpenNotifications}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-2xl transition-all relative group m3-state-layer"
          title="Hourly Alerts"
        >
          <div className="flex items-center justify-center w-12 h-7 rounded-full text-slate-500 dark:text-slate-400 group-hover:text-amber-500 transition-colors relative">
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-2.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-0.5 text-slate-500 dark:text-slate-400">
            Alerts
          </span>
        </button>
      </div>
    </nav>
  );
};
