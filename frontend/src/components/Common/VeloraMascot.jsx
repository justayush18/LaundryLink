import React from 'react';

export default function VeloraMascot({ state = 'happy', size = 120, className = '' }) {
  // Common colors
  const primaryNavy = '#2F4156';
  const teal = '#567C8D';
  const skyBlue = '#C8D9E6';
  const beige = '#F5EFEB';
  const white = '#FFFFFF';

  // Render different face/mouth and details based on state
  const renderFace = () => {
    switch (state) {
      case 'celebrating':
        return (
          <g>
            {/* Happy closed eyes (arcs) */}
            <path d="M 35 40 Q 42 33 49 40" stroke={primaryNavy} strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M 71 40 Q 78 33 85 40" stroke={primaryNavy} strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Open celebrating mouth */}
            <path d="M 52 50 Q 60 62 68 50 Z" fill="#FF6B6B" stroke={primaryNavy} strokeWidth="2.5" />
            {/* Blushing cheeks */}
            <circle cx="28" cy="46" r="5" fill="#FFA8A8" opacity="0.8" />
            <circle cx="92" cy="46" r="5" fill="#FFA8A8" opacity="0.8" />
          </g>
        );
      case 'thinking':
        return (
          <g>
            {/* One eye up, one eye squinting */}
            <circle cx="42" cy="40" r="4.5" fill={primaryNavy} />
            <path d="M 72 42 Q 78 37 84 42" stroke={primaryNavy} strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Sideways mouth */}
            <path d="M 54 52 Q 60 49 66 52" stroke={primaryNavy} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Thinking eyebrow */}
            <path d="M 38 32 Q 44 29 48 33" stroke={primaryNavy} strokeWidth="2" fill="none" strokeLinecap="round" />
          </g>
        );
      case 'sleeping':
        return (
          <g>
            {/* Closed sleeping eyes (arcs down) */}
            <path d="M 35 42 Q 42 47 49 42" stroke={primaryNavy} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <path d="M 71 42 Q 78 47 85 42" stroke={primaryNavy} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            {/* Tiny sleeping mouth */}
            <circle cx="60" cy="52" r="3" fill={primaryNavy} />
            {/* Zzz floating */}
            <text x="95" y="25" fill={teal} fontSize="12" fontWeight="bold" fontFamily="Outfit" className="animate-float" style={{ animationDelay: '0s' }}>Z</text>
            <text x="105" y="15" fill={skyBlue} fontSize="9" fontWeight="bold" fontFamily="Outfit" className="animate-float" style={{ animationDelay: '0.4s' }}>z</text>
          </g>
        );
      case 'loading':
        return (
          <g>
            {/* Dizzy or spinning eyes */}
            <path d="M 37 38 L 47 44 M 47 38 L 37 44" stroke={primaryNavy} strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 73 38 L 83 44 M 83 38 L 73 44" stroke={primaryNavy} strokeWidth="2.5" strokeLinecap="round" />
            {/* Wobbly mouth */}
            <path d="M 52 52 Q 56 48 60 52 T 68 52" stroke={primaryNavy} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          </g>
        );
      case 'happy':
      default:
        return (
          <g>
            {/* Big happy eyes */}
            <circle cx="42" cy="40" r="5" fill={primaryNavy} />
            <circle cx="78" cy="40" r="5" fill={primaryNavy} />
            {/* Shiny eye highlights */}
            <circle cx="44" cy="38" r="1.5" fill={white} />
            <circle cx="80" cy="38" r="1.5" fill={white} />
            {/* Happy smile */}
            <path d="M 52 48 Q 60 58 68 48" stroke={primaryNavy} strokeWidth="3" fill="none" strokeLinecap="round" />
            {/* Blushing cheeks */}
            <circle cx="30" cy="46" r="4" fill="#FFA8A8" opacity="0.6" />
            <circle cx="90" cy="46" r="4" fill="#FFA8A8" opacity="0.6" />
          </g>
        );
    }
  };

  const isSpinning = state === 'loading';

  return (
    <div className={`velora-mascot-wrapper ${className}`} style={{ width: size, height: size * 1.1, display: 'inline-block', position: 'relative' }}>
      <svg
        viewBox="0 0 120 130"
        width="100%"
        height="100%"
        style={{ overflow: 'visible' }}
      >
        {/* Shadow */}
        <ellipse cx="60" cy="122" rx="35" ry="6" fill="#000000" opacity="0.08" />

        {/* Mascot Body */}
        <rect
          x="15"
          y="15"
          width="90"
          height="100"
          rx="18"
          fill={white}
          stroke={primaryNavy}
          strokeWidth="4"
          className={state === 'celebrating' ? 'animate-bounce' : ''}
          style={{ transformOrigin: 'center bottom', animationDuration: '0.8s' }}
        />

        {/* Control Panel Top Line */}
        <line x1="15" y1="35" x2="105" y2="35" stroke={primaryNavy} strokeWidth="3" />

        {/* Cute Buttons / Dials on Control Panel */}
        <circle cx="28" cy="25" r="3" fill={teal} />
        <circle cx="38" cy="25" r="3" fill={skyBlue} />
        <circle cx="92" cy="25" r="4" fill={primaryNavy} />

        {/* Face Elements */}
        {renderFace()}

        {/* Washing Machine Door (The Drum / Belly) */}
        <g className={isSpinning ? 'animate-spin' : ''} style={{ transformOrigin: '60px 88px', animationDuration: '2s' }}>
          {/* Outer door ring */}
          <circle
            cx="60"
            cy="88"
            r="22"
            fill={skyBlue}
            fillOpacity="0.4"
            stroke={primaryNavy}
            strokeWidth="3.5"
          />
          {/* Inner glass / water */}
          <circle
            cx="60"
            cy="88"
            r="16"
            fill="#567C8D"
            fillOpacity="0.15"
          />
          {/* Water Swirl Details */}
          <path
            d="M 48 88 Q 54 82 60 88 T 72 88"
            stroke={isSpinning ? teal : skyBlue}
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="54" cy="94" r="3" fill={white} opacity="0.7" />
          <circle cx="68" cy="82" r="2" fill={white} opacity="0.6" />
        </g>

        {/* Little Arms */}
        {state === 'celebrating' ? (
          <g>
            <path d="M 15 50 Q 5 35 8 25" stroke={primaryNavy} strokeWidth="4.5" fill="none" strokeLinecap="round" />
            <path d="M 105 50 Q 115 35 112 25" stroke={primaryNavy} strokeWidth="4.5" fill="none" strokeLinecap="round" />
          </g>
        ) : (
          <g>
            <path d="M 15 55 Q 5 65 8 75" stroke={primaryNavy} strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M 105 55 Q 115 65 112 75" stroke={primaryNavy} strokeWidth="4" fill="none" strokeLinecap="round" />
          </g>
        )}

        {/* Little Feet */}
        <rect x="30" y="115" width="14" height="8" rx="4" fill={primaryNavy} />
        <rect x="76" y="115" width="14" height="8" rx="4" fill={primaryNavy} />
      </svg>
    </div>
  );
}
