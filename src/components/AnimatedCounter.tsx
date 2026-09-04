import React, { useEffect, useState } from 'react';

interface AnimatedCounterProps {
  value: number;
  duration?: number; // ms
  prefix?: string;
  suffix?: string;
  className?: string;
  decimals?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 800,
  prefix = '',
  suffix = '',
  className = '',
  decimals = 0,
}) => {
  const [displayValue, setDisplayValue] = useState<number>(value);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startVal = displayValue;
    const endVal = value;

    if (startVal === endVal) return;

    let frameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Ease-out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = startVal + (endVal - startVal) * easeProgress;

      setDisplayValue(current);

      if (progress < 1) {
        frameId = requestAnimationFrame(step);
      } else {
        setDisplayValue(endVal);
      }
    };

    frameId = requestAnimationFrame(step);

    return () => cancelAnimationFrame(frameId);
  }, [value, duration]);

  const formatted = decimals > 0 ? displayValue.toFixed(decimals) : Math.round(displayValue);

  return (
    <span className={`inline-block tabular-nums font-mono tracking-tight ${className}`}>
      {prefix}{formatted}{suffix}
    </span>
  );
};
