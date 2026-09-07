import React from 'react';

export type TimeWindow = '10s' | '30s' | '1m';

interface TimeWindowSelectorProps {
  selectedWindow: TimeWindow;
  onWindowChange: (window: TimeWindow) => void;
}

export const TimeWindowSelector: React.FC<TimeWindowSelectorProps> = ({
  selectedWindow,
  onWindowChange
}) => {
  const windows: { value: TimeWindow; label: string }[] = [
    { value: '10s', label: '10S Window' },
    { value: '30s', label: '30S Window' },
    { value: '1m', label: '1M Full Scene' }
  ];

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        backgroundColor: 'var(--surface-1)',
        padding: '6px 10px',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border)',
        flexWrap: 'wrap',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}
      role="radiogroup"
      aria-label="Timeline window selector"
    >
      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase' }}>
        Zoom Window:
      </span>
      {windows.map((w) => {
        const isSelected = selectedWindow === w.value;
        return (
          <button
            key={w.value}
            role="radio"
            aria-checked={isSelected}
            onClick={() => onWindowChange(w.value)}
            style={{
              backgroundColor: isSelected ? 'var(--surface-3)' : 'transparent',
              color: isSelected ? 'var(--text)' : 'var(--muted)',
              border: `1px solid ${isSelected ? 'var(--violet)' : 'transparent'}`,
              borderRadius: 'var(--radius-sm)',
              padding: '4px 8px',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '28px',
              minWidth: '44px'
            }}
          >
            {w.label}
          </button>
        );
      })}
    </div>
  );
};
