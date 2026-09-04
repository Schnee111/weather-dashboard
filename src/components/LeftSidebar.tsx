import React, { useState } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { FullWeatherData } from '../types/weather';
import { AnimatedCounter } from './AnimatedCounter';
import { searchCities } from '../services/weatherApi';

interface LeftSidebarProps {
  weather: FullWeatherData;
  onSelectCity: (lat: number, lon: number, name: string, country: string) => void;
  isLoading: boolean;
}

export const LeftSidebar: React.FC<LeftSidebarProps> = ({
  weather,
  onSelectCity,
  isLoading,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<any>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (q.trim().length >= 2) {
      setIsSearching(true);
      setShowDropdown(true);
      try {
        const results = await searchCities(q);
        setSearchResults(results);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSearchResults([]);
      setShowDropdown(false);
    }
  };

  const handleSelectLocation = (item: any) => {
    onSelectCity(item.latitude, item.longitude, item.name, item.country);
    setSearchQuery(`${item.name}, ${item.country}`);
    setShowDropdown(false);
  };

  // 4-segment hazard colors: Coral Red, Deep Orange, Warm Gold, Pale Yellow
  const segmentColors = ['#D84C38', '#E07D38', '#E9B442', '#F4E285'];

  return (
    <div className="w-full lg:w-[320px] xl:w-[340px] flex-shrink-0 flex flex-col justify-between p-6 sm:p-7 relative border-b lg:border-b-0 lg:border-r border-white/10 bg-white/[0.04] backdrop-blur-[32px] rounded-t-[28px] lg:rounded-tr-none lg:rounded-l-[28px] text-white">
      {/* 3.1 Search & Location Input Bar */}
      <div className="relative mb-6">
        <div className="w-full h-9 rounded-full bg-white/[0.07] border border-white/15 px-3 flex items-center justify-between text-xs text-white/80 focus-within:border-white/35 transition-all">
          <div className="flex items-center gap-2 flex-1 mr-2 overflow-hidden">
            <MapPin className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search location..."
              value={searchQuery || `${weather.locationName}, ${weather.country}`}
              onChange={handleSearchChange}
              onFocus={() => {
                if (searchResults.length > 0) setShowDropdown(true);
              }}
              className="bg-transparent border-none outline-none text-[11.5px] text-white placeholder:text-white/40 w-full truncate"
            />
          </div>
          {isSearching || isLoading ? (
            <Loader2 className="w-3.5 h-3.5 text-white/70 animate-spin flex-shrink-0" />
          ) : (
            <Search className="w-3.5 h-3.5 text-white/70 flex-shrink-0" />
          )}
        </div>

        {/* Search Results Dropdown */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute top-11 left-0 right-0 z-50 bg-[#1A1A1E]/95 border border-white/15 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden py-1 max-h-56 overflow-y-auto">
            {searchResults.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectLocation(item)}
                className="w-full px-3 py-2 text-left text-xs hover:bg-white/10 text-white/90 flex items-center justify-between transition-colors border-b border-white/5 last:border-none"
              >
                <span className="font-medium">{item.name}</span>
                <span className="text-[10px] text-white/50">{item.admin1 ? `${item.admin1}, ` : ''}{item.country}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3.2 Primary Temperature & Wind Block */}
      <div className="mb-6">
        <div className="flex items-baseline gap-2.5">
          <span className="text-[56px] leading-none font-normal tracking-[-2px] text-white font-sans">
            <AnimatedCounter value={weather.current.temperature} />°
          </span>
          <span className="text-[26px] font-light text-white/85">
            ± 3
          </span>
        </div>
        <div className="flex items-center justify-between mt-2 text-white/75 text-xs">
          <span className="text-[20px] font-medium text-white/95 tabular-nums">
            <AnimatedCounter value={weather.current.precipitationProbability} suffix="%" />
          </span>
          <span className="text-[10px] text-white/65 font-sans tracking-wide">
            Wind: {weather.current.windDirection} {weather.current.windSpeed}mph
          </span>
        </div>
      </div>

      {/* 3.3 Air Quality / Severity Scale Widget */}
      <div className="mb-6 bg-white/[0.02] p-3 rounded-xl border border-white/5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            {segmentColors.map((color, i) => (
              <div
                key={i}
                className="w-[14px] h-[5px] rounded-[2.5px] transition-all duration-500"
                style={{
                  backgroundColor: color,
                  opacity: i + 1 <= weather.airQuality.hazardSegment ? 1 : 0.25,
                  boxShadow: i + 1 <= weather.airQuality.hazardSegment ? `0 0 6px ${color}80` : 'none',
                }}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-white tracking-wide">
            • {weather.airQuality.safetyPercent.toFixed(1)}%
          </span>
        </div>

        {/* Legend Grid */}
        <div className="grid grid-cols-2 gap-3 text-[9px] text-white/55">
          <div>
            <span className="block text-[10px] font-semibold text-white/85 mb-0.5">Safe</span>
            <p className="leading-tight">• 0.00% - 0.9%</p>
            <p className="leading-tight">• 0.9% - 1.1%</p>
          </div>
          <div>
            <span className="block text-[10px] font-semibold text-white/85 mb-0.5">Dangerous</span>
            <p className="leading-tight">• 1.2% - 3.8%</p>
            <p className="leading-tight">• 3.9% - 9.0%</p>
          </div>
        </div>
      </div>

      {/* 3.4 Mini Hourly Fluctuation Graph Card */}
      <div className="mb-6 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-base font-medium text-white tabular-nums">
            {weather.current.temperature}°c
          </span>
          <span className="text-[9px] text-white/50 tracking-wider">
            +{weather.current.temperature + 2}°
          </span>
        </div>

        {/* Mini SVG Spline Wave */}
        <div className="relative h-14 w-full">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 260 50">
            <defs>
              <linearGradient id="miniSplineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#C9A87C" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#E09B42" stopOpacity="1" />
              </linearGradient>
            </defs>
            {/* Draw spline path connecting hourly points */}
            {(() => {
              const pts = weather.hourly.slice(0, 6).map((h, i) => {
                const x = 15 + i * 46;
                // normalize temp roughly
                const minT = Math.min(...weather.hourly.map(p => p.temperature));
                const maxT = Math.max(...weather.hourly.map(p => p.temperature)) + 1;
                const norm = (h.temperature - minT) / (maxT - minT || 1);
                const y = 38 - norm * 26;
                return { x, y };
              });

              if (pts.length < 2) return null;

              // Cubic bezier smooth curve
              let d = `M ${pts[0].x} ${pts[0].y}`;
              for (let i = 0; i < pts.length - 1; i++) {
                const p0 = pts[i === 0 ? 0 : i - 1];
                const p1 = pts[i];
                const p2 = pts[i + 1];
                const p3 = pts[i + 2] || p2;

                const cp1x = p1.x + (p2.x - p0.x) / 6;
                const cp1y = p1.y + (p2.y - p0.y) / 6;
                const cp2x = p2.x - (p3.x - p1.x) / 6;
                const cp2y = p2.y - (p3.y - p1.y) / 6;

                d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
              }

              return (
                <>
                  <path
                    d={d}
                    fill="none"
                    stroke="url(#miniSplineGrad)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                  />
                  {pts.map((p, idx) => (
                    <circle
                      key={idx}
                      cx={p.x}
                      cy={p.y}
                      r="2.5"
                      fill="#C9A87C"
                      stroke="#1A1A1E"
                      strokeWidth="1"
                    />
                  ))}
                </>
              );
            })()}
          </svg>
        </div>

        {/* X-axis labels */}
        <div className="flex justify-between text-[7px] text-white/35 uppercase tracking-wider mt-1 px-1">
          {weather.hourly.slice(0, 5).map((h, i) => (
            <span key={i}>{h.time}</span>
          ))}
        </div>
      </div>

      {/* 3.5 Location Health Advisory Note */}
      <div className="mt-auto pt-1">
        <h4 className="text-xs font-semibold text-white mb-1 tracking-tight">
          {weather.locationName}
        </h4>
        <p className="text-[9px] text-white/50 leading-relaxed font-sans">
          {weather.airQuality.advisoryText}
        </p>
      </div>
    </div>
  );
};
