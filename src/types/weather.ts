export interface CurrentWeather {
  temperature: number; // Celsius
  temperatureF: number; // Fahrenheit
  apparentTemperature: number;
  humidity: number; // %
  precipitation: number; // mm
  precipitationProbability: number; // %
  windSpeed: number; // km/h or mph
  windDirection: string; // e.g. "WSW"
  weatherCode: number;
  isDay: boolean;
  time: string;
}

export interface AirQuality {
  aqi: number; // US AQI
  pm25: number;
  pm10: number;
  status: 'Good' | 'Moderate' | 'Unhealthy for Sensitive' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  safetyPercent: number; // e.g. 0.8%
  hazardSegment: number; // 1 to 4
  advisoryText: string;
}

export interface HourlyPoint {
  time: string; // "11 pm", "1 am"
  isoTime: string;
  temperature: number;
  precipitationProb: number;
  weatherCode: number;
}

export interface CityForecast {
  id: string;
  name: string;
  stateOrCountry: string;
  latitude: number;
  longitude: number;
  currentTemp: number;
  highTemp: number;
  lowTemp: number;
  weatherCode: number;
  accentColor: string;
}

export interface WeatherCondition {
  label: string;
  headline: string;
  narrativeAdvisory: string;
  iconName: string;
  bgAssetId: string;
}

export interface FullWeatherData {
  locationName: string;
  country: string;
  current: CurrentWeather;
  airQuality: AirQuality;
  hourly: HourlyPoint[];
  cities: CityForecast[];
  condition: WeatherCondition;
}
