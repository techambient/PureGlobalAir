import { NotificationLog, NotificationSettings } from '../types/airQuality';
import { fetchAirQuality, reverseGeocode } from './airQualityService';

const SETTINGS_STORAGE_KEY = 'aura_notification_settings';
const LOGS_STORAGE_KEY = 'aura_notification_logs';

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  frequency: 'hourly',
  minAqiThreshold: 0, // notify on all hourly updates if frequency is 'hourly'
  sound: true
};

// Play an ambient clean alert chime synthesized with Web Audio API (no external file needed)
export function playAlertChime(severity: 'good' | 'moderate' | 'unhealthy' | 'hazard' = 'good') {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    gainNode.connect(ctx.destination);
    osc1.connect(gainNode);
    osc2.connect(gainNode);

    if (severity === 'hazard' || severity === 'unhealthy') {
      // Urgent double tone
      osc1.frequency.setValueAtTime(880, now); // A5
      osc1.frequency.exponentialRampToValueAtTime(587.33, now + 0.25); // D5
      osc2.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc2.frequency.exponentialRampToValueAtTime(440, now + 0.35); // A4
    } else {
      // Soft uplifting chime
      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      osc2.frequency.setValueAtTime(783.99, now + 0.15); // G5
      osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.3); // C6
    }

    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.linearRampToValueAtTime(0.2, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc1.start(now);
    osc2.start(now + 0.08);
    osc1.stop(now + 0.6);
    osc2.stop(now + 0.6);
  } catch (err) {
    console.warn('Audio chime could not be initialized:', err);
  }
}

export function getStoredNotificationSettings(): NotificationSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to read notification settings:', e);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
}

export function saveNotificationSettings(settings: NotificationSettings) {
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    window.dispatchEvent(new CustomEvent('aura-notification-settings-changed', { detail: settings }));
  } catch (e) {
    console.error('Failed to save notification settings:', e);
  }
}

export function getNotificationLogs(): NotificationLog[] {
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read notification logs:', e);
  }
  return [];
}

export function addNotificationLog(log: Omit<NotificationLog, 'id'>) {
  const newLog: NotificationLog = {
    ...log,
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  };
  const logs = [newLog, ...getNotificationLogs()].slice(0, 50); // keep last 50
  try {
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(logs));
    window.dispatchEvent(new CustomEvent('aura-notification-log-added', { detail: newLog }));
  } catch (e) {
    console.error('Failed to store log:', e);
  }
  return newLog;
}

export function clearNotificationLogs() {
  localStorage.removeItem(LOGS_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('aura-notification-log-added'));
}

// Check permission status
export function checkNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

// Request permission from browser
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch (err) {
    console.error('Permission request failed:', err);
    return 'denied';
  }
}

// Deliver a web notification
export async function sendAuraNotification(
  title: string,
  body: string,
  aqi: number,
  locationName: string,
  categoryLabel: string,
  type: 'hourly' | 'threshold' | 'test' | 'change' = 'hourly'
): Promise<boolean> {
  const settings = getStoredNotificationSettings();

  // Play audio chime if enabled
  if (settings.sound) {
    const severity = aqi > 200 ? 'hazard' : aqi > 100 ? 'unhealthy' : aqi > 50 ? 'moderate' : 'good';
    playAlertChime(severity);
  }

  // Record log item in history
  addNotificationLog({
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    locationName,
    aqi,
    categoryLabel,
    message: body,
    type
  });

  // Update last notified time
  saveNotificationSettings({
    ...settings,
    lastNotifiedAt: new Date().toISOString(),
    lastNotifiedAqi: aqi,
    lastNotifiedLocation: locationName
  });

  // If browser notifications supported and granted
  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
    try {
      const iconEmoji = aqi <= 50 ? '🟢' : aqi <= 100 ? '🟡' : aqi <= 150 ? '🟠' : aqi <= 200 ? '🔴' : '🟣';
      new Notification(`${iconEmoji} ${title}`, {
        body,
        badge: '/favicon.ico',
        tag: 'aura-air-hourly-alert',
        silent: !settings.sound
      });
      return true;
    } catch (e) {
      console.warn('Browser notification popup failed:', e);
    }
  }

  return false;
}

// Perform hourly location check & send notification
export async function executeHourlyLocationCheck(isManualTest = false): Promise<{ success: boolean; message: string; aqi?: number }> {
  const settings = getStoredNotificationSettings();
  if (!settings.enabled && !isManualTest) {
    return { success: false, message: 'Hourly notifications are disabled in settings' };
  }

  return new Promise((resolve) => {
    if (!('geolocation' in navigator)) {
      resolve({ success: false, message: 'Geolocation is not supported by your browser' });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;

          // 1. Resolve current city name
          const location = await reverseGeocode(lat, lon);

          // 2. Fetch latest live air quality
          const data = await fetchAirQuality(lat, lon, location);
          const currentAqi = data.current.aqi;
          const category = data.current.category;
          const dominant = data.current.dominantPollutant.name;

          // Check user threshold conditions
          if (!isManualTest) {
            if (settings.frequency === 'severe_only' && currentAqi <= 100) {
              resolve({ success: false, message: `AQI ${currentAqi} is below severe threshold (>100)` });
              return;
            }
            if (settings.frequency === 'on_change' && settings.lastNotifiedAqi !== undefined) {
              const diff = Math.abs(currentAqi - settings.lastNotifiedAqi);
              if (diff < 15) {
                resolve({ success: false, message: `AQI change (${diff} pts) is below sensitivity threshold` });
                return;
              }
            }
          }

          // Build notification message
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const title = `${location.name} Air Quality: AQI ${currentAqi} (${category.name})`;
          const body = `${timeStr} Update: ${category.description} Dominant: ${dominant}. ${category.generalAdvice}`;

          await sendAuraNotification(
            title,
            body,
            currentAqi,
            location.name,
            category.name,
            isManualTest ? 'test' : 'hourly'
          );

          resolve({ success: true, message: `Notification delivered for ${location.name} (AQI: ${currentAqi})`, aqi: currentAqi });
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : 'Unknown error';
          resolve({ success: false, message: `Air quality lookup failed: ${errMsg}` });
        }
      },
      (geoErr) => {
        resolve({ success: false, message: `Location permission denied or unavailable: ${geoErr.message}` });
      },
      { timeout: 15000, enableHighAccuracy: false }
    );
  });
}

// Master Scheduler: Sets up recurring hourly background checks
let hourlyTimerId: number | null = null;

export function startHourlyNotificationScheduler() {
  stopHourlyNotificationScheduler();

  const scheduleNextHour = () => {
    const now = new Date();
    // Milliseconds remaining until the next exact hour
    const msUntilNextHour = (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000 - now.getMilliseconds();
    
    // Set timer for the next hour mark
    hourlyTimerId = window.setTimeout(async () => {
      // Execute check
      await executeHourlyLocationCheck(false);
      // Then repeat on hourly loop
      scheduleNextHour();
    }, Math.max(10000, msUntilNextHour));
  };

  scheduleNextHour();
}

export function stopHourlyNotificationScheduler() {
  if (hourlyTimerId !== null) {
    clearTimeout(hourlyTimerId);
    hourlyTimerId = null;
  }
}
