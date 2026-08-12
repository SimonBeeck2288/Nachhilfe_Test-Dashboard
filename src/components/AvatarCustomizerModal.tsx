import React, { useState } from 'react';
import { useTestSession } from '../context/TestSessionContext';
import { ACCESSORIES } from '../data/accessories';
import { StudentAvatar } from './StudentAvatar';
import type { AccessoryItem, AvatarConfig } from '../types/gamification';
import { X, Lock, Check, Award } from 'lucide-react';

interface AvatarCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AvatarCustomizerModal: React.FC<AvatarCustomizerModalProps> = ({ isOpen, onClose }) => {
  const { state, updateAvatarConfig, unlockAccessory } = useTestSession();
  const [activeCategory, setActiveCategory] = useState<'hat' | 'pet' | 'theme'>('hat');

  if (!isOpen) return null;

  const currentConfig: AvatarConfig = state.avatarConfig || {
    hatId: 'none',
    petId: 'none',
    themeId: 'default',
  };

  const unlockedIds = state.unlockedAccessories || ['none_hat', 'none_pet', 'default'];
  const userPoints = state.points || 0;

  const filteredItems = ACCESSORIES.filter((item) => item.category === activeCategory);

  const handleSelect = (item: AccessoryItem) => {
    const isUnlocked = unlockedIds.includes(item.id) || item.requiredPoints === 0;

    if (!isUnlocked) {
      if (userPoints >= item.requiredPoints) {
        unlockAccessory(item.id);
        applyConfig(item);
      }
      return;
    }

    applyConfig(item);
  };

  const applyConfig = (item: AccessoryItem) => {
    const newConfig: AvatarConfig = { ...currentConfig };
    if (item.category === 'hat') {
      newConfig.hatId = item.id;
    } else if (item.category === 'pet') {
      newConfig.petId = item.id;
    } else if (item.category === 'theme') {
      newConfig.themeId = item.id;
    }
    updateAvatarConfig(newConfig);
  };

  const isEquipped = (item: AccessoryItem) => {
    if (item.category === 'hat') return currentConfig.hatId === item.id;
    if (item.category === 'pet') return currentConfig.petId === item.id;
    if (item.category === 'theme') return currentConfig.themeId === item.id;
    return false;
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--surface, #ffffff)',
          color: 'var(--text-color, #1e293b)',
          borderRadius: '1.25rem',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
          overflow: 'hidden',
          border: '1px solid var(--border, #e2e8f0)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-color, #f8fafc)',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700 }}>Avatar Anpassen</h2>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
              Schalte Hüte, Begleiter und Themen frei!
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#fef3c7',
                color: '#b45309',
                padding: '0.4rem 0.8rem',
                borderRadius: '2rem',
                fontWeight: 700,
                fontSize: '0.9rem',
              }}
            >
              <Award size={18} color="#d97706" />
              <span>{userPoints} Punkte</span>
            </div>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.4rem',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
              }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Modal Body: Left preview, Right customizer */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 2fr',
            flex: 1,
            minHeight: 0,
          }}
        >
          {/* Left Preview */}
          <div
            style={{
              padding: '1.5rem',
              borderRight: '1px solid var(--border, #e2e8f0)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '1rem',
              background: 'var(--bg-color, #f8fafc)',
            }}
          >
            <StudentAvatar config={currentConfig} size={150} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{state.studentName || 'Dein Avatar'}</div>
              <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.2rem' }}>
                Vorschau des aktuellen Stils
              </div>
            </div>
          </div>

          {/* Right Selector */}
          <div
            style={{
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              overflowY: 'auto',
            }}
          >
            {/* Category Tabs */}
            <div
              style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1rem',
                borderBottom: '1px solid var(--border, #e2e8f0)',
                paddingBottom: '0.5rem',
              }}
            >
              <button
                onClick={() => setActiveCategory('hat')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeCategory === 'hat' ? '#3b82f6' : 'transparent',
                  color: activeCategory === 'hat' ? '#ffffff' : '#64748b',
                  transition: 'all 0.2s',
                }}
              >
                Hüte & Mützen
              </button>
              <button
                onClick={() => setActiveCategory('pet')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeCategory === 'pet' ? '#3b82f6' : 'transparent',
                  color: activeCategory === 'pet' ? '#ffffff' : '#64748b',
                  transition: 'all 0.2s',
                }}
              >
                Tier-Begleiter
              </button>
              <button
                onClick={() => setActiveCategory('theme')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                  backgroundColor: activeCategory === 'theme' ? '#3b82f6' : 'transparent',
                  color: activeCategory === 'theme' ? '#ffffff' : '#64748b',
                  transition: 'all 0.2s',
                }}
              >
                Farbe & Thema
              </button>
            </div>

            {/* Items Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                gap: '0.85rem',
              }}
            >
              {filteredItems.map((item) => {
                const unlocked = unlockedIds.includes(item.id) || item.requiredPoints === 0;
                const equipped = isEquipped(item);
                const canAfford = userPoints >= item.requiredPoints;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    style={{
                      border: equipped
                        ? '2px solid #3b82f6'
                        : unlocked
                        ? '1px solid #cbd5e1'
                        : '1px dashed #cbd5e1',
                      borderRadius: '0.75rem',
                      padding: '0.85rem',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: equipped
                        ? '#eff6ff'
                        : unlocked
                        ? '#ffffff'
                        : '#f8fafc',
                      cursor: unlocked || canAfford ? 'pointer' : 'not-allowed',
                      opacity: unlocked || canAfford ? 1 : 0.6,
                      position: 'relative',
                      transition: 'all 0.2s',
                    }}
                  >
                    {equipped && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          backgroundColor: '#3b82f6',
                          color: '#ffffff',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={14} />
                      </div>
                    )}

                    <div style={{ fontSize: '1rem', fontWeight: 600, textAlign: 'center', marginTop: '0.25rem' }}>
                      {item.name}
                    </div>

                    <div style={{ fontSize: '0.75rem', color: '#64748b', textAlign: 'center', margin: '0.4rem 0' }}>
                      {item.description}
                    </div>

                    <div style={{ marginTop: '0.5rem', width: '100%' }}>
                      {equipped ? (
                        <div
                          style={{
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            color: '#2563eb',
                          }}
                        >
                          Aktiv
                        </div>
                      ) : unlocked ? (
                        <button
                          style={{
                            width: '100%',
                            padding: '0.35rem 0.5rem',
                            borderRadius: '0.4rem',
                            border: '1px solid #3b82f6',
                            background: '#ffffff',
                            color: '#2563eb',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Ausrüsten
                        </button>
                      ) : (
                        <button
                          disabled={!canAfford}
                          style={{
                            width: '100%',
                            padding: '0.35rem 0.5rem',
                            borderRadius: '0.4rem',
                            border: 'none',
                            background: canAfford ? '#f59e0b' : '#e2e8f0',
                            color: canAfford ? '#ffffff' : '#94a3b8',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.25rem',
                            cursor: canAfford ? 'pointer' : 'not-allowed',
                          }}
                        >
                          <Lock size={12} />
                          {item.requiredPoints} Pkt.
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
