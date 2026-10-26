import React, { useState } from 'react';

export interface DonutSlice {
  id: string;
  label: string;
  value: number;
  color: string;
  formattedValue?: string;
}

interface DonutMetricChartProps {
  slices: DonutSlice[];
  title?: string;
  subtitle?: string;
  totalLabel?: string;
  totalFormatted?: string;
  size?: number;
  thickness?: number;
  className?: string;
}

export const DonutMetricChart: React.FC<DonutMetricChartProps> = ({
  slices,
  title,
  subtitle,
  totalLabel = 'Total Value',
  totalFormatted,
  size = 180,
  thickness = 22,
  className = '',
}) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const grandTotal = slices.reduce((acc, s) => acc + s.value, 0) || 1;

  // SVG radius & perimeter
  const center = size / 2;
  const radius = center - thickness / 2 - 4;
  const circumference = 2 * Math.PI * radius;

  // Calculate arc offsets
  let accumulatedPercent = 0;
  const arcSegments = slices.map(slice => {
    const percent = slice.value / grandTotal;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    // SVG stroke starts from 3 o'clock (0 rad). Rotate -90deg so it starts at 12 o'clock
    const strokeDashoffset = -accumulatedPercent * circumference;
    accumulatedPercent += percent;

    return {
      ...slice,
      percent: percent * 100,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeSlice = slices.find(s => s.id === hoveredId);

  return (
    <div className={`w-full flex flex-col space-y-4 select-none ${className}`}>
      {/* Header */}
      {(title || subtitle) && (
        <div className="px-1">
          {title && (
            <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
              {title}
            </h4>
          )}
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
          )}
        </div>
      )}

      <div className="flex flex-col xl:flex-row items-center justify-around gap-6">
        {/* SVG Donut Circle */}
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            {/* Background Empty Ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="currentColor"
              className="text-slate-100 dark:text-slate-800"
              strokeWidth={thickness}
            />

            {/* Arc Slices */}
            {arcSegments.map(slice => {
              const isHovered = hoveredId === slice.id;
              return (
                <circle
                  key={slice.id}
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={slice.color}
                  strokeWidth={isHovered ? thickness + 4 : thickness}
                  strokeDasharray={slice.strokeDasharray}
                  strokeDashoffset={slice.strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredId(slice.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{
                    filter: isHovered ? 'drop-shadow(0 2px 6px rgba(0,0,0,0.25))' : 'none',
                    opacity: hoveredId && !isHovered ? 0.45 : 1,
                  }}
                />
              );
            })}
          </svg>

          {/* Center Callout Metric */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none p-3 text-center">
            {activeSlice ? (
              <>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 truncate max-w-[90px]">
                  {activeSlice.label}
                </span>
                <span className="text-lg font-black text-slate-900 dark:text-white mt-0.5">
                  {((activeSlice.value / grandTotal) * 100).toFixed(1)}%
                </span>
                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
                  {activeSlice.formattedValue || activeSlice.value}
                </span>
              </>
            ) : (
              <>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {totalLabel}
                </span>
                <span className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                  {totalFormatted || grandTotal.toLocaleString()}
                </span>
                <span className="text-[10px] text-slate-400">
                  {slices.length} Categories
                </span>
              </>
            )}
          </div>
        </div>

        {/* Legend List with Interactive Hovers */}
        <div className="flex-1 min-w-0 w-full xl:w-auto space-y-2">
          {slices.map(slice => {
            const isHovered = hoveredId === slice.id;
            const pct = ((slice.value / grandTotal) * 100).toFixed(1);

            return (
              <div
                key={slice.id}
                onMouseEnter={() => setHoveredId(slice.id)}
                onMouseLeave={() => setHoveredId(null)}
                className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all ${
                  isHovered
                    ? 'bg-slate-100 dark:bg-slate-800 scale-[1.01]'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className="w-3 h-3 rounded-md shrink-0 shadow-2xs"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                    {slice.label}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {slice.formattedValue || slice.value}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400 min-w-[36px] text-right">
                    {pct}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
