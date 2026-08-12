import React from 'react';

export interface DiagramData {
  shape: 'right-triangle' | 'triangle' | 'circle' | 'rectangle' | 'parallelogram' | 'trapezoid' | 'cube';
  labels?: Record<string, string | number>;
  unknownVar?: string;
}

interface GeometryDiagramProps {
  text?: string;
  topic?: string;
  diagramData?: DiagramData;
}

export const GeometryDiagram: React.FC<GeometryDiagramProps> = ({ text = '', topic = '', diagramData }) => {
  const lowerText = text.toLowerCase();

  // Determine active shape
  let shape: DiagramData['shape'] | null = diagramData?.shape || null;

  if (!shape) {
    if (lowerText.includes('rechtwinklig') || lowerText.includes('hypotenuse') || lowerText.includes('kathete')) {
      shape = 'right-triangle';
    } else if (lowerText.includes('trapez')) {
      shape = 'trapezoid';
    } else if (lowerText.includes('würfel') || lowerText.includes('quader') || lowerText.includes('kante')) {
      shape = 'cube';
    } else if (lowerText.includes('dreieck') || lowerText.includes('winkel')) {
      shape = 'triangle';
    } else if (lowerText.includes('kreis') || lowerText.includes('radius') || lowerText.includes('umfang in cm')) {
      shape = 'circle';
    } else if (lowerText.includes('parallelogramm')) {
      shape = 'parallelogram';
    } else if (lowerText.includes('rechteck') || lowerText.includes('quadrat') || lowerText.includes('flächeninhalt in cm²')) {
      shape = 'rectangle';
    } else if (topic === 'Geometrie') {
      shape = 'rectangle';
    }
  }

  if (!shape) {
    return null;
  }

  // Extract dimensions from text if diagramData.labels is omitted
  const numbers = text.match(/\d+(?:[.,]\d+)?/g)?.map(n => n.replace(',', '.')) || [];

  const labels = diagramData?.labels || {};
  const dim1 = labels.a ?? labels.g ?? labels.r ?? numbers[0] ?? 'a';
  const dim2 = labels.b ?? labels.h ?? numbers[1] ?? 'b';
  const dim3 = labels.c ?? numbers[2] ?? 'c';

  return (
    <div
      className="geometry-diagram-card fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        marginBottom: '1.5rem',
        backgroundColor: '#F8FAFC',
        border: '1px solid #E2E8F0',
        borderRadius: '12px',
        boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)'
      }}
    >
      {/* 1. RIGHT-ANGLED TRIANGLE */}
      {shape === 'right-triangle' && (
        <svg width="220" height="150" viewBox="0 0 220 150" style={{ overflow: 'visible' }}>
          <polygon points="40,120 180,120 40,30" fill="rgba(79, 70, 229, 0.08)" stroke="#4F46E5" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M 40,105 L 55,105 L 55,120" fill="none" stroke="#6366F1" strokeWidth="1.5" />
          <circle cx="47" cy="113" r="2" fill="#6366F1" />
          <text x="30" y="132" fontSize="13" fontWeight="bold" fill="#334155">A</text>
          <text x="188" y="132" fontSize="13" fontWeight="bold" fill="#334155">B</text>
          <text x="30" y="22" fontSize="13" fontWeight="bold" fill="#334155">C</text>
          <text x="15" y="80" fontSize="12" fill="#4F46E5" fontWeight="600">a = {dim1} cm</text>
          <text x="105" y="138" fontSize="12" fill="#4F46E5" fontWeight="600">b = {dim2} cm</text>
          <text x="118" y="70" fontSize="12" fill="#10B981" fontWeight="bold">c (Hypotenuse)</text>
        </svg>
      )}

      {/* 2. GENERAL TRIANGLE */}
      {shape === 'triangle' && (
        <svg width="220" height="150" viewBox="0 0 220 150" style={{ overflow: 'visible' }}>
          <polygon points="30,120 190,120 120,30" fill="rgba(79, 70, 229, 0.08)" stroke="#4F46E5" strokeWidth="2.5" strokeLinejoin="round" />
          <line x1="120" y1="30" x2="120" y2="120" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 3" />
          <path d="M 120,110 L 130,110 L 130,120" fill="none" stroke="#EF4444" strokeWidth="1" />
          <text x="18" y="132" fontSize="13" fontWeight="bold" fill="#334155">A</text>
          <text x="198" y="132" fontSize="13" fontWeight="bold" fill="#334155">B</text>
          <text x="118" y="20" fontSize="13" fontWeight="bold" fill="#334155">C</text>
          <text x="105" y="138" fontSize="12" fill="#4F46E5" fontWeight="600">g = {dim1} cm</text>
          <text x="125" y="78" fontSize="12" fill="#EF4444" fontWeight="600">h = {dim2} cm</text>
        </svg>
      )}

      {/* 3. CIRCLE */}
      {shape === 'circle' && (
        <svg width="180" height="150" viewBox="0 0 180 150" style={{ overflow: 'visible' }}>
          <circle cx="90" cy="75" r="55" fill="rgba(16, 185, 129, 0.08)" stroke="#10B981" strokeWidth="2.5" />
          <circle cx="90" cy="75" r="4" fill="#059669" />
          <line x1="90" y1="75" x2="145" y2="75" stroke="#059669" strokeWidth="2" strokeDasharray="3 2" />
          <text x="108" y="68" fontSize="12" fill="#047857" fontWeight="bold">r = {dim1} cm</text>
          <text x="82" y="93" fontSize="11" fill="#6B7280">M</text>
        </svg>
      )}

      {/* 4. RECTANGLE / SQUARE */}
      {shape === 'rectangle' && (
        <svg width="220" height="130" viewBox="0 0 220 130" style={{ overflow: 'visible' }}>
          <rect x="30" y="25" width="160" height="80" rx="4" fill="rgba(79, 70, 229, 0.08)" stroke="#4F46E5" strokeWidth="2.5" />
          <text x="100" y="120" fontSize="12" fill="#4F46E5" fontWeight="600">a = {dim1} cm</text>
          <text x="198" y="70" fontSize="12" fill="#4F46E5" fontWeight="600">b = {dim2} cm</text>
        </svg>
      )}

      {/* 5. PARALLELOGRAM */}
      {shape === 'parallelogram' && (
        <svg width="220" height="130" viewBox="0 0 220 130" style={{ overflow: 'visible' }}>
          <polygon points="50,100 190,100 170,30 30,30" fill="rgba(79, 70, 229, 0.08)" stroke="#4F46E5" strokeWidth="2.5" strokeLinejoin="round" />
          <line x1="60" y1="30" x2="60" y2="100" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="110" y="118" fontSize="12" fill="#4F46E5" fontWeight="600">g = {dim1} cm</text>
          <text x="65" y="70" fontSize="12" fill="#EF4444" fontWeight="600">h = {dim2} cm</text>
        </svg>
      )}

      {/* 6. TRAPEZOID */}
      {shape === 'trapezoid' && (
        <svg width="220" height="140" viewBox="0 0 220 140" style={{ overflow: 'visible' }}>
          <polygon points="30,110 190,110 150,35 70,35" fill="rgba(79, 70, 229, 0.08)" stroke="#4F46E5" strokeWidth="2.5" strokeLinejoin="round" />
          <line x1="70" y1="35" x2="70" y2="110" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="100" y="25" fontSize="12" fill="#4F46E5" fontWeight="600">a = {dim1} cm</text>
          <text x="100" y="128" fontSize="12" fill="#4F46E5" fontWeight="600">c = {dim3 !== 'c' ? dim3 : dim1} cm</text>
          <text x="75" y="75" fontSize="12" fill="#EF4444" fontWeight="600">h = {dim2} cm</text>
        </svg>
      )}

      {/* 7. CUBE / CUBOID */}
      {shape === 'cube' && (
        <svg width="200" height="150" viewBox="0 0 200 150" style={{ overflow: 'visible' }}>
          {/* Back face (dashed) */}
          <rect x="70" y="20" width="80" height="80" fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* Connecting hidden edges (dashed) */}
          <line x1="40" y1="130" x2="70" y2="100" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="70" y1="100" x2="150" y2="100" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="70" y1="100" x2="70" y2="20" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
          {/* Front face */}
          <rect x="40" y="50" width="80" height="80" rx="2" fill="rgba(79, 70, 229, 0.08)" stroke="#4F46E5" strokeWidth="2.5" />
          {/* Visible connecting edges */}
          <line x1="40" y1="50" x2="70" y2="20" stroke="#4F46E5" strokeWidth="2.5" />
          <line x1="120" y1="50" x2="150" y2="20" stroke="#4F46E5" strokeWidth="2.5" />
          <line x1="120" y1="130" x2="150" y2="100" stroke="#4F46E5" strokeWidth="2.5" />
          {/* Top & Right outer edges */}
          <line x1="70" y1="20" x2="150" y2="20" stroke="#4F46E5" strokeWidth="2.5" />
          <line x1="150" y1="20" x2="150" y2="100" stroke="#4F46E5" strokeWidth="2.5" />
          {/* Label */}
          <text x="80" y="145" fontSize="12" fill="#4F46E5" fontWeight="600">a = {dim1} cm</text>
        </svg>
      )}

      <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '0.5rem', fontWeight: 500 }}>
        📐 Skizze (nicht maßstabsgetreu)
      </div>
    </div>
  );
};

export default GeometryDiagram;
