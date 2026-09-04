import { describe, it, expect } from 'vitest';
import { getWindDirection, parseWMOCode, parseAirQuality } from '../utils/weatherParser.ts';

describe('weatherParser utilities', () => {
  it('correctly maps degree azimuth to compass directions', () => {
    expect(getWindDirection(0)).toBe('N');
    expect(getWindDirection(90)).toBe('E');
    expect(getWindDirection(180)).toBe('S');
    expect(getWindDirection(240)).toBe('WSW');
    expect(getWindDirection(270)).toBe('W');
  });

  it('correctly parses WMO clear sky codes for day and night', () => {
    const dayClear = parseWMOCode(0, true);
    expect(dayClear.label).toBe('Clear Sky');
    expect(dayClear.bgAssetId).toBe('clear_sky_day');
    expect(dayClear.iconName).toBe('Sun');

    const nightClear = parseWMOCode(0, false);
    expect(nightClear.label).toBe('Clear Sky');
    expect(nightClear.bgAssetId).toBe('clear_sky_night');
    expect(nightClear.iconName).toBe('Moon');
  });

  it('correctly parses thunderstorm and heavy rain WMO codes', () => {
    const storm = parseWMOCode(95, true);
    expect(storm.label).toBe('Thunderstorm');
    expect(storm.headline).toBe('Storm with Heavy Rain');
    expect(storm.bgAssetId).toBe('storm_heavy_rain_day');

    const heavyRain = parseWMOCode(65, false);
    expect(heavyRain.label).toBe('Heavy Rain');
    expect(heavyRain.bgAssetId).toBe('storm_heavy_rain_night');
  });

  it('correctly evaluates US AQI and Air Quality severity segments', () => {
    const good = parseAirQuality(30, 4.5);
    expect(good.status).toBe('Good');
    expect(good.hazardSegment).toBe(1);
    expect(good.safetyPercent).toBe(0.8);

    const moderate = parseAirQuality(75, 12.0);
    expect(moderate.status).toBe('Moderate');
    expect(moderate.hazardSegment).toBe(2);

    const sensitive = parseAirQuality(135, 35.0);
    expect(sensitive.status).toBe('Unhealthy for Sensitive');
    expect(sensitive.hazardSegment).toBe(3);

    const unhealthy = parseAirQuality(175, 55.0);
    expect(unhealthy.status).toBe('Unhealthy');
    expect(unhealthy.hazardSegment).toBe(4);
  });
});
