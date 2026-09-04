import { CityForecast, FullWeatherData } from '../types/weather.ts';
import { getWindDirection, parseWMOCode, parseAirQuality } from '../utils/weatherParser.ts';

// The 7 iconic comparison cities from the design reference:
export const DEFAULT_COMPARISON_CITIES = [
  { id: 'wdc', name: 'Washington D.C', stateOrCountry: 'USA', latitude: 38.8951, longitude: -77.0364, accentColor: '#E89344' },
  { id: 'okc', name: 'Oklahoma City', stateOrCountry: 'USA', latitude: 35.4676, longitude: -97.5164, accentColor: '#E09B42' },
  { id: 'phl', name: 'Philadelphia', stateOrCountry: 'USA', latitude: 39.9526, longitude: -75.1652, accentColor: '#DE6B3D' },
  { id: 'sfo', name: 'San Francisco', stateOrCountry: 'USA', latitude: 37.7749, longitude: -122.4194, accentColor: '#D9583B' },
  { id: 'nyc', name: 'New York City', stateOrCountry: 'USA', latitude: 40.7128, longitude: -74.0060, accentColor: '#D69046' },
  { id: 'sd', name: 'South Dakota', stateOrCountry: 'USA', latitude: 44.3683, longitude: -100.3510, accentColor: '#D3543A' }, // Pierre
  { id: 'nd', name: 'North Dakota', stateOrCountry: 'USA', latitude: 46.8083, longitude: -100.7837, accentColor: '#DFA14C' }, // Bismarck
];

export async function fetchLiveWeather(
  latitude: number = 35.4676,
  longitude: number = -97.5164,
  locationName: string = 'Oklahoma City',
  country: string = 'USA'
): Promise<FullWeatherData> {
  // 1. Fetch Primary City Forecast (Current, Hourly, Daily)
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,is_day&hourly=temperature_2m,precipitation_probability,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=2`;
  
  // 2. Fetch Primary City Air Quality
  const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}&current=us_aqi,pm2_5,pm10&timezone=auto`;

  // 3. Batch Fetch 7 Comparison Cities
  const lats = DEFAULT_COMPARISON_CITIES.map(c => c.latitude).join(',');
  const lons = DEFAULT_COMPARISON_CITIES.map(c => c.longitude).join(',');
  const multiCityUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}&current=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=1`;

  const [weatherRes, aqiRes, multiCityRes] = await Promise.all([
    fetch(weatherUrl).then(r => {
      if (!r.ok) throw new Error(`Weather fetch failed: ${r.statusText}`);
      return r.json();
    }),
    fetch(aqiUrl).then(r => {
      if (!r.ok) return null; // fallback AQI if rate-limited
      return r.json();
    }).catch(() => null),
    fetch(multiCityUrl).then(r => {
      if (!r.ok) throw new Error(`Multi-city fetch failed: ${r.statusText}`);
      return r.json();
    })
  ]);

  // Parse current conditions
  const curr = weatherRes.current;
  const isDay = curr.is_day === 1;
  const tempC = Math.round(curr.temperature_2m);
  const tempF = Math.round((tempC * 9) / 5 + 32);
  const condition = parseWMOCode(curr.weather_code, isDay);

  // Parse Air Quality
  const aqiData = aqiRes?.current;
  const rawAqi = aqiData?.us_aqi ?? 38;
  const rawPm25 = aqiData?.pm2_5 ?? 6.4;
  const rawPm10 = aqiData?.pm10 ?? 9.2;
  const aqParsed = parseAirQuality(rawAqi, rawPm25);

  // Parse Hourly points for the left mini card (select every 3 hours for 24h)
  const hourlyRaw = weatherRes.hourly;
  const hourlyPoints = [];
  const currDate = new Date();
  const startHour = currDate.getHours();

  for (let i = 0; i < 8; i++) {
    const targetIdx = (startHour + i * 3) % (hourlyRaw.temperature_2m.length);
    const isoTime = hourlyRaw.time[targetIdx];
    const dateObj = new Date(isoTime);
    const hours = dateObj.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayHour = hours % 12 || 12;

    hourlyPoints.push({
      time: `${displayHour} ${ampm}`,
      isoTime,
      temperature: Math.round(hourlyRaw.temperature_2m[targetIdx]),
      precipitationProb: hourlyRaw.precipitation_probability ? hourlyRaw.precipitation_probability[targetIdx] : 10,
      weatherCode: hourlyRaw.weather_code[targetIdx],
    });
  }

  // Parse Multi-city comparison
  // If array returned (multiple locations), map index to DEFAULT_COMPARISON_CITIES
  const cityResults: CityForecast[] = [];
  const multiList = Array.isArray(multiCityRes) ? multiCityRes : [multiCityRes];

  DEFAULT_COMPARISON_CITIES.forEach((base, idx) => {
    const cityData = multiList[idx] || multiList[0];
    const curTemp = cityData?.current?.temperature_2m ? Math.round(cityData.current.temperature_2m) : 20;
    const maxTemp = cityData?.daily?.temperature_2m_max?.[0] ? Math.round(cityData.daily.temperature_2m_max[0]) : curTemp + 3;
    const minTemp = cityData?.daily?.temperature_2m_min?.[0] ? Math.round(cityData.daily.temperature_2m_min[0]) : curTemp - 4;
    const wCode = cityData?.current?.weather_code ?? 0;

    cityResults.push({
      ...base,
      currentTemp: curTemp,
      highTemp: maxTemp,
      lowTemp: minTemp,
      weatherCode: wCode,
    });
  });

  return {
    locationName,
    country,
    current: {
      temperature: tempC,
      temperatureF: tempF,
      apparentTemperature: Math.round(curr.apparent_temperature ?? tempC),
      humidity: Math.round(curr.relative_humidity_2m ?? 45),
      precipitation: Number((curr.precipitation ?? 0).toFixed(1)),
      precipitationProbability: hourlyPoints[0]?.precipitationProb ?? 12,
      windSpeed: Math.round(curr.wind_speed_10m ?? 6),
      windDirection: getWindDirection(curr.wind_direction_10m ?? 240),
      weatherCode: curr.weather_code,
      isDay,
      time: curr.time,
    },
    airQuality: {
      aqi: rawAqi,
      pm25: rawPm25,
      pm10: rawPm10,
      ...aqParsed,
    },
    hourly: hourlyPoints,
    cities: cityResults,
    condition,
  };
}

export async function searchCities(query: string): Promise<Array<{ name: string; country: string; admin1?: string; latitude: number; longitude: number }>> {
  if (!query || query.trim().length < 2) return [];
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  if (!data.results) return [];
  return data.results.map((r: any) => ({
    name: r.name,
    country: r.country_code || r.country || '',
    admin1: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
  }));
}
