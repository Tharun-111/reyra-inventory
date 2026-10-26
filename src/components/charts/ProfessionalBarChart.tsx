import React, { useState } from 'react';

export interface BarDataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  formattedValue?: string;
  sublabel?: string;
}

interface ProfessionalBarChartProps {
  data: BarDataPoint[];
  title?: string;
  subtitle?: string;
  height?: number;
  colorScheme?: 'blue' | 'emerald' | 'rose' | 'amber' | 'indigo';
  formatValue?: (val: number) => string;
  badgeText?: string;
  targetLine?: number;
  targetLabel?: string;
}

export const ProfessionalBarChart: React.FC<ProfessionalBarChartProps> = ({
  data,
  title,
  subtitle,
  height = 200,
  colorScheme = 'blue',
  formatValue,
  badgeText,
  targetLine,
  targetLabel = 'Target',
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center text-xs text-slate-400">
        No data available
      </div>
    );
  }

  const rawMax = Math.max(...data.map(d => d.value), targetLine || 1, 1);
  const roundedMax = Math.ceil(rawMax * 1.15) || 10;

  const colorConfig = {
    blue: {
      bar: 'bg-gradient-to-t from-blue-700 via-blue-600 to-indigo-500 hover:from-blue-600 hover:to-indigo-400',
      badge: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
      accent: '#2563EB',
    },
    emerald: {
      bar: 'bg-gradient-to-t from-emerald-700 via-emerald-600 to-teal-500 hover:from-emerald-600 hover:to-teal-400',
      badge: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
      accent: '#059669',
    },
    rose: {
      bar: 'bg-gradient-to-t from-rose-700 via-rose-600 to-pink-500 hover:from-rose-600 hover:to-pink-400',
      badge: 'bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900',
      accent: '#E11D48',
    },
    amber: {
      bar: 'bg-gradient-to-t from-amber-700 via-amber-600 to-yellow-500 hover:from-amber-600 hover:to-yellow-400',
      badge: 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
      accent: '#D97706',
    },
    indigo: {
      bar: 'bg-gradient-to-t from-indigo-700 via-indigo-600 to-purple-500 hover:from-indigo-600 hover:to-purple-400',
      badge: 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900',
      accent: '#4F46E5',
    },
  }[colorScheme];

  // Grid steps (0, 50%, 100%)
  const yTicks = [0, Math.round(roundedMax * 0.5), roundedMax];

  return (
    <div className="w-full select-none space-y-3">
      {/* Header */}
      {(title || badgeText) && (
        <div className="flex items-center justify-between gap-2 px-1">
          <div>
            {title && (
              <h4 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
                {title}
              </h4>
            )}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
          {badgeText && (
            <span
              className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${colorConfig.badge}`}
            >
              {badgeText}
            </span>
          )}
        </div>
      )}

      {/* Bars Chart Area with Axis and Grid */}
      <div className="relative pt-6 pb-2" style={{ height: `${height}px` }}>
        {/* Subtle Horizontal Reference Gridlines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-6">
          {yTicks.map((tick, i) => (
            <div key={i} className="w-full flex items-center gap-2">
              <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500 w-8 text-right shrink-0">
                {formatValue ? formatValue(tick) : tick}
              </span>
              <div className="flex-1 border-b border-dashed border-slate-200 dark:border-slate-800" />
            </div>
          ))}
        </div>

        {/* Target Benchmark Line if specified */}
        {targetLine !== undefined && (
          <div
            className="absolute left-10 right-0 border-t-2 border-dashed border-amber-400/80 dark:border-amber-400/60 pointer-events-none z-10 flex items-center justify-end pr-2"
            style={{
              bottom: `${(targetLine / roundedMax) * 100 * 0.82 + 20}%`,
            }}
          >
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-white dark:bg-slate-900 px-1 py-0.5 rounded shadow-2xs">
              {targetLabel}: {formatValue ? formatValue(targetLine) : targetLine}
            </span>
          </div>
        )}

        {/* Bars Container */}
        <div className="relative h-full flex items-end justify-between gap-2 pl-10 pr-2 pb-6 z-10">
          {data.map((item, idx) => {
            const heightPercent = Math.max(Math.min((item.value / roundedMax) * 100, 100), item.value > 0 ? 6 : 0);
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute -top-12 z-30 pointer-events-none animate-in fade-in duration-100">
                    <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-md px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-700 text-xs whitespace-nowrap text-center">
                      <div className="font-semibold text-[11px] text-slate-300">{item.label}</div>
                      <div className="font-bold text-sm text-white">
                        {item.formattedValue || (formatValue ? formatValue(item.value) : item.value)}
                      </div>
                      {item.sublabel && (
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.sublabel}</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Track & Bar Column */}
                <div className="w-full max-w-[32px] h-[82%] bg-slate-100 dark:bg-slate-800/80 rounded-t-lg flex items-end overflow-hidden p-0.5 group-hover:bg-slate-200 dark:group-hover:bg-slate-700/80 transition-colors">
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t-md transition-all duration-300 shadow-sm ${colorConfig.bar}`}
                  />
                </div>

                {/* X-Axis Label */}
                <div className="absolute -bottom-5 w-full text-center">
                  <span
                    className={`text-[10.5px] truncate block px-0.5 font-medium transition-colors ${
                      isHovered
                        ? 'text-slate-900 dark:text-white font-bold'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.label}
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
