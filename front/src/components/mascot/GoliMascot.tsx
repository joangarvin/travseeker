import React from 'react';

export type MascotState = 'standard' | 'flying' | 'alert';

interface GoliMascotProps {
  state?: MascotState;
  className?: string;
  size?: number | string;
}

export const GoliMascot: React.FC<GoliMascotProps> = ({
  state = 'standard',
  className = '',
  size = 120,
}) => {
  const dimension = typeof size === 'number' ? `${size}px` : size;

  if (state === 'flying') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 220 180"
        style={{ width: dimension, height: 'auto' }}
        className={`inline-block ${className}`}
      >
        <g id="goli-mascot-flying">
          <path
            d="M 10 70 Q 30 65 40 70"
            stroke="#CBD5E1"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 5 95 Q 25 90 35 95"
            stroke="#CBD5E1"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
          <path
            d="M 65 100 L 15 125 L 50 110 L 15 90 L 60 95 Z"
            fill="#1E293B"
            stroke="#0F172A"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M 55 90 C 50 55 80 35 125 40 C 175 45 195 75 190 105 C 185 130 150 145 110 140 C 75 135 55 115 55 90 Z"
            fill="#1E3A8A"
            stroke="#0F172A"
            strokeWidth="4"
          />
          <path
            d="M 90 55 C 80 25 100 10 130 20 C 150 30 135 60 115 65 Z"
            fill="#2563EB"
            stroke="#0F172A"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M 130 115 C 140 145 160 160 180 145 C 190 135 170 120 150 115 Z"
            fill="#2563EB"
            stroke="#0F172A"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M 115 48 C 155 52 185 75 180 110 C 175 135 145 140 120 135 C 95 130 105 105 105 80 C 105 60 110 48 115 48 Z"
            fill="#FB923C"
            stroke="#0F172A"
            strokeWidth="4"
          />
          <path
            d="M 130 75 C 160 80 175 95 170 118 C 165 132 140 135 125 132 C 110 128 118 100 125 85 Z"
            fill="#FFFFFF"
            stroke="#0F172A"
            strokeWidth="3"
          />
          <ellipse cx="140" cy="98" rx="8" ry="6" fill="#F472B6" opacity="0.6" />
          <ellipse
            cx="152"
            cy="78"
            rx="11"
            ry="15"
            fill="#FFFFFF"
            stroke="#0F172A"
            strokeWidth="3.5"
          />
          <ellipse cx="154" cy="78" rx="6.5" ry="9" fill="#0F172A" />
          <circle cx="157" cy="74" r="3" fill="#FFFFFF" />
          <path
            d="M 168 82 L 184 85 L 172 96 Z"
            fill="#FBBF24"
            stroke="#0F172A"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <g id="passport" transform="translate(145, 105) rotate(12)">
            <rect
              x="0"
              y="0"
              width="28"
              height="36"
              rx="4"
              fill="#EF4444"
              stroke="#0F172A"
              strokeWidth="3"
            />
            <circle cx="14" cy="16" r="7" fill="none" stroke="#FBBF24" strokeWidth="2" />
            <text
              x="14"
              y="30"
              fontFamily="sans-serif"
              fontSize="5"
              fontWeight="bold"
              fill="#FFFFFF"
              textAnchor="middle"
            >
              PASSPORT
            </text>
          </g>
        </g>
      </svg>
    );
  }

  if (state === 'alert') {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 200 200"
        style={{ width: dimension, height: 'auto' }}
        className={`inline-block ${className}`}
      >
        <g id="goli-mascot-alert">
          <path
            d="M 60 145 L 20 175 L 55 130 L 25 115 L 65 110 Z"
            fill="#1E293B"
            stroke="#0F172A"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M 45 105 C 30 75 35 40 75 35 C 130 30 155 70 150 110 C 145 145 115 165 80 165 C 55 165 45 140 45 105 Z"
            fill="#1E3A8A"
            stroke="#0F172A"
            strokeWidth="4"
          />
          <path
            d="M 120 105 C 135 110 145 100 140 85 C 130 75 115 90 120 105 Z"
            fill="#2563EB"
            stroke="#0F172A"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <path
            d="M 68 68 C 95 68 135 85 130 125 C 125 155 95 165 75 165 C 60 165 52 145 55 120 C 55 95 60 68 68 68 Z"
            fill="#FB923C"
            stroke="#0F172A"
            strokeWidth="4"
          />
          <path
            d="M 75 98 C 95 98 125 108 120 138 C 115 160 90 165 75 165 C 65 165 60 150 60 130 C 60 115 65 98 75 98 Z"
            fill="#FFFFFF"
            stroke="#0F172A"
            strokeWidth="3"
          />
          <path
            d="M 52 60 C 48 60 45 64 45 68 C 45 72 52 78 52 78 C 52 78 59 72 59 68 C 59 64 56 60 52 60 Z"
            fill="#38BDF8"
            stroke="#0F172A"
            strokeWidth="2"
          />
          <path d="M 64 56 L 82 64" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M 122 56 L 104 64" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" />
          <ellipse
            cx="76"
            cy="76"
            rx="13"
            ry="16"
            fill="#FFFFFF"
            stroke="#0F172A"
            strokeWidth="3.5"
          />
          <ellipse cx="76" cy="78" rx="7.5" ry="9.5" fill="#0F172A" />
          <circle cx="79" cy="74" r="3" fill="#FFFFFF" />
          <ellipse
            cx="112"
            cy="76"
            rx="13"
            ry="16"
            fill="#FFFFFF"
            stroke="#0F172A"
            strokeWidth="3.5"
          />
          <ellipse cx="112" cy="78" rx="7.5" ry="9.5" fill="#0F172A" />
          <circle cx="115" cy="74" r="3" fill="#FFFFFF" />
          <path
            d="M 88 90 C 94 98 100 98 106 90 Z"
            fill="#FBBF24"
            stroke="#0F172A"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          <g id="warning-sign" transform="translate(130, 45)">
            <line
              x1="25"
              y1="50"
              x2="25"
              y2="110"
              stroke="#0F172A"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <polygon
              points="25,5 55,55 5,55"
              fill="#FACC15"
              stroke="#0F172A"
              strokeWidth="4"
              strokeLinejoin="round"
            />
            <line
              x1="25"
              y1="20"
              x2="25"
              y2="38"
              stroke="#0F172A"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle cx="25" cy="46" r="2.5" fill="#0F172A" />
          </g>
          <path
            d="M 75 165 L 70 178 M 75 165 L 75 180 M 75 165 L 80 178"
            stroke="#0F172A"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <path
            d="M 105 163 L 100 176 M 105 163 L 105 178 M 105 163 L 110 176"
            stroke="#0F172A"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </g>
      </svg>
    );
  }

  // Default Standard state
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      style={{ width: dimension, height: 'auto' }}
      className={`inline-block ${className}`}
    >
      <g id="goli-mascot-standard">
        <path
          d="M 60 145 L 20 175 L 55 130 L 25 115 L 65 110 Z"
          fill="#1E293B"
          stroke="#0F172A"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M 45 105 C 30 75 35 40 75 35 C 130 30 155 70 150 110 C 145 145 115 165 80 165 C 55 165 45 140 45 105 Z"
          fill="#1E3A8A"
          stroke="#0F172A"
          strokeWidth="4"
        />
        <path
          d="M 50 110 C 30 120 20 100 30 85 C 40 75 52 90 50 110 Z"
          fill="#2563EB"
          stroke="#0F172A"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M 130 95 C 152 80 178 55 188 40 C 182 62 170 85 145 110 C 138 115 132 105 130 95 Z"
          fill="#2563EB"
          stroke="#0F172A"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path
          d="M 68 68 C 95 68 135 85 130 125 C 125 155 95 165 75 165 C 60 165 52 145 55 120 C 55 95 60 68 68 68 Z"
          fill="#FB923C"
          stroke="#0F172A"
          strokeWidth="4"
        />
        <path
          d="M 75 98 C 95 98 125 108 120 138 C 115 160 90 165 75 165 C 65 165 60 150 60 130 C 60 115 65 98 75 98 Z"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="3"
        />
        <ellipse cx="63" cy="92" rx="9" ry="6" fill="#F472B6" opacity="0.6" />
        <ellipse cx="122" cy="92" rx="9" ry="6" fill="#F472B6" opacity="0.6" />
        <ellipse
          cx="76"
          cy="74"
          rx="13"
          ry="17"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="3.5"
        />
        <ellipse cx="78" cy="74" rx="7.5" ry="10.5" fill="#0F172A" />
        <circle cx="81" cy="69" r="3.5" fill="#FFFFFF" />
        <circle cx="76" cy="79" r="1.5" fill="#FFFFFF" />
        <ellipse
          cx="112"
          cy="74"
          rx="13"
          ry="17"
          fill="#FFFFFF"
          stroke="#0F172A"
          strokeWidth="3.5"
        />
        <ellipse cx="110" cy="74" rx="7.5" ry="10.5" fill="#0F172A" />
        <circle cx="113" cy="69" r="3.5" fill="#FFFFFF" />
        <circle cx="108" cy="79" r="1.5" fill="#FFFFFF" />
        <path
          d="M 86 85 L 102 85 L 94 101 Z"
          fill="#FBBF24"
          stroke="#0F172A"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M 75 165 L 70 178 M 75 165 L 75 180 M 75 165 L 80 178"
          stroke="#0F172A"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path
          d="M 105 163 L 100 176 M 105 163 L 105 178 M 105 163 L 110 176"
          stroke="#0F172A"
          strokeWidth="4"
          stroke-linecap="round"
        />
      </g>
    </svg>
  );
};
