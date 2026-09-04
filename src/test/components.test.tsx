import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AnimatedCounter } from '../components/AnimatedCounter.tsx';
import { ContinuousWaveForecast } from '../components/ContinuousWaveForecast.tsx';
import { DEFAULT_COMPARISON_CITIES } from '../services/weatherApi.ts';

describe('UI Component rendering', () => {
  it('renders AnimatedCounter with value, prefix and suffix', () => {
    render(<AnimatedCounter value={20} suffix="°" prefix="" />);
    expect(screen.getByText('20°')).toBeInTheDocument();
  });

  it('renders ContinuousWaveForecast with all 7 city columns and metrics', () => {
    const mockCities = DEFAULT_COMPARISON_CITIES.map(c => ({
      ...c,
      currentTemp: 18,
      highTemp: 22,
      lowTemp: 14,
      weatherCode: 0,
    }));

    render(<ContinuousWaveForecast cities={mockCities} />);

    expect(screen.getByText('Washington D.C')).toBeInTheDocument();
    expect(screen.getByText('Oklahoma City')).toBeInTheDocument();
    expect(screen.getByText('San Francisco')).toBeInTheDocument();
    expect(screen.getByText('North Dakota')).toBeInTheDocument();
    expect(screen.getAllByText('high 22.0 °C').length).toBe(7);
  });
});
