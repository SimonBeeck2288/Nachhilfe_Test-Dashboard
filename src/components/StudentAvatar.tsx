import React from 'react';
import type { AvatarConfig } from '../types/gamification';

interface StudentAvatarProps {
  config?: AvatarConfig;
  size?: 'sm' | 'md' | 'lg' | number;
  className?: string;
  onClick?: () => void;
}

export const StudentAvatar: React.FC<StudentAvatarProps> = ({
  config = { hatId: 'none', petId: 'none', themeId: 'default' },
  size = 'md',
  className = '',
  onClick,
}) => {
  // Determine pixel size
  let pxSize = 120;
  if (typeof size === 'number') {
    pxSize = size;
  } else if (size === 'sm') {
    pxSize = 64;
  } else if (size === 'lg') {
    pxSize = 180;
  }

  const { hatId, petId, themeId } = config;

  // Theme background styles
  const getThemeStyle = () => {
    switch (themeId) {
      case 'space':
        return {
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #311042 100%)',
          borderColor: '#a855f7',
          boxShadow: '0 0 15px rgba(168, 85, 247, 0.4)',
        };
      case 'jungle':
        return {
          background: 'linear-gradient(135deg, #064e3b 0%, #047857 50%, #10b981 100%)',
          borderColor: '#34d399',
          boxShadow: '0 0 15px rgba(52, 211, 153, 0.4)',
        };
      case 'neon':
        return {
          background: 'linear-gradient(135deg, #18181b 0%, #27272a 50%, #3f3f46 100%)',
          borderColor: '#06b6d4',
          boxShadow: '0 0 18px rgba(6, 182, 212, 0.6)',
        };
      case 'gold':
        return {
          background: 'linear-gradient(135deg, #78350f 0%, #b45309 50%, #f59e0b 100%)',
          borderColor: '#fbbf24',
          boxShadow: '0 0 20px rgba(251, 191, 36, 0.6)',
        };
      case 'default':
      default:
        return {
          background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #60a5fa 100%)',
          borderColor: '#93c5fd',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
        };
    }
  };

  const themeStyle = getThemeStyle();

  return (
    <div
      className={`student-avatar-container ${className}`}
      onClick={onClick}
      style={{
        width: pxSize,
        height: pxSize,
        borderRadius: '50%',
        padding: pxSize * 0.05,
        border: `${Math.max(2, pxSize * 0.03)}px solid ${themeStyle.borderColor}`,
        background: themeStyle.background,
        boxShadow: themeStyle.boxShadow,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        userSelect: 'none',
      }}
      title="Schüler-Avatar"
    >
      <svg
        viewBox="0 0 200 200"
        style={{
          width: '100%',
          height: '100%',
          overflow: 'visible',
        }}
      >
        {/* Background Sparkles for Gold / Neon / Space */}
        {themeId === 'space' && (
          <g fill="#ffffff" opacity="0.6">
            <circle cx="20" cy="30" r="2" />
            <circle cx="170" cy="40" r="3" />
            <circle cx="180" cy="150" r="1.5" />
            <circle cx="30" cy="160" r="2.5" />
          </g>
        )}
        {themeId === 'gold' && (
          <g fill="#fef08a" opacity="0.7">
            <polygon points="25,25 28,33 36,33 30,38 32,46 25,41 18,46 20,38 14,33 22,33" transform="scale(0.5)" />
            <polygon points="320,80 323,88 331,88 325,93 327,101 320,96 313,101 315,93 309,88 317,88" transform="scale(0.5)" />
          </g>
        )}

        {/* Base Body / Shoulders */}
        <path
          d="M 45 180 Q 100 130 155 180 L 160 200 L 40 200 Z"
          fill="#3b82f6"
          stroke="#1d4ed8"
          strokeWidth="3"
        />

        {/* Shirt Collar / Detail */}
        <polygon points="85,150 100,170 115,150" fill="#ffffff" opacity="0.9" />

        {/* Head Base */}
        <circle cx="100" cy="95" r="45" fill="#fde047" stroke="#eab308" strokeWidth="3" />

        {/* Hair */}
        <path
          d="M 55 90 Q 50 55 100 50 Q 150 55 145 90 Q 130 65 100 65 Q 70 65 55 90 Z"
          fill="#78350f"
        />

        {/* Eyes */}
        <ellipse cx="82" cy="90" rx="5" ry="7" fill="#1e293b" />
        <ellipse cx="118" cy="90" rx="5" ry="7" fill="#1e293b" />
        {/* Eye Catchlights */}
        <circle cx="80" cy="88" r="2" fill="#ffffff" />
        <circle cx="116" cy="88" r="2" fill="#ffffff" />

        {/* Rosy Cheeks */}
        <ellipse cx="73" cy="102" rx="6" ry="4" fill="#f43f5e" opacity="0.4" />
        <ellipse cx="127" cy="102" rx="6" ry="4" fill="#f43f5e" opacity="0.4" />

        {/* Smile */}
        <path
          d="M 85 108 Q 100 122 115 108"
          fill="none"
          stroke="#1e293b"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* HATS OVERLAY */}
        {(hatId === 'cap' || hatId === 'cap_hat') && (
          <g id="hat-cap">
            {/* Baseball Cap visor & dome */}
            <path d="M 50 65 C 50 40 150 40 150 65 Z" fill="#ef4444" stroke="#b91c1c" strokeWidth="3" />
            <path d="M 40 65 C 40 60 160 60 160 65 L 140 70 L 60 70 Z" fill="#dc2626" />
            <circle cx="100" cy="40" r="4" fill="#fef08a" />
          </g>
        )}

        {(hatId === 'wizard_hat' || hatId === 'wizard') && (
          <g id="hat-wizard">
            {/* Wizard Cone */}
            <polygon points="100,5 60,60 140,60" fill="#6366f1" stroke="#4338ca" strokeWidth="3" />
            {/* Brim */}
            <ellipse cx="100" cy="60" rx="50" ry="10" fill="#4f46e5" stroke="#3730a3" strokeWidth="2" />
            {/* Stars on Hat */}
            <path d="M 100 20 L 102 26 L 108 26 L 103 30 L 105 36 L 100 32 L 95 36 L 97 30 L 92 26 L 98 26 Z" fill="#fef08a" />
            <circle cx="85" cy="45" r="3" fill="#fef08a" />
            <circle cx="115" cy="40" r="2.5" fill="#fef08a" />
          </g>
        )}

        {(hatId === 'grad_cap' || hatId === 'grad') && (
          <g id="hat-grad">
            {/* Graduation Cap Board */}
            <polygon points="100,25 155,42 100,58 45,42" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
            {/* Cap Base */}
            <path d="M 70 48 L 70 60 Q 100 70 130 60 L 130 48 Z" fill="#334155" />
            {/* Tassel */}
            <circle cx="100" cy="42" r="3" fill="#f59e0b" />
            <path d="M 100 42 Q 130 45 135 65" fill="none" stroke="#f59e0b" strokeWidth="2" />
            <circle cx="135" cy="67" r="4" fill="#f59e0b" />
          </g>
        )}

        {(hatId === 'crown' || hatId === 'crown_hat') && (
          <g id="hat-crown">
            {/* Golden Crown */}
            <polygon points="55,60 65,30 82,45 100,20 118,45 135,30 145,60" fill="#f59e0b" stroke="#d97706" strokeWidth="3" />
            <rect x="55" y="58" width="90" height="8" rx="2" fill="#d97706" />
            {/* Jewels */}
            <circle cx="65" cy="30" r="3" fill="#ef4444" />
            <circle cx="100" cy="20" r="4" fill="#3b82f6" />
            <circle cx="135" cy="30" r="3" fill="#10b981" />
          </g>
        )}

        {/* PETS OVERLAY (Bottom Right or Side) */}
        {(petId === 'cat' || petId === 'cat_pet') && (
          <g id="pet-cat" transform="translate(130, 120)">
            {/* Cat Head */}
            <circle cx="25" cy="25" r="18" fill="#f97316" stroke="#c2410c" strokeWidth="2" />
            {/* Cat Ears */}
            <polygon points="12,12 10,0 20,8" fill="#ea580c" />
            <polygon points="38,12 40,0 30,8" fill="#ea580c" />
            {/* Eyes */}
            <ellipse cx="19" cy="22" rx="2.5" ry="3.5" fill="#15803d" />
            <ellipse cx="31" cy="22" rx="2.5" ry="3.5" fill="#15803d" />
            {/* Nose & Whiskers */}
            <polygon points="25,27 23,25 27,25" fill="#f43f5e" />
            <line x1="8" y1="26" x2="16" y2="27" stroke="#7c2d12" strokeWidth="1.5" />
            <line x1="42" y1="26" x2="34" y2="27" stroke="#7c2d12" strokeWidth="1.5" />
          </g>
        )}

        {(petId === 'owl' || petId === 'owl_pet') && (
          <g id="pet-owl" transform="translate(130, 118)">
            {/* Owl Body */}
            <ellipse cx="25" cy="28" rx="16" ry="20" fill="#78350f" stroke="#451a03" strokeWidth="2" />
            {/* Owl Belly */}
            <ellipse cx="25" cy="32" rx="10" ry="12" fill="#fef3c7" />
            {/* Huge Glasses / Eyes */}
            <circle cx="17" cy="20" r="8" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
            <circle cx="33" cy="20" r="8" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
            <circle cx="17" cy="20" r="3" fill="#0f172a" />
            <circle cx="33" cy="20" r="3" fill="#0f172a" />
            {/* Beak */}
            <polygon points="25,24 22,29 28,29" fill="#f59e0b" />
          </g>
        )}

        {(petId === 'robot' || petId === 'robot_pet') && (
          <g id="pet-robot" transform="translate(130, 120)">
            {/* Robot Head */}
            <rect x="8" y="10" width="34" height="30" rx="6" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
            {/* Antenna */}
            <line x1="25" y1="10" x2="25" y2="2" stroke="#475569" strokeWidth="2" />
            <circle cx="25" cy="2" r="3" fill="#ef4444" />
            {/* Visor Screen */}
            <rect x="14" y="18" width="22" height="10" rx="3" fill="#06b6d4" />
            {/* Digital Eyes */}
            <circle cx="19" cy="23" r="2" fill="#ffffff" />
            <circle cx="31" cy="23" r="2" fill="#ffffff" />
          </g>
        )}

        {(petId === 'dragon' || petId === 'dragon_pet') && (
          <g id="pet-dragon" transform="translate(125, 115)">
            {/* Dragon Head */}
            <path d="M 10 35 C 10 15 35 10 40 25 C 45 35 35 45 20 40 Z" fill="#10b981" stroke="#047857" strokeWidth="2" />
            {/* Horns */}
            <polygon points="18,16 12,5 24,12" fill="#fbbf24" />
            <polygon points="28,14 26,2 34,10" fill="#fbbf24" />
            {/* Eye */}
            <circle cx="28" cy="22" r="4" fill="#fef08a" />
            <ellipse cx="28" cy="22" rx="1.5" ry="3" fill="#0f172a" />
            {/* Flame Puff */}
            <circle cx="8" cy="38" r="4" fill="#f97316" opacity="0.8" />
            <circle cx="3" cy="41" r="2.5" fill="#ef4444" opacity="0.8" />
          </g>
        )}
      </svg>
    </div>
  );
};
