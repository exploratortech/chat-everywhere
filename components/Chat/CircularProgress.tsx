import React, { useContext, useEffect, useMemo } from 'react';

import HomeContext from '@/pages/api/home/home.context';

interface CircularProgressProps {
  milliseconds: number;
  maxMilliseconds: number;
  setMilliseconds: (value: number) => void;
}

const CircularProgress: React.FC<CircularProgressProps> = ({
  milliseconds,
  maxMilliseconds,
  setMilliseconds,
}) => {
  const size = 30;
  const strokeWidth = 4;
  const {
    state: { lightMode },
  } = useContext(HomeContext);
  const { foregroundColor, backgroundColor, textColor } = useMemo(() => {
    const foregroundColor = lightMode === 'light' ? '#8C949D' : '#959A9C';
    const backgroundColor = lightMode === 'light' ? '#232324' : '#323340';
    const textColor = lightMode === 'light' ? '#8C949D' : '#959A9C';
    return { foregroundColor, backgroundColor, textColor };
  }, [lightMode]);

  const { radius, circumference, strokeDashoffset } = useMemo(() => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const percentage = (milliseconds / maxMilliseconds) * 100;
    const strokeDashoffset =
      circumference - (percentage / 100) * circumference * 0.9;
    return { radius, circumference, strokeDashoffset };
  }, [size, strokeWidth, milliseconds, maxMilliseconds]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const newMilliseconds = milliseconds > 50 ? milliseconds - 50 : 0;
      if (milliseconds !== newMilliseconds) {
        setMilliseconds(newMilliseconds);
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [milliseconds, setMilliseconds]);

  const seconds = Math.round(milliseconds / 1000);

  return (
    <div className="flex justify-center items-center p-1 rounded-lg">
      <svg width={size} height={size}>
        <circle
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        <circle
          className="transition-all duration-500 ease-in-out"
          stroke={foregroundColor}
          strokeWidth={strokeWidth * 1.2}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          r={radius}
          cx={size / 2}
          cy={size / 2}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
        <text
          x="50%"
          y="50%"
          textAnchor="middle"
          fill={textColor}
          dy=".3em"
          fontSize={12}
        >
          {seconds}
        </text>
      </svg>
    </div>
  );
};

export default CircularProgress;
