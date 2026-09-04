import { describe, it, expect } from 'vitest';
import { DEFAULT_COMPARISON_CITIES } from '../services/weatherApi.ts';

describe('weatherApi constants and batching structures', () => {
  it('contains the 7 designated reference comparison cities with valid coordinates', () => {
    expect(DEFAULT_COMPARISON_CITIES.length).toBe(7);
    const names = DEFAULT_COMPARISON_CITIES.map(c => c.name);
    expect(names).toContain('Washington D.C');
    expect(names).toContain('Oklahoma City');
    expect(names).toContain('Philadelphia');
    expect(names).toContain('San Francisco');
    expect(names).toContain('New York City');
    expect(names).toContain('South Dakota');
    expect(names).toContain('North Dakota');

    DEFAULT_COMPARISON_CITIES.forEach(c => {
      expect(c.latitude).toBeGreaterThan(-90);
      expect(c.latitude).toBeLessThan(90);
      expect(c.longitude).toBeGreaterThan(-180);
      expect(c.longitude).toBeLessThan(180);
      expect(c.accentColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
    });
  });
});
