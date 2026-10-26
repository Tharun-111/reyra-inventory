import React, { useState, useEffect } from 'react';
import { useSettings } from '../../context/SettingsContext';

interface ReyraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  textColor?: string;
  src?: string;
}

export const ReyraLogo: React.FC<ReyraLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  src,
}) => {
  const [imageFailed, setImageFailed] = useState(false);

  // Read brand logo from SettingsContext
  let configuredLogo = '';
  let brandName = 'REYRA Inventory';
  try {
    const { settings } = useSettings();
    configuredLogo = settings?.brand_logo || '';
    brandName = settings?.brand_name || 'REYRA Inventory';
  } catch {
    // If rendered outside SettingsProvider
  }

  const activeLogo = src !== undefined ? src : configuredLogo;
  const isDefaultLogo = !activeLogo || activeLogo === '/assets/reyra_logo.jpg';
  const displaySrc = activeLogo || '/assets/reyra_logo.jpg';

  // Reset error state when logo source changes
  useEffect(() => {
    setImageFailed(false);
  }, [displaySrc]);

  // Dimension mapping
  const sizeMap = {
    sm: { box: 'w-7 h-7', px: 28, text: 'text-sm' },
    md: { box: 'w-9 h-9', px: 36, text: 'text-base' },
    lg: { box: 'w-12 h-12', px: 48, text: 'text-lg' },
    xl: { box: 'w-16 h-16', px: 64, text: 'text-2xl' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={`relative ${currentSize.box} rounded-xl overflow-hidden shrink-0 shadow-xs flex items-center justify-center transition-all ${
          isDefaultLogo
            ? 'bg-[#072d22] border border-emerald-900/30 dark:border-emerald-700/50'
            : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
        }`}
        style={
          isDefaultLogo
            ? {
                boxShadow:
                  '0 2px 8px -1px rgba(6, 46, 32, 0.4), 0 1px 3px -1px rgba(0, 0, 0, 0.2)',
              }
            : undefined
        }
      >
        {!imageFailed ? (
          <img
            src={displaySrc}
            alt={brandName}
            className={`w-full h-full ${isDefaultLogo ? 'object-cover' : 'object-contain p-0.5'} rounded-xl`}
            onError={() => setImageFailed(true)}
            referrerPolicy="no-referrer"
          />
        ) : (
          /* High-Fidelity SVG Vector Recreating the Gold Architectural 'R' on Deep Emerald */
          <svg
            viewBox="0 0 120 120"
            className="w-full h-full p-1"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="reyraGoldPrimary" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF2A3" />
                <stop offset="25%" stopColor="#E5B94E" />
                <stop offset="50%" stopColor="#C89626" />
                <stop offset="75%" stopColor="#F5DB7B" />
                <stop offset="100%" stopColor="#9C6B10" />
              </linearGradient>

              <linearGradient id="reyraGoldColumn" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E2B74B" />
                <stop offset="35%" stopColor="#FFF4B8" />
                <stop offset="70%" stopColor="#C99729" />
                <stop offset="100%" stopColor="#8C5C05" />
              </linearGradient>

              <linearGradient id="reyraGoldLoop" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F8DE85" />
                <stop offset="40%" stopColor="#FDEAA1" />
                <stop offset="75%" stopColor="#C69528" />
                <stop offset="100%" stopColor="#8F5E07" />
              </linearGradient>

              <filter id="goldGlow" x="-10%" y="-10%" width="120%" height="120%">
                <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.45" />
              </filter>
            </defs>

            <rect width="120" height="120" rx="16" fill="#072e22" />

            <g filter="url(#goldGlow)">
              <rect x="22" y="24" width="22" height="4.5" rx="0.5" fill="url(#reyraGoldPrimary)" />
              <rect x="22" y="93" width="22" height="4.5" rx="0.5" fill="url(#reyraGoldPrimary)" />
              <rect x="28" y="27" width="9.5" height="68" fill="url(#reyraGoldColumn)" />
              <path
                d="M 37.5 28.5 L 68 28.5 C 84 28.5 94 37 94 49 C 94 61 84 69.5 68 69.5 L 37.5 69.5 Z"
                fill="none"
                stroke="url(#reyraGoldLoop)"
                strokeWidth="8.5"
                strokeLinejoin="miter"
              />
              <path d="M 58 66 L 85 94 L 97 94 L 69 66 Z" fill="url(#reyraGoldPrimary)" />
              <rect x="78" y="93" width="22" height="4.5" rx="0.5" fill="url(#reyraGoldPrimary)" />
            </g>
          </svg>
        )}
      </div>

      {showText && (
        <div className="leading-tight">
          <div className="font-extrabold text-slate-900 dark:text-white tracking-tight text-lg sm:text-xl">
            {brandName}
          </div>
        </div>
      )}
    </div>
  );
};
