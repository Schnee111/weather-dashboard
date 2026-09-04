import { WeatherCondition } from '../types/weather';

export function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index] || 'N';
}

export function parseWMOCode(code: number, isDay: boolean): WeatherCondition {
  // WMO Weather interpretation codes (WW)
  // 0: Clear sky
  // 1, 2, 3: Mainly clear, partly cloudy, and overcast
  // 45, 48: Fog and depositing rime fog
  // 51, 53, 55: Drizzle: Light, moderate, and dense intensity
  // 61, 63, 65: Rain: Slight, moderate and heavy intensity
  // 71, 73, 75: Snow fall: Slight, moderate, and heavy intensity
  // 77: Snow grains
  // 80, 81, 82: Rain showers: Slight, moderate, and violent
  // 85, 86: Snow showers slight and heavy
  // 95: Thunderstorm: Slight or moderate
  // 96, 99: Thunderstorm with slight and heavy hail

  const timeSuffix = isDay ? 'day' : 'night';

  if (code === 0) {
    return {
      label: 'Clear Sky',
      headline: isDay ? 'Clear & Sunny Skies' : 'Clear Starry Night',
      narrativeAdvisory: isDay
        ? 'High atmospheric clarity with bright direct sunshine. Mild winds from the west. Optimal visibility.'
        : 'Crisp calm nocturnal conditions under open cosmic skies. Low ambient humidity and light breeze.',
      iconName: isDay ? 'Sun' : 'Moon',
      bgAssetId: `clear_sky_${timeSuffix}`,
    };
  }

  if (code === 1 || code === 2) {
    return {
      label: 'Partly Cloudy',
      headline: 'Scattered Cloud Layers',
      narrativeAdvisory: 'Variable clouds with periods of filtered sunlight. Stable barometric pressure and gentle air currents.',
      iconName: isDay ? 'CloudSun' : 'CloudMoon',
      bgAssetId: `partly_cloudy_${timeSuffix}`,
    };
  }

  if (code === 3) {
    return {
      label: 'Overcast',
      headline: 'Thick Cloud Canopy',
      narrativeAdvisory: 'Dense stratus layer obscuring direct sunlight. Uniform barometric envelope with mild thermal insulation.',
      iconName: 'Cloud',
      bgAssetId: `cloudy_overcast_${timeSuffix}`,
    };
  }

  if (code === 45 || code === 48) {
    return {
      label: 'Fog / Mist',
      headline: 'Atmospheric Dense Fog',
      narrativeAdvisory: 'Significant reduction in horizontal visibility below 1000m. High surface relative saturation and damp air.',
      iconName: 'CloudFog',
      bgAssetId: `fog_mist_${timeSuffix}`,
    };
  }

  if (code >= 51 && code <= 55) {
    return {
      label: 'Light Drizzle',
      headline: 'Intermittent Light Drizzle',
      narrativeAdvisory: 'Fine atmospheric precipitation droplets with negligible surface accumulation. Soft persistent mist.',
      iconName: 'CloudDrizzle',
      bgAssetId: `rain_moderate_${timeSuffix}`,
    };
  }

  if (code >= 61 && code <= 65 || (code >= 80 && code <= 82)) {
    const isHeavy = code === 65 || code === 82;
    return {
      label: isHeavy ? 'Heavy Rain' : 'Moderate Rain',
      headline: isHeavy ? 'Storm with Heavy Rain' : 'Steady Rain Showers',
      narrativeAdvisory: isHeavy
        ? 'Heavy frontal precipitation with rapid surface runoff. Winds gusting up to 25mph. Drive with caution.'
        : 'Continuous rain bands moving through the regional corridor. High humidity and saturated ground.',
      iconName: 'CloudRain',
      bgAssetId: isHeavy ? `storm_heavy_rain_${timeSuffix}` : `rain_moderate_${timeSuffix}`,
    };
  }

  if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
    return {
      label: 'Snow Fall',
      headline: 'Snow Flurries & Showers',
      narrativeAdvisory: 'Variable clouds with snow showers. Cold crisp airflow. Chance of snow accumulation on elevated surfaces.',
      iconName: 'CloudSnow',
      bgAssetId: `snow_blizzard_${timeSuffix}`,
    };
  }

  if (code >= 95) {
    return {
      label: 'Thunderstorm',
      headline: 'Storm with Heavy Rain',
      narrativeAdvisory: 'Convective storm system active. Frequent lightning potential and rapid convective downdrafts.',
      iconName: 'CloudLightning',
      bgAssetId: `storm_heavy_rain_${timeSuffix}`,
    };
  }

  return {
    label: 'Variable Clouds',
    headline: 'Overcast Cloud System',
    narrativeAdvisory: 'Standard meteorological variation with prevailing seasonal air masses across the viewing sector.',
    iconName: 'Cloud',
    bgAssetId: `cloudy_overcast_${timeSuffix}`,
  };
}

export function parseAirQuality(aqi: number, pm25: number): {
  status: 'Good' | 'Moderate' | 'Unhealthy for Sensitive' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  safetyPercent: number;
  hazardSegment: number;
  advisoryText: string;
} {
  if (aqi <= 50) {
    return {
      status: 'Good',
      safetyPercent: 0.8,
      hazardSegment: 1, // Segment 1: Safe / Low
      advisoryText: 'The air quality is generally acceptable for most individuals. Enjoy outdoor activities with optimal respiratory comfort.',
    };
  }
  if (aqi <= 100) {
    return {
      status: 'Moderate',
      safetyPercent: 1.2,
      hazardSegment: 2,
      advisoryText: 'The air quality is acceptable. However, unusually sensitive people may experience minor respiratory irritation from prolonged exertion.',
    };
  }
  if (aqi <= 150) {
    return {
      status: 'Unhealthy for Sensitive',
      safetyPercent: 2.5,
      hazardSegment: 3,
      advisoryText: 'Members of sensitive groups may experience health effects. The general public is not as likely to be affected.',
    };
  }
  return {
    status: 'Unhealthy',
    safetyPercent: 5.4,
    hazardSegment: 4,
    advisoryText: 'Increased likelihood of adverse effects and aggravation to heart and lungs among the general population.',
  };
}
