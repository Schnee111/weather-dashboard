import React from 'react';
import { CloudRain, Sun, Cloud, CloudSnow, CloudLightning, ArrowUpRight } from 'lucide-react';
import { FullWeatherData, CityForecast } from '../types/weather';
import { ContinuousWaveForecast } from './ContinuousWaveForecast';
import { AnimatedCounter } from './AnimatedCounter';

interface RightHeroContentProps {
  weather: FullWeatherData;
  onSelectCity: (city: CityForecast) => void;
  onOpenDetails?: () => void;
}

export const RightHeroContent: React.FC<RightHeroContentProps> = ({
  weather,
  onSelectCity,
  onOpenDetails,
}) => {
  // Select appropriate icon
  const getConditionIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sun':
        return <Sun className="w-4 h-4 text-amber-300" />;
      case 'CloudLightning':
        return <CloudLightning className="w-4 h-4 text-sky-300" />;
      case 'CloudSnow':
        return <CloudSnow className="w-4 h-4 text-cyan-200" />;
      case 'CloudRain':
        return <CloudRain className="w-4 h-4 text-sky-400" />;
      default:
        return <Cloud className="w-4 h-4 text-white/80" />;
    }
  };

  // Format Date string: "USA, Friday, Jan 3, 2023, 8:45AM"
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const formattedDateTime = `${weather.country}, ${dateStr}, ${timeStr}`;

  return (
    <div className="flex-1 flex flex-col justify-between p-6 sm:p-9 lg:p-11 relative z-10 text-white min-h-[580px]">
      {/* 4.1 Brand Header Tag & Top Bar */}
      <div className="flex items-start justify-between">
        <div>
          <span className="block text-[10px] font-bold tracking-[1.4px] text-white/90 uppercase font-sans">
            NATIONAL<br />WEATHER
          </span>
        </div>

        {/* Outer Canvas Top-Right Indicator */}
        <span className="text-xs font-mono text-white/50">
          {now.getFullYear()}
        </span>
      </div>

      {/* 4.2 Hero Weather Forecast Headline */}
      <div className="my-auto py-4">
        <span className="block text-[11px] font-normal text-white/65 mb-2 font-sans tracking-wide">
          Weather Forecast
        </span>

        {/* Display Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-[44px] font-normal leading-[1.08] text-white tracking-tight font-sans max-w-xl">
          {weather.condition.headline}
        </h1>

        {/* 4.3 Forecast Condition & Advisory Cluster */}
        <div className="mt-6 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
          {/* Weather Icon & Timestamp */}
          <div className="flex items-center gap-2 text-white/85 text-xs">
            {getConditionIcon(weather.condition.iconName)}
            <span className="text-[11px] font-normal tracking-wide">
              {formattedDateTime}
            </span>
          </div>
        </div>

        {/* Large Secondary Temp + Narrative Advisory Text */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5">
          <div className="text-[42px] leading-none font-light text-white tracking-tight flex-shrink-0 font-sans">
            <AnimatedCounter value={weather.current.temperature} />°
          </div>

          <p className="text-[10px] sm:text-[10.5px] leading-relaxed text-white/70 max-w-md font-sans">
            {weather.condition.narrativeAdvisory}
          </p>
        </div>

        {/* 4.4 CTA Button ("SEE DETAILS ↗") */}
        <div className="mt-6">
          <button
            type="button"
            onClick={onOpenDetails}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/20 backdrop-blur-md text-[9px] font-semibold tracking-[0.8px] uppercase text-white transition-all hover:scale-105 active:scale-95 cursor-pointer shadow-lg"
          >
            <span>SEE DETAILS</span>
            <ArrowUpRight className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>

      {/* 4.5 & 4.6 The Continuous Wave & 7-City Forecast Matrix */}
      <ContinuousWaveForecast
        cities={weather.cities}
        onSelectCity={onSelectCity}
      />
    </div>
  );
};
