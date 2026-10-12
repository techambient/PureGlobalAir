import { AqiCategoryInfo, AqiSeverity } from '../types/airQuality';

export const AQI_CATEGORIES: Record<AqiSeverity, AqiCategoryInfo> = {
  good: {
    level: 'good',
    range: [0, 50],
    name: 'Good',
    label: 'Good Air Quality',
    color: '#10B981', // emerald-500
    bgClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    borderClass: 'border-emerald-500',
    textClass: 'text-emerald-400',
    glowClass: 'shadow-emerald-500/20',
    badgeBg: 'bg-emerald-500/20 text-emerald-300',
    description: 'Air quality is considered satisfactory, and air pollution poses little or no risk.',
    generalAdvice: 'Great day for outdoor activities, sports, and opening windows for natural fresh air ventilation.',
    sensitiveAdvice: 'No health impacts expected for sensitive individuals.'
  },
  moderate: {
    level: 'moderate',
    range: [51, 100],
    name: 'Moderate',
    label: 'Moderate Air Quality',
    color: '#F59E0B', // amber-500
    bgClass: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    borderClass: 'border-amber-500',
    textClass: 'text-amber-400',
    glowClass: 'shadow-amber-500/20',
    badgeBg: 'bg-amber-500/20 text-amber-300',
    description: 'Air quality is acceptable; however, some pollutants may cause moderate health concern for a very small number of unusually sensitive people.',
    generalAdvice: 'Air is acceptable for most people. Outdoor sports and normal activities are fine.',
    sensitiveAdvice: 'Unusually sensitive individuals should consider reducing prolonged or heavy outdoor exertion.'
  },
  'unhealthy-sensitive': {
    level: 'unhealthy-sensitive',
    range: [101, 150],
    name: 'Unhealthy for Sensitive Groups',
    label: 'Sensitive Groups Risk',
    color: '#F97316', // orange-500
    bgClass: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
    borderClass: 'border-orange-500',
    textClass: 'text-orange-400',
    glowClass: 'shadow-orange-500/20',
    badgeBg: 'bg-orange-500/20 text-orange-300',
    description: 'Members of sensitive groups may experience health effects. The general public is less likely to be affected.',
    generalAdvice: 'General public can still engage in outdoor activities, but take breaks if feeling irritation.',
    sensitiveAdvice: 'People with respiratory or heart disease, elderly, and children should reduce prolonged outdoor exertion.'
  },
  unhealthy: {
    level: 'unhealthy',
    range: [151, 200],
    name: 'Unhealthy',
    label: 'Unhealthy Air',
    color: '#EF4444', // red-500
    bgClass: 'bg-red-500/10 text-red-400 border-red-500/30',
    borderClass: 'border-red-500',
    textClass: 'text-red-400',
    glowClass: 'shadow-red-500/20',
    badgeBg: 'bg-red-500/20 text-red-300',
    description: 'Everyone may begin to experience health effects; members of sensitive groups may experience more serious health effects.',
    generalAdvice: 'Everyone should reduce heavy outdoor exertion. Keep indoor windows closed and run air filtration.',
    sensitiveAdvice: 'Sensitive individuals should avoid outdoor exertion and wear N95/FFP2 masks outdoors.'
  },
  'very-unhealthy': {
    level: 'very-unhealthy',
    range: [201, 300],
    name: 'Very Unhealthy',
    label: 'Very Unhealthy (Alert)',
    color: '#8B5CF6', // purple-500
    bgClass: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
    borderClass: 'border-purple-500',
    textClass: 'text-purple-400',
    glowClass: 'shadow-purple-500/20',
    badgeBg: 'bg-purple-500/20 text-purple-300',
    description: 'Health alert: The risk of health effects is increased for everyone in the area.',
    generalAdvice: 'Avoid outdoor activities. Keep doors and windows tightly shut. Run HEPA air purifiers indoors.',
    sensitiveAdvice: 'Remain indoors and keep activity levels low. Wear certified high-filtration respirators if going out.'
  },
  hazardous: {
    level: 'hazardous',
    range: [301, 500],
    name: 'Hazardous',
    label: 'Hazardous Emergency',
    color: '#991B1B', // red-800 / maroon
    bgClass: 'bg-red-900/20 text-red-300 border-red-700/40',
    borderClass: 'border-red-700',
    textClass: 'text-red-400',
    glowClass: 'shadow-red-900/40',
    badgeBg: 'bg-red-900/40 text-red-200',
    description: 'Health warning of emergency conditions: Everyone is more likely to be severely affected.',
    generalAdvice: 'Serious emergency conditions. Everyone should remain indoors with air filtration activated.',
    sensitiveAdvice: 'Strictly avoid all physical outdoor exertion. Seek medical advice if breathing difficulties arise.'
  }
};

export function getAqiCategory(aqi: number): AqiCategoryInfo {
  const rounded = Math.round(aqi);
  if (rounded <= 50) return AQI_CATEGORIES['good'];
  if (rounded <= 100) return AQI_CATEGORIES['moderate'];
  if (rounded <= 150) return AQI_CATEGORIES['unhealthy-sensitive'];
  if (rounded <= 200) return AQI_CATEGORIES['unhealthy'];
  if (rounded <= 300) return AQI_CATEGORIES['very-unhealthy'];
  return AQI_CATEGORIES['hazardous'];
}

// US EPA calculation piecewise linear interpolation for PM2.5 (ug/m3 -> AQI)
export function calculatePm25Aqi(pm25: number): number {
  if (pm25 < 0) return 0;
  const c = Math.round(pm25 * 10) / 10;
  if (c <= 12.0) return calcLinear(0, 50, 0, 12.0, c);
  if (c <= 35.4) return calcLinear(51, 100, 12.1, 35.4, c);
  if (c <= 55.4) return calcLinear(101, 150, 35.5, 55.4, c);
  if (c <= 150.4) return calcLinear(151, 200, 55.5, 150.4, c);
  if (c <= 250.4) return calcLinear(201, 300, 150.5, 250.4, c);
  if (c <= 350.4) return calcLinear(301, 400, 250.5, 350.4, c);
  if (c <= 500.4) return calcLinear(401, 500, 350.5, 500.4, c);
  return 500;
}

// US EPA calculation piecewise linear interpolation for PM10 (ug/m3 -> AQI)
export function calculatePm10Aqi(pm10: number): number {
  if (pm10 < 0) return 0;
  const c = Math.round(pm10);
  if (c <= 54) return calcLinear(0, 50, 0, 54, c);
  if (c <= 154) return calcLinear(51, 100, 55, 154, c);
  if (c <= 254) return calcLinear(101, 150, 155, 254, c);
  if (c <= 354) return calcLinear(151, 200, 255, 354, c);
  if (c <= 424) return calcLinear(201, 300, 355, 424, c);
  if (c <= 504) return calcLinear(301, 400, 425, 504, c);
  if (c <= 604) return calcLinear(401, 500, 505, 604, c);
  return 500;
}

// US EPA calculation piecewise linear interpolation for Ozone (ug/m3 to approx ppm -> AQI)
export function calculateOzoneAqi(o3UgM3: number): number {
  // 1 ppb O3 ≈ 2.0 ug/m3. 8-hour ozone breakpoints in ppb:
  const ppb = (o3UgM3 / 2.0);
  if (ppb <= 54) return calcLinear(0, 50, 0, 54, ppb);
  if (ppb <= 70) return calcLinear(51, 100, 55, 70, ppb);
  if (ppb <= 85) return calcLinear(101, 150, 71, 85, ppb);
  if (ppb <= 105) return calcLinear(151, 200, 86, 105, ppb);
  if (ppb <= 200) return calcLinear(201, 300, 106, 200, ppb);
  return calcLinear(301, 500, 201, 400, Math.min(ppb, 400));
}

// US EPA calculation piecewise linear interpolation for NO2 (ug/m3 -> ppb -> AQI)
export function calculateNo2Aqi(no2UgM3: number): number {
  // 1 ppb NO2 ≈ 1.88 ug/m3
  const ppb = no2UgM3 / 1.88;
  if (ppb <= 53) return calcLinear(0, 50, 0, 53, ppb);
  if (ppb <= 100) return calcLinear(51, 100, 54, 100, ppb);
  if (ppb <= 360) return calcLinear(101, 150, 101, 360, ppb);
  if (ppb <= 649) return calcLinear(151, 200, 361, 649, ppb);
  if (ppb <= 1249) return calcLinear(201, 300, 650, 1249, ppb);
  return calcLinear(301, 500, 1250, 2049, Math.min(ppb, 2049));
}

function calcLinear(iLow: number, iHigh: number, cLow: number, cHigh: number, c: number): number {
  return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (c - cLow) + iLow);
}

// WHO 24-hour guidelines (ug/m3):
// PM2.5: 15 ug/m3
// PM10: 45 ug/m3
// O3: 100 ug/m3 (8-hour)
// NO2: 25 ug/m3
// SO2: 40 ug/m3
// CO: 4000 ug/m3 (approx 4 mg/m3)
export const WHO_LIMITS = {
  pm2_5: 15,
  pm10: 45,
  o3: 100,
  no2: 25,
  so2: 40,
  co: 4000,
  dust: 50,
  uvIndex: 5
};

export function getPollutantStatus(value: number, whoLimit: number): {
  ratio: number;
  status: 'good' | 'moderate' | 'high' | 'very-high';
  statusLabel: string;
} {
  const ratio = Math.round((value / whoLimit) * 10) / 10;
  if (ratio <= 1.0) {
    return { ratio, status: 'good', statusLabel: 'Within WHO limit' };
  } else if (ratio <= 2.0) {
    return { ratio, status: 'moderate', statusLabel: `${ratio}× WHO limit` };
  } else if (ratio <= 4.0) {
    return { ratio, status: 'high', statusLabel: `${ratio}× WHO limit` };
  } else {
    return { ratio, status: 'very-high', statusLabel: `${ratio}× WHO limit` };
  }
}
