export type AqiSeverity = 'good' | 'moderate' | 'unhealthy-sensitive' | 'unhealthy' | 'very-unhealthy' | 'hazardous';

export interface AqiCategoryInfo {
  level: AqiSeverity;
  range: [number, number];
  name: string;
  label: string;
  color: string;
  bgClass: string;
  borderClass: string;
  textClass: string;
  glowClass: string;
  badgeBg: string;
  description: string;
  generalAdvice: string;
  sensitiveAdvice: string;
}

export interface PollutantDetail {
  id: string;
  name: string;
  formula: string;
  value: number;
  unit: string;
  whoLimit: number; // WHO 24-hr guideline in µg/m³
  ratioToWho: number;
  status: 'good' | 'moderate' | 'high' | 'very-high';
  statusLabel: string;
  description: string;
}

export interface HourlyForecastPoint {
  timeISO: string;
  hourLabel: string; // e.g. "14:00" or "2 PM"
  dateLabel: string; // e.g. "Today" or "Tomorrow"
  hoursFromNow: number;
  aqi: number; // US EPA standard 0-500
  europeanAqi: number; // 0-100+
  category: AqiCategoryInfo;
  dominantPollutant: string;
  pm2_5: number;
  pm10: number;
  o3: number;
  no2: number;
  so2: number;
  co: number;
  dust: number;
  uvIndex: number;
  temperature?: number;
}

export interface AirLocation {
  name: string;
  adminRegion?: string;
  country: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  isCurrentLocation?: boolean;
}

export interface AirQualityData {
  location: AirLocation;
  fetchedAt: string;
  current: {
    aqi: number;
    europeanAqi: number;
    category: AqiCategoryInfo;
    dominantPollutant: {
      key: string;
      name: string;
      value: number;
      unit: string;
    };
    pollutants: {
      pm2_5: PollutantDetail;
      pm10: PollutantDetail;
      o3: PollutantDetail;
      no2: PollutantDetail;
      so2: PollutantDetail;
      co: PollutantDetail;
      dust: PollutantDetail;
      uvIndex: PollutantDetail;
    };
    weather?: {
      temperatureC: number;
      temperatureF: number;
      relativeHumidity: number;
      windSpeedKmh: number;
    };
    station?: {
      name: string;
      attribution: string;
      url?: string;
      coordinates: [number, number];
    };
  };
  forecast24h: HourlyForecastPoint[];
  forecastStats: {
    peakAqi: number;
    peakHour: string;
    lowestAqi: number;
    lowestHour: string;
    averageAqi: number;
    trend: 'improving' | 'stable' | 'deteriorating';
    trendSummary: string;
  };
  healthAdvisory: {
    outdoorActivities: { level: 'safe' | 'caution' | 'avoid'; text: string };
    sensitiveGroups: { level: 'safe' | 'caution' | 'avoid'; text: string };
    ventilation: { level: 'open' | 'limited' | 'closed'; text: string };
    maskProtection: { required: boolean; type: string; text: string };
    airPurifier: { needed: boolean; text: string };
  };
}

export interface NotificationSettings {
  enabled: boolean;
  frequency: 'hourly' | 'on_change' | 'severe_only';
  minAqiThreshold: number; // e.g., 50 or 100
  sound: boolean;
  lastNotifiedAt?: string;
  lastNotifiedAqi?: number;
  lastNotifiedLocation?: string;
}

export interface NotificationLog {
  id: string;
  timestamp: string;
  locationName: string;
  aqi: number;
  categoryLabel: string;
  message: string;
  type: 'hourly' | 'threshold' | 'test' | 'change';
}

export interface CitySearchResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  country_code?: string;
  admin1?: string;
  timezone?: string;
  population?: number;
}

export type ThemeMode = 'system' | 'dark' | 'light';

export type MobileNavTab = 'dashboard' | 'forecast' | 'pollutants' | 'health' | 'map';
