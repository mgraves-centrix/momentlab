import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface AnomalyCalloutProps {
  label?: string;
  effect: string;
  timeRange: string;
  onClick?: () => void;
  isSelected?: boolean;
}

export const AnomalyCallout: React.FC<AnomalyCalloutProps> = ({
  label = 'RESPONSE CLIFF',
  effect,
  timeRange,
  onClick,
  isSelected = true
}) => {
  if (!effect || !timeRange) return null;
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      style={{
        backgroundColor: 'var(--surface-2)',
        border: isSelected ? '1px solid var(--coral)' : '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '12px 16px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'border-color 0.2s ease',
        boxShadow: isSelected ? '0 0 12px rgba(255, 102, 82, 0.15)' : 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(255, 102, 82, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--coral)' }}>
          <AlertTriangle size={20} />
        </div>
        <div>
          <div className="badge badge-anomaly" style={{ marginBottom: '4px' }}>
            {label}
          </div>
          <div style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>
            Time Window: <span style={{ color: 'var(--text)' }} className="tabular-nums">{timeRange}</span>
          </div>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--coral)', fontFamily: 'var(--font-display)' }} className="tabular-nums">
          {effect}
        </div>
        <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Retention Impact
        </div>
      </div>
    </div>
  );
};
