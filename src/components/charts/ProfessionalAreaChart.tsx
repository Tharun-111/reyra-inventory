import React, { useState, useRef } from 'react';

export interface DataPoint {
  label: string;
  value: number;
  secondaryValue?: number;
  tooltipExtra?: string;
}

interface ProfessionalAreaChartProps {
  data: DataPoint[];
  title?: string;
  subtitle?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  formatValue?: (val: number) => string;
  height?: number;
  colorScheme?: 'blue' | 'emerald' | 'purple' | 'amber';
  secondaryLabel?: string;
  primaryLabel?: string;
  badgeText?: string;
  showGrid?: boolean;
}

export const ProfessionalAreaChart: React.FC<ProfessionalAreaChartProps> = ({
  data,
  title,
  subtitle,
  valuePrefix = '',
  valueSuffix = '',
  formatValue,
  height = 240,
  colorScheme = 'blue',
  secondaryLabel,
  primaryLabel = 'Current Period',
  badgeText,
  showGrid = true,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-slate-400">
        No chart data available for this range
      </div>
    );
  }

  // Dimensions & Padding
  const width = 640;
  const paddingLeft = 48;
  const paddingRight = 24;
  const paddingTop = 20;
  const paddingBottom = 32;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // Max & Min
  const allValues = data.flatMap(d => (d.secondaryValue !== undefined ? [d.value, d.secondaryValue] : [d.value]));
  const rawMax = Math.max(...allValues, 1);
  // Round up max to nice integer
  const orderOfMagnitude = Math.pow(10, Math.floor(Math.log10(rawMax)));
  const normalizedMax = Math.ceil(rawMax / orderOfMagnitude) * orderOfMagnitude || 10;
  const yTicks = [0, normalizedMax * 0.25, normalizedMax * 0.5, normalizedMax * 0.75, normalizedMax];

  // Colors config
  const theme = {
    blue: {
      stroke: '#2563EB',
      gradientStart: 'rgba(37, 99, 235, 0.32)',
      gradientEnd: 'rgba(37, 99, 235, 0.01)',
      dotBorder: '#1D4ED8',
      secondaryStroke: '#94A3B8',
      badgeBg: 'bg-blue-50 dark:bg-blue-950/60',
      badgeText: 'text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    },
    emerald: {
      stroke: '#059669',
      gradientStart: 'rgba(5, 150, 105, 0.32)',
      gradientEnd: 'rgba(5, 150, 105, 0.01)',
      dotBorder: '#047857',
      secondaryStroke: '#64748B',
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
      badgeText: 'text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    },
    purple: {
      stroke: '#7C3AED',
      gradientStart: 'rgba(124, 58, 237, 0.32)',
      gradientEnd: 'rgba(124, 58, 237, 0.01)',
      dotBorder: '#6D28D9',
      secondaryStroke: '#94A3B8',
      badgeBg: 'bg-purple-50 dark:bg-purple-950/60',
      badgeText: 'text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    },
    amber: {
      stroke: '#D97706',
      gradientStart: 'rgba(217, 119, 6, 0.32)',
      gradientEnd: 'rgba(217, 119, 6, 0.01)',
      dotBorder: '#B45309',
      secondaryStroke: '#94A3B8',
      badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
      badgeText: 'text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
    },
  }[colorScheme];

  // Coordinates calculator
  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft + chartWidth / 2;
    return paddingLeft + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (val: number) => {
    return paddingTop + chartHeight - (val / normalizedMax) * chartHeight;
  };

  const primaryPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));

  // Smooth SVG curve generator
  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    let path = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(i - 1, 0)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(i + 2, points.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 5;
      const cp1y = p1.y + (p2.y - p0.y) / 5;
      const cp2x = p2.x - (p3.x - p1.x) / 5;
      const cp2y = p2.y - (p3.y - p1.y) / 5;

      path += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return path;
  };

  const primaryLinePath = createSmoothPath(primaryPoints);
  const primaryAreaPath =
    primaryPoints.length > 1
      ? `${primaryLinePath} L ${primaryPoints[primaryPoints.length - 1].x.toFixed(1)} ${(paddingTop + chartHeight).toFixed(1)} L ${primaryPoints[0].x.toFixed(1)} ${(paddingTop + chartHeight).toFixed(1)} Z`
      : '';

  // Optional secondary line path
  const hasSecondary = data.some(d => d.secondaryValue !== undefined);
  const secondaryPoints = hasSecondary
    ? data.map((d, i) => ({ x: getX(i), y: getY(d.secondaryValue || 0) }))
    : [];
  const secondaryLinePath = hasSecondary ? createSmoothPath(secondaryPoints) : '';

  const formatTick = (val: number) => {
    if (formatValue) return formatValue(val);
    if (val >= 1000000) return `${valuePrefix}${(val / 1000000).toFixed(1)}M${valueSuffix}`;
    if (val >= 1000) return `${valuePrefix}${(val / 1000).toFixed(0)}k${valueSuffix}`;
    return `${valuePrefix}${val.toLocaleString()}${valueSuffix}`;
  };

  const activeDataPoint = hoveredIndex !== null ? data[hoveredIndex] : null;
  const activeX = hoveredIndex !== null ? getX(hoveredIndex) : 0;
  const activeY = hoveredIndex !== null ? getY(data[hoveredIndex].value) : 0;

  const gradientId = `chart-area-grad-${colorScheme}-${Math.random().toString(36).substring(2, 6)}`;

  return (
    <div className="w-full flex flex-col space-y-2 select-none" ref={containerRef}>
      {/* Header with Title, Legend & Dynamic Badge */}
      {(title || badgeText) && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
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

          <div className="flex items-center gap-3">
            {/* Legend */}
            <div className="flex items-center gap-3 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.stroke }} />
                <span>{primaryLabel}</span>
              </span>
              {hasSecondary && secondaryLabel && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span>{secondaryLabel}</span>
                </span>
              )}
            </div>

            {badgeText && (
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold border ${theme.badgeBg} ${theme.badgeText}`}
              >
                {badgeText}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Interactive Chart Canvas */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible cursor-crosshair"
          onMouseLeave={() => setHoveredIndex(null)}
          onMouseMove={e => {
            const svgRect = e.currentTarget.getBoundingClientRect();
            const mouseX = ((e.clientX - svgRect.left) / svgRect.width) * width;
            // find closest data index
            let closestIdx = 0;
            let closestDist = Infinity;
            data.forEach((_, idx) => {
              const xPos = getX(idx);
              const dist = Math.abs(xPos - mouseX);
              if (dist < closestDist) {
                closestDist = dist;
                closestIdx = idx;
              }
            });
            setHoveredIndex(closestIdx);
          }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.gradientStart} />
              <stop offset="100%" stopColor={theme.gradientEnd} />
            </linearGradient>

            <filter id="nodeGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor={theme.stroke} floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Gridlines & Y-Axis Scale */}
          {showGrid &&
            yTicks.map((tick, i) => {
              const yPos = getY(tick);
              return (
                <g key={i}>
                  <line
                    x1={paddingLeft}
                    y1={yPos}
                    x2={width - paddingRight}
                    y2={yPos}
                    stroke="currentColor"
                    strokeDasharray="3 3"
                    className="text-slate-200 dark:text-slate-800"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={yPos + 3.5}
                    textAnchor="end"
                    className="text-[10px] fill-slate-400 dark:fill-slate-500 font-mono font-medium"
                  >
                    {formatTick(tick)}
                  </text>
                </g>
              );
            })}

          {/* Secondary Line (if present) */}
          {hasSecondary && (
            <path
              d={secondaryLinePath}
              fill="none"
              stroke={theme.secondaryStroke}
              strokeWidth="1.75"
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
          )}

          {/* Primary Gradient Fill */}
          <path d={primaryAreaPath} fill={`url(#${gradientId})`} />

          {/* Primary Stroke Line */}
          <path
            d={primaryLinePath}
            fill="none"
            stroke={theme.stroke}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Crosshair & Indicator on Hover */}
          {hoveredIndex !== null && (
            <g className="transition-all duration-75">
              {/* Vertical Guide Line */}
              <line
                x1={activeX}
                y1={paddingTop}
                x2={activeX}
                y2={paddingTop + chartHeight}
                stroke={theme.stroke}
                strokeWidth="1.5"
                strokeDasharray="2 2"
                opacity="0.75"
              />

              {/* Glowing Active Data Point */}
              <circle
                cx={activeX}
                cy={activeY}
                r="5.5"
                fill="#FFFFFF"
                stroke={theme.dotBorder}
                strokeWidth="2.5"
                filter="url(#nodeGlow)"
              />

              {hasSecondary && (
                <circle
                  cx={activeX}
                  cy={getY(data[hoveredIndex].secondaryValue || 0)}
                  r="4"
                  fill="#FFFFFF"
                  stroke={theme.secondaryStroke}
                  strokeWidth="2"
                />
              )}
            </g>
          )}

          {/* X-Axis Tick Labels */}
          {data.map((d, i) => {
            const xPos = getX(i);
            const isHovered = hoveredIndex === i;
            return (
              <text
                key={i}
                x={xPos}
                y={height - 10}
                textAnchor="middle"
                className={`text-[10.5px] transition-colors font-medium ${
                  isHovered
                    ? 'fill-blue-600 dark:fill-blue-400 font-bold'
                    : 'fill-slate-500 dark:fill-slate-400'
                }`}
              >
                {d.label}
              </text>
            );
          })}
        </svg>

        {/* Floating Tooltip Card */}
        {activeDataPoint && hoveredIndex !== null && (
          <div
            className="absolute pointer-events-none z-20 transition-all duration-100 transform -translate-x-1/2"
            style={{
              left: `${(activeX / width) * 100}%`,
              top: `${Math.max(10, ((activeY - 60) / height) * 100)}%`,
            }}
          >
            <div className="bg-slate-900/95 dark:bg-slate-800/95 text-white backdrop-blur-md px-3 py-2 rounded-xl shadow-xl border border-slate-700/60 text-xs whitespace-nowrap min-w-[120px]">
              <div className="text-[10.5px] font-semibold text-slate-400 border-b border-slate-700/70 pb-1 flex items-center justify-between gap-3">
                <span>{activeDataPoint.label}</span>
                {activeDataPoint.tooltipExtra && (
                  <span className="text-emerald-400 font-bold">{activeDataPoint.tooltipExtra}</span>
                )}
              </div>
              <div className="mt-1.5 space-y-0.5">
                <div className="flex items-center justify-between gap-4 font-bold text-white text-sm">
                  <span className="text-[11px] font-normal text-slate-300">{primaryLabel}:</span>
                  <span>
                    {formatValue
                      ? formatValue(activeDataPoint.value)
                      : `${valuePrefix}${activeDataPoint.value.toLocaleString()}${valueSuffix}`}
                  </span>
                </div>
                {hasSecondary && activeDataPoint.secondaryValue !== undefined && (
                  <div className="flex items-center justify-between gap-4 text-xs text-slate-300">
                    <span className="text-[11px] text-slate-400">{secondaryLabel}:</span>
                    <span>
                      {formatValue
                        ? formatValue(activeDataPoint.secondaryValue)
                        : `${valuePrefix}${activeDataPoint.secondaryValue.toLocaleString()}${valueSuffix}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
