import React, { useState, useEffect } from 'react';
import { fetchLiveWeather, DEFAULT_COMPARISON_CITIES } from './services/weatherApi.ts';
import { FullWeatherData, CityForecast } from './types/weather.ts';
import { WeatherBackgroundShader } from './components/WeatherBackgroundShader.tsx';
import { LeftSidebar } from './components/LeftSidebar.tsx';
import { RightHeroContent } from './components/RightHeroContent.tsx';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const [weather, setWeather] = useState<FullWeatherData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Background Shader Transitions
  const [currentBg, setCurrentBg] = useState<string>('/weather-bg/reference_original.webp');
  const [prevBg, setPrevBg] = useState<string>('/weather-bg/reference_original.webp');
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [transitionProgress, setTransitionProgress] = useState<number>(1.0);

  // Trigger smooth transition to new weather background
  const changeBackground = (newBgUrl: string) => {
    if (newBgUrl === currentBg) return;
    setPrevBg(currentBg);
    setCurrentBg(newBgUrl);
    setIsTransitioning(true);
    setTransitionProgress(0.0);

    const startTime = performance.now();
    const duration = 1200; // 1.2s video-smooth transition

    const animateTransition = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / duration);
      setTransitionProgress(progress);

      if (progress < 1.0) {
        requestAnimationFrame(animateTransition);
      } else {
        setIsTransitioning(false);
      }
    };

    requestAnimationFrame(animateTransition);
  };

  // Fetch Weather Data
  const loadWeatherData = async (
    lat: number = 35.4676,
    lon: number = -97.5164,
    cityName: string = 'Oklahoma City',
    country: string = 'USA'
  ) => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchLiveWeather(lat, lon, cityName, country);
      setWeather(data);

      // Determine background url
      const bgUrl = `/weather-bg/${data.condition.bgAssetId}.webp`;
      changeBackground(bgUrl);
    } catch (err: any) {
      console.error('Failed to load weather:', err);
      setError('Unable to fetch live meteorological telemetry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load for Oklahoma City (as in the reference design)
    loadWeatherData(35.4676, -97.5164, 'Oklahoma City', 'USA');
  }, []);

  const handleSelectCity = (city: CityForecast) => {
    loadWeatherData(city.latitude, city.longitude, city.name, city.stateOrCountry);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#1A1A1C] text-white flex flex-col items-center justify-center p-3 sm:p-6 lg:p-10 font-sans overflow-x-hidden selection:bg-amber-400 selection:text-black">
      {/* Outer Canvas Decorative Contour Vector Arcs */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20 z-0"
        viewBox="0 0 1440 1024"
        preserveAspectRatio="none"
      >
        <path
          d="M -100 200 C 300 50, 700 350, 1500 150"
          fill="none"
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="1"
        />
        <path
          d="M 100 900 C 600 750, 1000 950, 1600 800"
          fill="none"
          stroke="rgba(255, 255, 255, 0.3)"
          strokeWidth="1"
        />
      </svg>

      {/* Outer Canvas Corner Annotations */}
      <div className="absolute top-5 sm:top-8 left-6 sm:left-10 text-[11px] sm:text-[13px] text-[#8E9297] font-normal tracking-wide z-10 pointer-events-none">
        Weather Dashboard
      </div>
      <div className="absolute top-5 sm:top-8 right-6 sm:right-10 text-[11px] sm:text-[13px] text-[#8E9297] font-normal tracking-wide z-10 pointer-events-none">
        2023
      </div>
      <div className="absolute bottom-5 sm:bottom-8 left-6 sm:left-10 text-[11px] sm:text-[13px] text-[#8E9297] font-normal tracking-wide z-10 pointer-events-none">
        {weather ? `${weather.current.temperature}°C` : '17°C'}
      </div>
      <div className="absolute bottom-5 sm:bottom-8 right-6 sm:right-10 text-[11px] sm:text-[13px] text-[#8E9297] font-normal tracking-wide z-10 pointer-events-none">
        {weather ? `${weather.locationName} Weather` : 'Oklahoma City Weather'}
      </div>

      {/* Main Glassmorphic Container Card (approx 1280px x 760px) */}
      <main className="relative z-20 w-full max-w-[1280px] min-h-[720px] rounded-[30px] border border-white/15 bg-[#121316]/60 shadow-[0_24px_64px_rgba(0,0,0,0.7),0_2px_8px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col lg:flex-row transition-all duration-300">
        {/* WebGL2 Dynamic Shader Background Layer */}
        <WeatherBackgroundShader
          currentBgUrl={currentBg}
          previousBgUrl={prevBg}
          isTransitioning={isTransitioning}
          transitionProgress={transitionProgress}
          weatherType={weather?.condition.label || 'Storm'}
          isRaining={weather ? weather.current.weatherCode >= 51 && weather.current.weatherCode <= 99 : true}
        />

        {loading && !weather ? (
          <div className="relative z-30 flex-1 flex flex-col items-center justify-center min-h-[500px]">
            <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-3" />
            <span className="text-xs tracking-widest uppercase text-white/70">Connecting Meteorologisk Satellites...</span>
          </div>
        ) : weather ? (
          <>
            {/* Left Glass Sidebar (26%) */}
            <LeftSidebar
              weather={weather}
              onSelectCity={(lat, lon, name, country) => loadWeatherData(lat, lon, name, country)}
              isLoading={loading}
            />

            {/* Right Main Hero Forecast & Continuous Wave (74%) */}
            <RightHeroContent
              weather={weather}
              onSelectCity={handleSelectCity}
              onOpenDetails={() => {
                alert(`Detailed telemetry for ${weather.locationName}: Humidity ${weather.current.humidity}%, Apparent Temp ${weather.current.apparentTemperature}°C, AQI ${weather.airQuality.aqi} (${weather.airQuality.status})`);
              }}
            />
          </>
        ) : error ? (
          <div className="relative z-30 flex-1 flex flex-col items-center justify-center p-8 text-center">
            <p className="text-red-400 text-sm mb-4">{error}</p>
            <button
              onClick={() => loadWeatherData()}
              className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-xs text-white"
            >
              Retry Telemetry
            </button>
          </div>
        ) : null}
      </main>
    </div>
  );
};

export default App;
