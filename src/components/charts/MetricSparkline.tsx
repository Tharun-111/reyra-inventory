import React from 'react';

interface MetricSparklineProps {
  data: number[];
  color?: 'blue' | 'emerald' | 'rose' | 'amber' | 'purple';
  height?: number;
  width?: number;
  className?: string;
}

export const MetricSparkline: React.FC<MetricSparklineProps> = ({
  data,
  color = 'blue',
  height = 36,
  width = 96,
  className = '',
}) => {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 4;
  const graphHeight = height - padding * 2;
  const graphWidth = width - padding * 2;

  // Generate coordinates
  const points = data.map((val, idx) => {
    const x = padding + (idx / (data.length - 1)) * graphWidth;
    const y = padding + graphHeight - ((val - min) / range) * graphHeight;
    return { x, y };
  });

  // Smooth Catmull-Rom or cubic bezier curve path
  const generateSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(i - 1, 0)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(i + 2, pts.length - 1)];

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
    }
    return d;
  };

  const linePath = generateSmoothPath(points);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];

  const areaPath = `${linePath} L ${lastPoint.x} ${height - padding} L ${firstPoint.x} ${height - padding} Z`;

  const colorStyles = {
    blue: {
      stroke: '#2563EB',
      fillStart: 'rgba(37, 99, 235, 0.28)',
      fillEnd: 'rgba(37, 99, 235, 0.0)',
      dot: '#1D4ED8',
    },
    emerald: {
      stroke: '#059669',
      fillStart: 'rgba(5, 150, 105, 0.28)',
      fillEnd: 'rgba(5, 150, 105, 0.0)',
      dot: '#047857',
    },
    rose: {
      stroke: '#E11D48',
      fillStart: 'rgba(225, 29, 72, 0.28)',
      fillEnd: 'rgba(225, 29, 72, 0.0)',
      dot: '#BE123C',
    },
    amber: {
      stroke: '#D97706',
      fillStart: 'rgba(217, 119, 6, 0.28)',
      fillEnd: 'rgba(217, 119, 6, 0.0)',
      dot: '#B45309',
    },
    purple: {
      stroke: '#7C3AED',
      fillStart: 'rgba(124, 58, 237, 0.28)',
      fillEnd: 'rgba(124, 58, 237, 0.0)',
      dot: '#6D28D9',
    },
  }[color];

  const gradientId = `spark-grad-${color}-${Math.random().toString(36).substring(2, 7)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={`overflow-visible ${className}`}
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={colorStyles.fillStart} />
          <stop offset="100%" stopColor={colorStyles.fillEnd} />
        </linearGradient>
      </defs>

      {/* Gradient Area */}
      <path d={areaPath} fill={`url(#${gradientId})`} />

      {/* Line Stroke */}
      <path
        d={linePath}
        fill="none"
        stroke={colorStyles.stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Active endpoint dot */}
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r="2.5"
        fill="#FFFFFF"
        stroke={colorStyles.dot}
        strokeWidth="1.5"
      />
    </svg>
  );
};
