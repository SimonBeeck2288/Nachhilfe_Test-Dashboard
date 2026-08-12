import React, { useState, useEffect } from 'react';
import {
  X,
  Copy,
  ExternalLink,
  Sparkles,
  GraduationCap,
  Lightbulb,
  FilePlus,
  Check,
  Bot,
} from 'lucide-react';
import {
  generateGeminiPrompt,
  buildGeminiGemUrl,
  buildChatGPTUrl,
  buildHuggingChatUrl,
  type PromptMode,
  type AiPromptContext,
} from '../utils/aiPromptGenerator';

export interface AiPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: AiPromptContext;
  initialMode?: PromptMode;
}

interface ModeOption {
  id: PromptMode;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string; color?: string }>;
  description: string;
}

const MODES: ModeOption[] = [
  {
    id: 'socratic',
    label: 'Sokratische Hilfestellung',
    shortLabel: 'Sokratisch',
    icon: GraduationCap,
    description: 'Schritt-für-Schritt Hinführung ohne direkte Lösungsabgabe',
  },
  {
    id: 'personalized',
    label: 'Personalisierte Erklärung',
    shortLabel: 'Personalisiert',
    icon: Lightbulb,
    description: 'Erklärung mit Metaphern aus Schüler-Hobbys & Interessen',
  },
  {
    id: 'practice_tasks',
    label: '3 Neue Übungsaufgaben',
    shortLabel: 'Übungsaufgaben',
    icon: FilePlus,
    description: 'Generierung von 3 neuen Aufgaben inkl. Musterlösungen',
  },
];

export const AiPromptModal: React.FC<AiPromptModalProps> = ({
  isOpen,
  onClose,
  context,
  initialMode = 'socratic',
}) => {
  const [activeMode, setActiveMode] = useState<PromptMode>(initialMode);
  const [promptText, setPromptText] = useState<string>(() =>
    generateGeminiPrompt(initialMode || 'socratic', context)
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Synchronize active mode & prompt text when modal opens or initialMode/context changes
  useEffect(() => {
    if (isOpen) {
      const modeToUse = initialMode || 'socratic';
      setActiveMode(modeToUse);
      setPromptText(generateGeminiPrompt(modeToUse, context));
      setToastMessage(null);
      setIsCopied(false);
    }
  }, [isOpen, initialMode, context]);

  // Handle ESC keyboard shortcut
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleModeTabClick = (mode: PromptMode) => {
    setActiveMode(mode);
    setPromptText(generateGeminiPrompt(mode, context));
    setIsCopied(false);
  };

  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (err) {
      console.warn('Clipboard writeText failed:', err);
    }
    return false;
  };

  const handleOpenGeminiSidecar = async () => {
    // 1. Copy current prompt text from textarea to clipboard
    await copyToClipboard(promptText);

    // 2. Open Gemini Gem in sidecar window (480x750)
    const gemUrl = buildGeminiGemUrl();
    window.open(gemUrl, '_blank', 'width=480,height=750,resizable=yes,scrollbars=yes');

    // 3. Feedback Toast
    setIsCopied(true);
    setToastMessage('Prompt in Zwischenablage kopiert & Gemini Gem geöffnet!');
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  const handleCopyOnly = async () => {
    await copyToClipboard(promptText);
    setIsCopied(true);
    setToastMessage('Prompt erfolgreich in die Zwischenablage kopiert!');
    setTimeout(() => {
      setToastMessage(null);
      setIsCopied(false);
    }, 3500);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: '1rem',
      }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-prompt-modal-title"
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          position: 'relative',
          padding: '1.5rem',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Feedback Notification Banner */}
        {toastMessage && (
          <div
            style={{
              position: 'absolute',
              top: '1rem',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1100,
              backgroundColor: '#10B981',
              color: '#FFFFFF',
              padding: '0.6rem 1.2rem',
              borderRadius: '24px',
              fontSize: '0.88rem',
              fontWeight: 600,
              boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              maxWidth: '90%',
              textAlign: 'center',
              animation: 'fadeIn 0.2s ease-in-out',
            }}
          >
            <Check size={18} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            borderBottom: '1px solid var(--border, #E2E8F0)',
            paddingBottom: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
              }}
            >
              <Bot size={22} />
            </div>
            <div>
              <h2
                id="ai-prompt-modal-title"
                style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#1E293B' }}
              >
                KI-Tutor Assistenz (Gemini Gem Sidecar)
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>
                Generiere maßgeschneiderte Prompts & öffne den NachhilfeTest Gemini Gem im Sidecar Window.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Schließen"
            data-testid="modal-close-button"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
              padding: '0.35rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Schließen (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabbed Mode Selector */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '0.5rem',
            marginBottom: '1rem',
            backgroundColor: '#F1F5F9',
            padding: '0.35rem',
            borderRadius: '10px',
          }}
        >
          {MODES.map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;

            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleModeTabClick(mode.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  padding: '0.6rem 0.5rem',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                  color: isActive ? '#2563EB' : '#475569',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={16} color={isActive ? '#2563EB' : '#64748B'} />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Mode Description */}
        <div
          style={{
            fontSize: '0.82rem',
            color: '#475569',
            backgroundColor: '#F8FAFC',
            padding: '0.5rem 0.75rem',
            borderRadius: '6px',
            marginBottom: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.4rem',
            border: '1px solid #E2E8F0',
          }}
        >
          <Sparkles size={14} color="#2563EB" />
          <span>
            {MODES.find((m) => m.id === activeMode)?.description}
          </span>
        </div>

        {/* Editable Prompt Preview Textarea */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: '220px',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '0.35rem',
            }}
          >
            <label
              htmlFor="ai-prompt-preview"
              style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}
            >
              Prompt-Vorschau (direkt anpassbar):
            </label>
            <button
              type="button"
              onClick={handleCopyOnly}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563EB',
                fontSize: '0.78rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.2rem 0.4rem',
                borderRadius: '4px',
              }}
            >
              {isCopied ? <Check size={14} /> : <Copy size={14} />}
              {isCopied ? 'Kopiert!' : 'Text kopieren'}
            </button>
          </div>
          <textarea
            id="ai-prompt-preview"
            className="input"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            rows={10}
            style={{
              width: '100%',
              flex: 1,
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #CBD5E1',
              fontSize: '0.85rem',
              fontFamily: 'monospace, sans-serif',
              lineHeight: 1.45,
              color: '#1E293B',
              backgroundColor: '#FAFAFA',
              resize: 'vertical',
              outline: 'none',
            }}
          />
        </div>

        {/* Action Buttons & Sidecar Launcher */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.75rem',
            borderTop: '1px solid #E2E8F0',
            paddingTop: '1rem',
          }}
        >
          {/* Primary Action Button */}
          <button
            type="button"
            onClick={handleOpenGeminiSidecar}
            style={{
              width: '100%',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            <Sparkles size={18} />
            <span>NachhilfeTest Gem öffnen (Sidecar)</span>
            <ExternalLink size={16} />
          </button>

          {/* Secondary Action Links: ChatGPT & HuggingChat */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.5rem',
              fontSize: '0.8rem',
              color: '#64748B',
            }}
          >
            <span>Alternative KI-Tools öffnen:</span>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a
                href={buildChatGPTUrl(promptText)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#10A37F',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: '0.78rem',
                }}
              >
                ChatGPT <ExternalLink size={12} />
              </a>
              <a
                href={buildHuggingChatUrl(promptText)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.35rem 0.65rem',
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#D97706',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: '0.78rem',
                }}
              >
                HuggingChat <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
