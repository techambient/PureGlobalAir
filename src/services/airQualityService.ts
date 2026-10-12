import {
  AirLocation,
  AirQualityData,
  CitySearchResult,
  HourlyForecastPoint,
  PollutantDetail
} from '../types/airQuality';
import {
  calculateNo2Aqi,
  calculateOzoneAqi,
  calculatePm10Aqi,
  calculatePm25Aqi,
  getAqiCategory,
  getPollutantStatus,
  WHO_LIMITS
} from '../utils/aqiCalculations';

export const POPULAR_CITIES: AirLocation[] = [
  { name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
  { name: 'New York', adminRegion: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },
  { name: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522, timezone: 'Europe/Paris' },
  { name: 'New Delhi', adminRegion: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.2090, timezone: 'Asia/Kolkata' },
  { name: 'Beijing', country: 'China', latitude: 39.9042, longitude: 116.4074, timezone: 'Asia/Shanghai' },
  { name: 'Los Angeles', adminRegion: 'California', country: 'United States', latitude: 34.0522, longitude: -118.2437, timezone: 'America/Los_Angeles' },
  { name: 'Sydney', adminRegion: 'New South Wales', country: 'Australia', latitude: -33.8688, longitude: 151.2093, timezone: 'Australia/Sydney' },
  { name: 'Dubai', country: 'United Arab Emirates', latitude: 25.2048, longitude: 55.2708, timezone: 'Asia/Dubai' },
  { name: 'Singapore', country: 'Singapore', latitude: 1.3521, longitude: 103.8198, timezone: 'Asia/Singapore' },
  { name: 'São Paulo', country: 'Brazil', latitude: -23.5505, longitude: -46.6333, timezone: 'America/Sao_Paulo' },
  { name: 'Cairo', country: 'Egypt', latitude: 30.0444, longitude: 31.2357, timezone: 'Africa/Cairo' },
];

export async function searchCities(query: string): Promise<CitySearchResult[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(trimmed)}&count=10&language=en&format=json`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Geocoding failed: ${res.status}`);
    const data = await res.json();
    return (data.results || []) as CitySearchResult[];
  } catch (err) {
    console.error('Error searching cities:', err);
    return [];
  }
}

export async function reverseGeocode(latitude: number, longitude: number): Promise<AirLocation> {
  try {
    // Attempt reverse geocoding via OpenStreetMap Nominatim or Open-Meteo elevation/geo
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`,
      { headers: { 'Accept-Language': 'en' } }
    );
    if (res.ok) {
      const data = await res.json();
      const addr = data.address || {};
      const cityName = addr.city || addr.town || addr.village || addr.suburb || addr.municipality || 'Current Location';
      const country = addr.country || 'Detected Region';
      const state = addr.state || addr.province || addr.county || '';
      return {
        name: cityName,
        adminRegion: state,
        country: country,
        latitude,
        longitude,
        isCurrentLocation: true
      };
    }
  } catch {
    // ignore and fallback
  }

  return {
    name: `Coordinates (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`,
    country: 'Current Location',
    latitude,
    longitude,
    isCurrentLocation: true
  };
}

export async function fetchAirQuality(
  latitude: number,
  longitude: number,
  locationMeta?: Partial<AirLocation>,
  waqiToken?: string
): Promise<AirQualityData> {
  const [aqResponse, weatherResponse, waqiData] = await Promise.all([
    // 1. Open-Meteo Air Quality Copernicus CAMS + NOAA global model
    fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,european_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,uv_index&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,dust,uv_index,us_aqi,european_aqi&timezone=auto&forecast_days=3`
    ).then(r => r.ok ? r.json() : null).catch(() => null),

    // 2. Open-Meteo Current Weather
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`
    ).then(r => r.ok ? r.json() : null).catch(() => null),

    // 3. WAQI (World Air Quality Index project - Air Quality Open Data Platform) station feed
    fetchWaqiStation(latitude, longitude, waqiToken)
  ]);

  if (!aqResponse || !aqResponse.hourly) {
    throw new Error('Unable to retrieve air quality data from the Open Data Platform. Please verify your connection.');
  }

  const { current, hourly, timezone } = aqResponse;

  // Extract raw pollutant values
  const pm2_5_val = current?.pm2_5 ?? 12;
  const pm10_val = current?.pm10 ?? 24;
  const o3_val = current?.ozone ?? 45;
  const no2_val = current?.nitrogen_dioxide ?? 15;
  const so2_val = current?.sulphur_dioxide ?? 5;
  const co_val = current?.carbon_monoxide ?? 250;
  const dust_val = current?.dust ?? 10;
  const uv_val = current?.uv_index ?? 2;

  // Calculate pollutant sub-indices
  const pm25SubAqi = calculatePm25Aqi(pm2_5_val);
  const pm10SubAqi = calculatePm10Aqi(pm10_val);
  const o3SubAqi = calculateOzoneAqi(o3_val);
  const no2SubAqi = calculateNo2Aqi(no2_val);

  // Derive dominant pollutant
  const subIndices = [
    { key: 'pm2_5', name: 'PM2.5 (Fine Particles)', aqi: pm25SubAqi, val: pm2_5_val, unit: 'µg/m³' },
    { key: 'pm10', name: 'PM10 (Respirable Dust)', aqi: pm10SubAqi, val: pm10_val, unit: 'µg/m³' },
    { key: 'o3', name: 'Ozone (O₃)', aqi: o3SubAqi, val: o3_val, unit: 'µg/m³' },
    { key: 'no2', name: 'Nitrogen Dioxide (NO₂)', aqi: no2SubAqi, val: no2_val, unit: 'µg/m³' },
  ];
  subIndices.sort((a, b) => b.aqi - a.aqi);
  const dominant = subIndices[0];

  // Base AQI determination (prioritizes WAQI ground station if valid, or max subindex/model)
  let overallUsAqi = current?.us_aqi;
  if (!overallUsAqi || overallUsAqi === 0) {
    overallUsAqi = dominant.aqi;
  }
  // If WAQI official ground station provides a valid real-time reading, cross-reference
  if (waqiData?.stationAqi && waqiData.stationAqi > 0) {
    overallUsAqi = waqiData.stationAqi;
  }

  const europeanAqi = current?.european_aqi ?? Math.round(overallUsAqi * 0.45);
  const category = getAqiCategory(overallUsAqi);

  const makePollutant = (
    id: string,
    name: string,
    formula: string,
    value: number,
    unit: string,
    whoLimit: number,
    description: string
  ): PollutantDetail => {
    const statusInfo = getPollutantStatus(value, whoLimit);
    return {
      id,
      name,
      formula,
      value: Math.round(value * 10) / 10,
      unit,
      whoLimit,
      ratioToWho: statusInfo.ratio,
      status: statusInfo.status,
      statusLabel: statusInfo.statusLabel,
      description
    };
  };

  const pollutants = {
    pm2_5: makePollutant('pm2_5', 'Fine Particles', 'PM2.5', pm2_5_val, 'µg/m³', WHO_LIMITS.pm2_5, 'Particles ≤ 2.5 micrometers. Can penetrate deep into lungs and bloodstream.'),
    pm10: makePollutant('pm10', 'Inhalable Dust', 'PM10', pm10_val, 'µg/m³', WHO_LIMITS.pm10, 'Particles ≤ 10 micrometers. Originates from roads, dust storms, and construction.'),
    o3: makePollutant('o3', 'Ground-Level Ozone', 'O₃', o3_val, 'µg/m³', WHO_LIMITS.o3, 'Created by chemical reactions between oxides of nitrogen and VOCs in sunlight.'),
    no2: makePollutant('no2', 'Nitrogen Dioxide', 'NO₂', no2_val, 'µg/m³', WHO_LIMITS.no2, 'Primarily released from vehicle exhaust, power plants, and industrial boilers.'),
    so2: makePollutant('so2', 'Sulfur Dioxide', 'SO₂', so2_val, 'µg/m³', WHO_LIMITS.so2, 'Gas released from fossil fuel combustion and industrial mineral smelting.'),
    co: makePollutant('co', 'Carbon Monoxide', 'CO', co_val, 'µg/m³', WHO_LIMITS.co, 'Colorless, odorless gas resulting from incomplete combustion of carbonaceous fuels.'),
    dust: makePollutant('dust', 'Atmospheric Dust', 'Dust', dust_val, 'µg/m³', WHO_LIMITS.dust, 'Airborne desert dust and mineral particulate matter in the atmosphere.'),
    uvIndex: makePollutant('uvIndex', 'UV Radiation', 'UV', uv_val, 'Index', WHO_LIMITS.uvIndex, 'Ultraviolet radiation intensity index from the sun.')
  };

  // Build the 24-HOUR REAL FORECAST starting from current time
  const times: string[] = hourly.time || [];
  const usAqis: number[] = hourly.us_aqi || [];
  const euAqis: number[] = hourly.european_aqi || [];
  const pm25Arr: number[] = hourly.pm2_5 || [];
  const pm10Arr: number[] = hourly.pm10 || [];
  const o3Arr: number[] = hourly.ozone || [];
  const no2Arr: number[] = hourly.nitrogen_dioxide || [];
  const so2Arr: number[] = hourly.sulphur_dioxide || [];
  const coArr: number[] = hourly.carbon_monoxide || [];
  const dustArr: number[] = hourly.dust || [];
  const uvArr: number[] = hourly.uv_index || [];

  // Find index corresponding to current hour
  const now = new Date();
  let startIndex = 0;
  let minDiff = Infinity;

  for (let i = 0; i < times.length; i++) {
    const pointTime = new Date(times[i]).getTime();
    const diff = Math.abs(pointTime - now.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      startIndex = i;
    }
  }

  // Slice next 24 consecutive real forecast hours
  const forecast24h: HourlyForecastPoint[] = [];
  const maxForecastPoints = 24;

  for (let i = 0; i < maxForecastPoints; i++) {
    const idx = startIndex + i;
    if (idx >= times.length) break;

    const rawTime = times[idx];
    const dateObj = new Date(rawTime);
    const hourNum = dateObj.getHours();
    const hourLabel = `${hourNum.toString().padStart(2, '0')}:00`;
    
    // Determine relative date label
    const isToday = dateObj.getDate() === now.getDate();
    const dateLabel = isToday ? 'Today' : 'Tomorrow';

    const pPm25 = pm25Arr[idx] ?? 10;
    const pPm10 = pm10Arr[idx] ?? 20;
    const pO3 = o3Arr[idx] ?? 40;
    const pNo2 = no2Arr[idx] ?? 15;
    const pSo2 = so2Arr[idx] ?? 4;
    const pCo = coArr[idx] ?? 200;
    const pDust = dustArr[idx] ?? 8;
    const pUv = uvArr[idx] ?? 0;

    let hUsAqi = usAqis[idx];
    if (!hUsAqi || hUsAqi === 0) {
      // Calculate from components
      hUsAqi = Math.max(
        calculatePm25Aqi(pPm25),
        calculatePm10Aqi(pPm10),
        calculateOzoneAqi(pO3),
        calculateNo2Aqi(pNo2)
      );
    }

    const hEuAqi = euAqis[idx] ?? Math.round(hUsAqi * 0.45);
    const hCategory = getAqiCategory(hUsAqi);

    // Dominant pollutant this hour
    const hourSubIndices = [
      { name: 'PM2.5', aqi: calculatePm25Aqi(pPm25) },
      { name: 'PM10', aqi: calculatePm10Aqi(pPm10) },
      { name: 'Ozone', aqi: calculateOzoneAqi(pO3) },
      { name: 'NO2', aqi: calculateNo2Aqi(pNo2) },
    ].sort((a, b) => b.aqi - a.aqi);

    forecast24h.push({
      timeISO: rawTime,
      hourLabel,
      dateLabel,
      hoursFromNow: i,
      aqi: hUsAqi,
      europeanAqi: hEuAqi,
      category: hCategory,
      dominantPollutant: hourSubIndices[0].name,
      pm2_5: Math.round(pPm25 * 10) / 10,
      pm10: Math.round(pPm10 * 10) / 10,
      o3: Math.round(pO3 * 10) / 10,
      no2: Math.round(pNo2 * 10) / 10,
      so2: Math.round(pSo2 * 10) / 10,
      co: Math.round(pCo),
      dust: Math.round(pDust * 10) / 10,
      uvIndex: Math.round(pUv * 10) / 10,
    });
  }

  // Calculate 24h stats
  let peakAqi = 0;
  let peakHour = '';
  let lowestAqi = Infinity;
  let lowestHour = '';
  let sumAqi = 0;

  forecast24h.forEach(pt => {
    sumAqi += pt.aqi;
    if (pt.aqi > peakAqi) {
      peakAqi = pt.aqi;
      peakHour = `${pt.dateLabel} ${pt.hourLabel}`;
    }
    if (pt.aqi < lowestAqi) {
      lowestAqi = pt.aqi;
      lowestHour = `${pt.dateLabel} ${pt.hourLabel}`;
    }
  });

  const averageAqi = Math.round(sumAqi / (forecast24h.length || 1));
  const first6hAvg = forecast24h.slice(0, 6).reduce((a, b) => a + b.aqi, 0) / Math.max(1, Math.min(6, forecast24h.length));
  const last6hAvg = forecast24h.slice(-6).reduce((a, b) => a + b.aqi, 0) / Math.max(1, Math.min(6, forecast24h.length));

  let trend: 'improving' | 'stable' | 'deteriorating' = 'stable';
  let trendSummary = 'Air quality expected to remain relatively stable over the next 24 hours.';
  if (last6hAvg - first6hAvg < -10) {
    trend = 'improving';
    trendSummary = `Air quality will improve over the next 24 hours, dropping down towards AQI ${lowestAqi}.`;
  } else if (last6hAvg - first6hAvg > 10) {
    trend = 'deteriorating';
    trendSummary = `Pollution levels are projected to rise over the next 24 hours, peaking at AQI ${peakAqi}.`;
  }

  // Construct Health Advisory
  const healthAdvisory = generateHealthAdvisory(overallUsAqi);

  const weather = weatherResponse?.current ? {
    temperatureC: Math.round(weatherResponse.current.temperature_2m * 10) / 10,
    temperatureF: Math.round((weatherResponse.current.temperature_2m * 9/5 + 32) * 10) / 10,
    relativeHumidity: Math.round(weatherResponse.current.relative_humidity_2m),
    windSpeedKmh: Math.round(weatherResponse.current.wind_speed_10m * 10) / 10
  } : undefined;

  const station = waqiData ? {
    name: waqiData.stationName,
    attribution: waqiData.attribution,
    url: waqiData.url,
    coordinates: [latitude, longitude] as [number, number]
  } : {
    name: `${locationMeta?.name || 'Local'} Atmospheric Monitoring Node`,
    attribution: 'Air Quality Open Data Platform & Copernicus CAMS',
    coordinates: [latitude, longitude] as [number, number]
  };

  return {
    location: {
      name: locationMeta?.name || 'Detected City',
      adminRegion: locationMeta?.adminRegion,
      country: locationMeta?.country || 'Region',
      countryCode: locationMeta?.countryCode,
      latitude,
      longitude,
      timezone: timezone || locationMeta?.timezone,
      isCurrentLocation: locationMeta?.isCurrentLocation
    },
    fetchedAt: new Date().toISOString(),
    current: {
      aqi: overallUsAqi,
      europeanAqi,
      category,
      dominantPollutant: {
        key: dominant.key,
        name: dominant.name,
        value: dominant.val,
        unit: dominant.unit
      },
      pollutants,
      weather,
      station
    },
    forecast24h,
    forecastStats: {
      peakAqi,
      peakHour,
      lowestAqi: lowestAqi === Infinity ? overallUsAqi : lowestAqi,
      lowestHour: lowestHour || 'Current Hour',
      averageAqi,
      trend,
      trendSummary
    },
    healthAdvisory
  };
}

// Fetch from WAQI (World Air Quality Index project - Air Quality Open Data Platform)
async function fetchWaqiStation(latitude: number, longitude: number, token?: string) {
  try {
    const apiToken = token || localStorage.getItem('waqi_token') || 'demo';
    const res = await fetch(`https://api.waqi.info/feed/geo:${latitude};${longitude}/?token=${apiToken}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.status === 'ok' && data.data) {
      const d = data.data;
      return {
        stationAqi: typeof d.aqi === 'number' ? d.aqi : undefined,
        stationName: d.city?.name || 'Local Monitoring Station',
        attribution: d.attributions?.[0]?.name || 'Air Quality Open Data Platform (WAQI)',
        url: d.city?.url || 'https://aqicn.org/'
      };
    }
  } catch {
    // WAQI rate limit or demo token constraint, smoothly fallback to Copernicus
  }
  return null;
}

function generateHealthAdvisory(aqi: number) {
  if (aqi <= 50) {
    return {
      outdoorActivities: {
        level: 'safe' as const,
        text: 'Air quality is pristine. Perfect for jogging, outdoor sports, cycling, and children playground activities.'
      },
      sensitiveGroups: {
        level: 'safe' as const,
        text: 'No health impacts expected for people with asthma, heart conditions, or elderly citizens.'
      },
      ventilation: {
        level: 'open' as const,
        text: 'Open windows freely to circulate fresh clean air throughout home and office.'
      },
      maskProtection: {
        required: false,
        type: 'None needed',
        text: 'No particulate mask needed outdoors.'
      },
      airPurifier: {
        needed: false,
        text: 'Natural outdoor air quality is sufficient. HEPA filtration optional.'
      }
    };
  } else if (aqi <= 100) {
    return {
      outdoorActivities: {
        level: 'safe' as const,
        text: 'Safe for general outdoor exercise and activities.'
      },
      sensitiveGroups: {
        level: 'caution' as const,
        text: 'Unusually sensitive individuals should monitor respiratory symptoms during prolonged vigorous exercise.'
      },
      ventilation: {
        level: 'open' as const,
        text: 'Safe to open windows for ventilation during morning or breezy hours.'
      },
      maskProtection: {
        required: false,
        type: 'Optional',
        text: 'Not required for healthy population. Sensitive individuals may use masks in heavy traffic zones.'
      },
      airPurifier: {
        needed: false,
        text: 'Recommended on low or auto speed if living near high-traffic roads.'
      }
    };
  } else if (aqi <= 150) {
    return {
      outdoorActivities: {
        level: 'caution' as const,
        text: 'Cut back on strenuous outdoor exercise. Take more breaks if doing physical work outdoors.'
      },
      sensitiveGroups: {
        level: 'avoid' as const,
        text: 'Children, elderly, and individuals with respiratory conditions (asthma/COPD) should minimize outdoor exertion.'
      },
      ventilation: {
        level: 'limited' as const,
        text: 'Keep windows closed during peak traffic hours; ventilate briefly when wind improves.'
      },
      maskProtection: {
        required: true,
        type: 'KN95 / FFP2 recommended',
        text: 'Sensitive individuals should wear certified particulate respirators when outdoors.'
      },
      airPurifier: {
        needed: true,
        text: 'Turn on indoor HEPA air filtration in bedrooms and living rooms.'
      }
    };
  } else if (aqi <= 200) {
    return {
      outdoorActivities: {
        level: 'avoid' as const,
        text: 'Everyone should avoid prolonged or heavy exertion outdoors. Postpone outdoor marathons or sports games.'
      },
      sensitiveGroups: {
        level: 'avoid' as const,
        text: 'Sensitive groups should remain indoors and keep physical exertion to a minimum.'
      },
      ventilation: {
        level: 'closed' as const,
        text: 'Keep all windows and exterior doors closed to block particulate infiltration.'
      },
      maskProtection: {
        required: true,
        type: 'N95 / KN95 / FFP2 mandatory',
        text: 'Wear a well-fitted N95 or KN95 particulate respirator when stepping outside.'
      },
      airPurifier: {
        needed: true,
        text: 'Run HEPA air purifiers at medium-to-high speed. Seal drafts around windows.'
      }
    };
  } else if (aqi <= 300) {
    return {
      outdoorActivities: {
        level: 'avoid' as const,
        text: 'Health alert: Everyone must strictly avoid outdoor physical exertion. Stay indoors.'
      },
      sensitiveGroups: {
        level: 'avoid' as const,
        text: 'High health risk. Remain strictly indoors. Keep medication (such as asthma inhalers) readily accessible.'
      },
      ventilation: {
        level: 'closed' as const,
        text: 'Keep all windows sealed tightly. Run air conditioning on recirculate mode.'
      },
      maskProtection: {
        required: true,
        type: 'N95 / N99 / FFP3 respirator',
        text: 'Essential for all individuals going outside even for brief periods.'
      },
      airPurifier: {
        needed: true,
        text: 'Continuously run HEPA purifiers in closed rooms. Consider creating a clean room sanctuary.'
      }
    };
  } else {
    return {
      outdoorActivities: {
        level: 'avoid' as const,
        text: 'Emergency conditions: Hazardous pollution. Complete outdoor activity ban recommended.'
      },
      sensitiveGroups: {
        level: 'avoid' as const,
        text: 'Critical danger. Remain in sealed indoor sanctuary with air filtration. Consult medical professionals if unwell.'
      },
      ventilation: {
        level: 'closed' as const,
        text: 'Do not open windows. Seal cracks under doors with damp towels if smoke or dust enters.'
      },
      maskProtection: {
        required: true,
        type: 'N95+ or P100 respirator',
        text: 'High-grade sealed respirator mandatory for any outdoor exposure.'
      },
      airPurifier: {
        needed: true,
        text: 'Run all indoor HEPA units on maximum boost mode.'
      }
    };
  }
}
