import React, { useState } from 'react';
import { ArrowLeft, Check } from 'lucide-react';

interface CutComparisonProps {
  controlRevealMs?: number;
  variantRevealMs?: number;
  onSelectVariant?: (variant: 'A' | 'B') => void;
}

export const CutComparison: React.FC<CutComparisonProps> = ({
  controlRevealMs = 43000,
  variantRevealMs = 37000,
  onSelectVariant
}) => {
  const [selectedCut, setSelectedCut] = useState<'A' | 'B'>('B');

  const handleSelect = (cut: 'A' | 'B') => {
    setSelectedCut(cut);
    if (onSelectVariant) {
      onSelectVariant(cut);
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Cut Comparison & Timeline Shift
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0 0' }}>
            Synchronized preview of Control Cut A vs Proposed Variant Cut B
          </p>
        </div>

        <span className="badge badge-synthetic">
          SYNTHETIC EDIT PREVIEW
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Control Cut A */}
        <div
          onClick={() => handleSelect('A')}
          style={{
            backgroundColor: selectedCut === 'A' ? 'var(--surface-3)' : 'var(--surface-2)',
            border: `2px solid ${selectedCut === 'A' ? 'var(--muted)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
              Control Cut A
            </span>
            {selectedCut === 'A' && <Check size={16} color="var(--muted)" />}
          </div>

          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
            Reveal Keyframe at <span className="tabular-nums">00:43</span>
          </div>

          {/* Timeline Bar representation */}
          <div style={{ height: '24px', backgroundColor: 'var(--surface-1)', borderRadius: 'var(--radius-sm)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, width: `${(controlRevealMs / 60000) * 100}%`, height: '100%', backgroundColor: 'rgba(141, 151, 159, 0.3)' }} />
            <div style={{ position: 'absolute', left: `${(controlRevealMs / 60000) * 100}%`, top: 0, bottom: 0, width: '4px', backgroundColor: 'var(--muted)' }} />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--muted)', marginTop: '6px', display: 'block' }}>
            Original edit sequence without early reveal
          </span>
        </div>

        {/* Variant Cut B */}
        <div
          onClick={() => handleSelect('B')}
          style={{
            backgroundColor: selectedCut === 'B' ? 'rgba(139, 92, 246, 0.12)' : 'var(--surface-2)',
            border: `2px solid ${selectedCut === 'B' ? 'var(--violet)' : 'var(--border)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--violet-soft)', fontWeight: 700, textTransform: 'uppercase' }}>
              Variant Cut B (Agent Proposal)
            </span>
            {selectedCut === 'B' && <Check size={16} color="var(--violet)" />}
          </div>

          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>Reveal Shifted to <strong className="tabular-nums">00:37</strong></span>
            <span style={{ backgroundColor: 'var(--violet)', color: '#fff', fontSize: '10px', padding: '2px 6px', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <ArrowLeft size={10} /> 6s Earlier
            </span>
          </div>

          {/* Timeline Bar representation */}
          <div style={{ height: '24px', backgroundColor: 'var(--surface-1)', borderRadius: 'var(--radius-sm)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, width: `${(variantRevealMs / 60000) * 100}%`, height: '100%', backgroundColor: 'rgba(139, 92, 246, 0.4)' }} />
            <div style={{ position: 'absolute', left: `${(variantRevealMs / 60000) * 100}%`, top: 0, bottom: 0, width: '4px', backgroundColor: 'var(--violet)' }} />
          </div>
          <span style={{ fontSize: '10px', color: 'var(--violet-soft)', marginTop: '6px', display: 'block' }}>
            Targeted edit to eliminate the 00:37 retention drop cliff
          </span>
        </div>
      </div>
    </div>
  );
};
