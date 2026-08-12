import React from 'react';
import { BADGES } from '../data/accessories';
import { Award, Lock, CheckCircle, Flame, Calculator, Zap, BookOpen, Footprints, Star } from 'lucide-react';
import type { AchievementBadge } from '../types/gamification';

interface AchievementBadgeGridProps {
  unlockedBadgeIds?: string[];
  className?: string;
}

export const AchievementBadgeGrid: React.FC<AchievementBadgeGridProps> = ({
  unlockedBadgeIds = [],
  className = '',
}) => {
  const getBadgeIcon = (iconName: string, isUnlocked: boolean) => {
    const size = 24;
    const color = isUnlocked ? '#f59e0b' : '#94a3b8';

    switch (iconName) {
      case 'Calculator':
        return <Calculator size={size} color={color} />;
      case 'Zap':
        return <Zap size={size} color={color} />;
      case 'Flame':
        return <Flame size={size} color={color} />;
      case 'BookOpen':
        return <BookOpen size={size} color={color} />;
      case 'Footprints':
        return <Footprints size={size} color={color} />;
      case 'Star':
        return <Star size={size} color={color} />;
      default:
        return <Award size={size} color={color} />;
    }
  };

  return (
    <div className={`achievement-badge-grid-container ${className}`}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1rem',
        }}
      >
        {BADGES.map((badge: AchievementBadge) => {
          const isUnlocked = unlockedBadgeIds.includes(badge.id);

          return (
            <div
              key={badge.id}
              style={{
                borderRadius: '0.85rem',
                padding: '1rem',
                border: isUnlocked
                  ? '2px solid #fef08a'
                  : '1px solid var(--border, #e2e8f0)',
                backgroundColor: isUnlocked
                  ? '#fffbeb'
                  : 'var(--surface, #ffffff)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem',
                opacity: isUnlocked ? 1 : 0.65,
                boxShadow: isUnlocked
                  ? '0 4px 12px rgba(245, 158, 11, 0.15)'
                  : 'none',
                position: 'relative',
                transition: 'all 0.2s',
              }}
            >
              {/* Badge Icon Container */}
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  backgroundColor: isUnlocked ? '#fef3c7' : '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getBadgeIcon(badge.icon, isUnlocked)}
              </div>

              {/* Text Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.25rem',
                  }}
                >
                  <h4
                    style={{
                      margin: 0,
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      color: isUnlocked ? '#78350f' : '#334155',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {badge.title}
                  </h4>
                  {isUnlocked ? (
                    <CheckCircle size={16} color="#16a34a" />
                  ) : (
                    <Lock size={14} color="#94a3b8" />
                  )}
                </div>

                <p
                  style={{
                    margin: '0.25rem 0 0 0',
                    fontSize: '0.8rem',
                    color: isUnlocked ? '#92400e' : '#64748b',
                    lineHeight: 1.35,
                  }}
                >
                  {badge.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
