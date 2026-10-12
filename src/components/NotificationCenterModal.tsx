import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bell, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Trash2, 
  Play, 
  Send, 
  Key,
  ShieldCheck,
  Smartphone,
  Laptop
} from 'lucide-react';
import { NotificationLog, NotificationSettings } from '../types/airQuality';
import { 
  checkNotificationPermission, 
  requestNotificationPermission, 
  playAlertChime, 
  getStoredNotificationSettings, 
  saveNotificationSettings, 
  getNotificationLogs, 
  clearNotificationLogs, 
  executeHourlyLocationCheck 
} from '../services/notificationService';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsChanged: (settings: NotificationSettings) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  onSettingsChanged
}) => {
  const [settings, setSettings] = useState<NotificationSettings>(getStoredNotificationSettings());
  const [permission, setPermission] = useState<NotificationPermission>(checkNotificationPermission());
  const [logs, setLogs] = useState<NotificationLog[]>(getNotificationLogs());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [waqiTokenInput, setWaqiTokenInput] = useState<string>(() => localStorage.getItem('waqi_token') || '');
  const [tokenSaved, setTokenSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSettings(getStoredNotificationSettings());
      setPermission(checkNotificationPermission());
      setLogs(getNotificationLogs());
    }
  }, [isOpen]);

  useEffect(() => {
    const handleLogAdded = () => {
      setLogs(getNotificationLogs());
    };
    window.addEventListener('aura-notification-log-added', handleLogAdded);
    return () => window.removeEventListener('aura-notification-log-added', handleLogAdded);
  }, []);

  if (!isOpen) return null;

  const handleToggleEnabled = async () => {
    if (!settings.enabled && permission !== 'granted') {
      const res = await requestNotificationPermission();
      setPermission(res);
      if (res !== 'granted') {
        setTestResult('Browser notification permission is required for alerts.');
        return;
      }
    }

    const updated = { ...settings, enabled: !settings.enabled };
    setSettings(updated);
    saveNotificationSettings(updated);
    onSettingsChanged(updated);
  };

  const handleUpdateFrequency = (freq: NotificationSettings['frequency']) => {
    const updated = { ...settings, frequency: freq };
    setSettings(updated);
    saveNotificationSettings(updated);
    onSettingsChanged(updated);
  };

  const handleToggleSound = () => {
    const updated = { ...settings, sound: !settings.sound };
    setSettings(updated);
    saveNotificationSettings(updated);
    onSettingsChanged(updated);
    if (updated.sound) {
      playAlertChime('good');
    }
  };

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    if (res === 'granted') {
      const updated = { ...settings, enabled: true };
      setSettings(updated);
      saveNotificationSettings(updated);
      onSettingsChanged(updated);
    }
  };

  const handleSendTestNotification = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      if (permission !== 'granted') {
        const res = await requestNotificationPermission();
        setPermission(res);
      }
      const outcome = await executeHourlyLocationCheck(true);
      setTestResult(outcome.message);
      setLogs(getNotificationLogs());
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Unknown error';
      setTestResult(`Test failed: ${errMsg}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleClearLogs = () => {
    clearNotificationLogs();
    setLogs([]);
  };

  const handleSaveWaqiToken = () => {
    if (waqiTokenInput.trim()) {
      localStorage.setItem('waqi_token', waqiTokenInput.trim());
    } else {
      localStorage.removeItem('waqi_token');
    }
    setTokenSaved(true);
    setTimeout(() => setTokenSaved(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] rounded-t-3xl sm:rounded-3xl liquid-glass-elevated shadow-2xl flex flex-col overflow-hidden border border-white/20 dark:border-white/10">
        {/* Modal Header */}
        <div className="px-6 py-4.5 border-b border-white/15 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-teal-500/15 text-teal-600 dark:text-teal-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                Hourly Location Notification Center
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Automated hourly background check calibrated to your GPS position
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

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 divide-y divide-white/10 dark:divide-white/5">
          {/* Permission Status Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl liquid-glass border border-white/20 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                permission === 'granted' 
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' 
                  : permission === 'denied'
                  ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}>
                {permission === 'granted' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Browser Permissions:</span>
                  <span className={`text-[10px] uppercase font-mono font-bold px-2 py-0.5 rounded-full ${
                    permission === 'granted' ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                  }`}>
                    {permission}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {permission === 'granted'
                    ? 'Active and ready to trigger hourly desktop alerts.'
                    : 'Permission required for hourly device alerts.'}
                </p>
              </div>
            </div>

            {permission !== 'granted' && (
              <button
                onClick={handleRequestPermission}
                className="px-4 py-2 rounded-full bg-teal-500 text-slate-950 font-bold text-xs transition shadow-md shadow-teal-500/20 m3-state-layer shrink-0"
              >
                Allow Notifications
              </button>
            )}
          </div>

          {/* Preferences */}
          <div className="pt-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Notification Preferences
            </h4>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-4 rounded-2xl liquid-glass border border-white/20 dark:border-white/10 shadow-sm">
              <div className="space-y-0.5">
                <span className="text-sm font-bold text-slate-900 dark:text-white block">
                  Hourly GPS Alerts
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Pings your location hourly and sends current air quality summary
                </span>
              </div>
              <button
                onClick={handleToggleEnabled}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  settings.enabled ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                    settings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Alert Frequency Mode */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                Trigger Frequency
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <button
                  onClick={() => handleUpdateFrequency('hourly')}
                  className={`p-3.5 rounded-2xl border text-left transition m3-state-layer ${
                    settings.frequency === 'hourly'
                      ? 'liquid-glass-elevated border-teal-500 text-teal-700 dark:text-teal-300 font-bold shadow-md'
                      : 'liquid-glass border-white/20 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="block font-black mb-0.5">Every Hour</span>
                  <span className="text-[11px] opacity-80 font-medium">Scheduled check every 60 min</span>
                </button>

                <button
                  onClick={() => handleUpdateFrequency('on_change')}
                  className={`p-3.5 rounded-2xl border text-left transition m3-state-layer ${
                    settings.frequency === 'on_change'
                      ? 'liquid-glass-elevated border-teal-500 text-teal-700 dark:text-teal-300 font-bold shadow-md'
                      : 'liquid-glass border-white/20 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="block font-black mb-0.5">Major Shifts</span>
                  <span className="text-[11px] opacity-80 font-medium">When AQI shifts &gt;15 pts</span>
                </button>

                <button
                  onClick={() => handleUpdateFrequency('severe_only')}
                  className={`p-3.5 rounded-2xl border text-left transition m3-state-layer ${
                    settings.frequency === 'severe_only'
                      ? 'liquid-glass-elevated border-teal-500 text-teal-700 dark:text-teal-300 font-bold shadow-md'
                      : 'liquid-glass border-white/20 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span className="block font-black mb-0.5">Pollution Spike</span>
                  <span className="text-[11px] opacity-80 font-medium">Only when AQI &gt; 100</span>
                </button>
              </div>
            </div>

            {/* Synthesized Chime Sound */}
            <div className="flex items-center justify-between p-4 rounded-2xl liquid-glass border border-white/20 dark:border-white/10 shadow-sm">
              <div className="flex items-center gap-3">
                {settings.sound ? (
                  <Volume2 className="w-5 h-5 text-teal-500" />
                ) : (
                  <VolumeX className="w-5 h-5 text-slate-400" />
                )}
                <div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white block">
                    Synthesized Chime Sound
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Plays audio chime alongside system alert
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => playAlertChime('good')}
                  title="Test Sound"
                  className="px-3 py-1.5 rounded-full liquid-glass hover:bg-white/40 dark:hover:bg-white/20 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition m3-state-layer"
                >
                  <Play className="w-3 h-3 text-teal-500" />
                  <span>Preview</span>
                </button>
                <button
                  onClick={handleToggleSound}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                    settings.sound ? 'bg-teal-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
                      settings.sound ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Immediate Test Trigger */}
            <div className="p-4 rounded-2xl liquid-glass-elevated border border-white/20 dark:border-white/10 space-y-3 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-sm font-extrabold text-slate-900 dark:text-white block">
                    Verify Hourly Alert Now
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Queries GPS location and delivers an immediate notification test
                  </span>
                </div>
                <button
                  onClick={handleSendTestNotification}
                  disabled={isTesting}
                  className="px-4 py-2.5 rounded-full bg-teal-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50 shadow-md shadow-teal-500/25 m3-state-layer shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isTesting ? 'Checking AQI...' : 'Send Test Alert'}</span>
                </button>
              </div>

              {testResult && (
                <div className="p-3 rounded-xl bg-teal-500/10 border border-teal-500/20 text-xs text-teal-700 dark:text-teal-300 font-mono font-medium">
                  {testResult}
                </div>
              )}
            </div>
          </div>

          {/* WAQI Token (Optional) */}
          <div className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-500" />
                Air Quality Open Data Platform (WAQI Token)
              </span>
              <span className="text-[11px] text-slate-400 font-mono">Optional</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              The platform connects automatically through Copernicus CAMS & WAQI public feeds. If you possess a personal API key from <a href="https://aqicn.org/api/" target="_blank" rel="noreferrer" className="text-teal-600 dark:text-teal-400 underline font-semibold">aqicn.org</a>, insert it below:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={waqiTokenInput}
                onChange={(e) => setWaqiTokenInput(e.target.value)}
                placeholder="e.g. your_waqi_api_token"
                className="flex-1 px-3.5 py-2 rounded-xl liquid-glass border border-white/20 dark:border-white/10 text-xs text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-teal-500/40"
              />
              <button
                onClick={handleSaveWaqiToken}
                className="px-4 py-2 rounded-xl liquid-glass hover:bg-white/40 dark:hover:bg-white/20 text-slate-800 dark:text-slate-200 text-xs font-bold transition m3-state-layer"
              >
                {tokenSaved ? 'Saved!' : 'Save Token'}
              </button>
            </div>
          </div>

          {/* Notification History */}
          <div className="pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Hourly Alerts History ({logs.length})
                </h4>
              </div>

              {logs.length > 0 && (
                <button
                  onClick={handleClearLogs}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-rose-500 transition font-medium"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {logs.length === 0 ? (
              <div className="p-6 rounded-2xl liquid-glass border border-white/20 dark:border-white/10 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                No notification alerts recorded yet. Scheduled updates will display here as they execute.
              </div>
            ) : (
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl liquid-glass border border-white/20 dark:border-white/10 flex items-start justify-between gap-3 text-xs shadow-sm"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 dark:text-white">{log.locationName}</span>
                        <span className="px-2 py-0.5 rounded-full font-mono font-bold text-[10px] bg-teal-500/20 text-teal-700 dark:text-teal-300">
                          AQI {log.aqi}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                          {log.timestamp}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed font-medium">
                        {log.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
