import React from 'react';
import { CityForecast } from '../types/weather';
import { AnimatedCounter } from './AnimatedCounter';

interface ContinuousWaveForecastProps {
  cities: CityForecast[];
  selectedCityId?: string;
  onSelectCity?: (city: CityForecast) => void;
}

export const ContinuousWaveForecast: React.FC<ContinuousWaveForecastProps> = ({
  cities,
  selectedCityId,
  onSelectCity,
}) => {
  if (!cities || cities.length === 0) return null;

  // Compute SVG continuous spline geometry through 7 cities
  // SVG viewBox: width = 840, height = 70
  const width = 840;
  const colWidth = width / cities.length;

  const points = cities.map((c, i) => {
    const x = colWidth * i + colWidth / 2;
    // Map temperature to y: e.g. -12°C to 28°C
    const minT = -12;
    const maxT = 28;
    const norm = Math.max(0, Math.min(1, (c.currentTemp - minT) / (maxT - minT)));
    // Inverse y: high temp = near top (15), low temp = near bottom (55)
    const y = 55 - norm * 40;
    return { x, y, city: c };
  });

  // Calculate Catmull-Rom to Cubic Bezier path
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) / 5.5;
    const cp1y = p1.y + (p2.y - p0.y) / 5.5;
    const cp2x = p2.x - (p3.x - p1.x) / 5.5;
    const cp2y = p2.y - (p3.y - p1.y) / 5.5;

    pathD += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }

  return (
    <div className="w-full relative mt-auto pt-6 select-none">
      {/* 1. High/Low Labels Row (Above the wave) */}
      <div className="grid grid-cols-7 gap-2 px-1 text-center">
        {cities.map((c) => (
          <div key={c.id} className="text-[8.5px] leading-tight text-white/60 font-sans">
            <div>high {c.highTemp}.0 °C</div>
            <div>low {c.lowTemp} °C</div>
          </div>
        ))}
      </div>

      {/* 2. Continuous Spline Wave SVG Layer */}
      <div className="relative w-full h-[70px] my-1">
        <svg
          className="w-full h-full overflow-visible"
          viewBox={`0 0 ${width} 70`}
          preserveAspectRatio="none"
        >
          <defs>
            <filter id="splineGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#ECA74E" floodOpacity="0.5" />
            </filter>
            <linearGradient id="waveFillGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ECA74E" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ECA74E" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Area fill under curve */}
          <path
            d={`${pathD} L ${points[points.length - 1].x} 70 L ${points[0].x} 70 Z`}
            fill="url(#waveFillGrad)"
            opacity="0.6"
          />

          {/* Primary Golden Spline Line */}
          <path
            d={pathD}
            fill="none"
            stroke="#ECA74E"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#splineGlow)"
          />

          {/* Vertex Points on wave */}
          {points.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r="3.5"
              fill="#ECA74E"
              stroke="#1A1A1E"
              strokeWidth="1.5"
              className="cursor-pointer transition-transform hover:scale-150"
            />
          ))}
        </svg>
      </div>

      {/* 3. Big Temp & City Names Grid (Below the wave) */}
      <div className="grid grid-cols-7 gap-2 px-1 text-center">
        {cities.map((c) => {
          const isSelected = selectedCityId === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCity?.(c)}
              className={`flex flex-col items-center group cursor-pointer transition-all duration-200 ${
                isSelected ? 'scale-105' : 'hover:scale-102'
              }`}
            >
              {/* Big Temp Metric (26px) */}
              <span className="text-[26px] font-light text-white tracking-tight leading-none mb-1 font-sans">
                <AnimatedCounter value={c.currentTemp} />°
              </span>

              {/* City Name Label */}
              <span className="text-[9.5px] font-normal text-white/70 group-hover:text-white transition-colors truncate max-w-full px-0.5">
                {c.name}
              </span>

              {/* Distinct Color Underline Pill Bar */}
              <div
                className="w-8 h-[2.5px] rounded-full mt-2 transition-all duration-300"
                style={{
                  backgroundColor: c.accentColor,
                  boxShadow: `0 0 6px ${c.accentColor}80`,
                  transform: isSelected ? 'scaleX(1.3)' : 'scaleX(1.0)',
                }}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};
