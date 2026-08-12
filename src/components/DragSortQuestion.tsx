import React, { useState, useEffect } from 'react';
import { Send, FastForward, RotateCcw, GripVertical, ArrowLeft, ArrowRight } from 'lucide-react';

interface DragSortQuestionProps {
  items: string[];
  onAnswerSubmit: (answer: string) => void;
  onSkip?: () => void;
}

export const DragSortQuestion: React.FC<DragSortQuestionProps> = ({
  items,
  onAnswerSubmit,
  onSkip,
}) => {
  const [currentOrder, setCurrentOrder] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    setCurrentOrder([...items]);
    setSelectedIndex(null);
    setDraggedIndex(null);
  }, [items]);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, _index: number) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    const updated = [...currentOrder];
    const [movedItem] = updated.splice(draggedIndex, 1);
    updated.splice(dropIndex, 0, movedItem);
    setCurrentOrder(updated);
    setDraggedIndex(null);
  };

  const handleItemClick = (index: number) => {
    if (selectedIndex === null) {
      setSelectedIndex(index);
    } else if (selectedIndex === index) {
      setSelectedIndex(null);
    } else {
      // Swap selectedIndex and index
      const updated = [...currentOrder];
      const temp = updated[selectedIndex];
      updated[selectedIndex] = updated[index];
      updated[index] = temp;
      setCurrentOrder(updated);
      setSelectedIndex(null);
    }
  };

  const moveItem = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentOrder.length) return;
    const updated = [...currentOrder];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setCurrentOrder(updated);
    setSelectedIndex(null);
  };

  const handleReset = () => {
    setCurrentOrder([...items]);
    setSelectedIndex(null);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    onAnswerSubmit(currentOrder.join(' '));
  };

  return (
    <div className="drag-sort-container" style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '1rem', textAlign: 'center' }}>
        💡 Ziehe die Bausteine per Drag & Drop oder klicke zwei Bausteine nacheinander an, um sie zu tauschen.
      </div>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.75rem',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '1.25rem',
          backgroundColor: '#F8FAFC',
          border: '2px dashed #CBD5E1',
          borderRadius: '12px',
          minHeight: '80px',
          marginBottom: '1.5rem',
        }}
      >
        {currentOrder.map((word, idx) => {
          const isSelected = selectedIndex === idx;
          const isBeingDragged = draggedIndex === idx;

          return (
            <div
              key={`ds_${idx}_${word}`}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDrop={() => handleDrop(idx)}
              onClick={() => handleItemClick(idx)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.6rem 0.9rem',
                backgroundColor: isSelected ? '#4F46E5' : '#FFFFFF',
                color: isSelected ? '#FFFFFF' : '#1E293B',
                border: isSelected ? '2px solid #4338CA' : '1.5px solid #E2E8F0',
                borderRadius: '8px',
                boxShadow: isSelected
                  ? '0 4px 12px rgba(79, 70, 229, 0.3)'
                  : '0 2px 4px rgba(0, 0, 0, 0.05)',
                cursor: 'grab',
                opacity: isBeingDragged ? 0.5 : 1,
                userSelect: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <GripVertical size={16} style={{ opacity: 0.5 }} />
              <span style={{ fontWeight: 600, fontSize: '1rem' }}>{word}</span>
              <div style={{ display: 'inline-flex', gap: '2px', marginLeft: '0.25rem' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveItem(idx, 'left');
                  }}
                  disabled={idx === 0}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: idx === 0 ? 'default' : 'pointer',
                    opacity: idx === 0 ? 0.2 : 0.7,
                    padding: '1px',
                    color: isSelected ? '#FFF' : '#64748B',
                  }}
                  title="Nach links verschieben"
                >
                  <ArrowLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    moveItem(idx, 'right');
                  }}
                  disabled={idx === currentOrder.length - 1}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: idx === currentOrder.length - 1 ? 'default' : 'pointer',
                    opacity: idx === currentOrder.length - 1 ? 0.2 : 0.7,
                    padding: '1px',
                    color: isSelected ? '#FFF' : '#64748B',
                  }}
                  title="Nach rechts verschieben"
                >
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={handleReset}
          style={{ fontSize: '0.9rem', gap: '0.35rem' }}
        >
          <RotateCcw size={16} />
          Zurücksetzen
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => handleSubmit()}
          style={{ fontSize: '1rem', padding: '0.75rem 1.5rem', gap: '0.5rem' }}
        >
          <Send size={18} />
          Bestätigen
        </button>
        {onSkip && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onSkip}
            style={{ color: 'var(--text-muted)', fontSize: '0.9rem', gap: '0.35rem' }}
          >
            <FastForward size={16} />
            Überspringen
          </button>
        )}
      </div>
    </div>
  );
};

export default DragSortQuestion;
