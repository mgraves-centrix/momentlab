import React from 'react';
import { Info } from 'lucide-react';

interface ConfidenceMeterProps {
  confidencePercent: number;
  sampleSize: number;
  basisText?: string;
}

export const ConfidenceMeter: React.FC<ConfidenceMeterProps> = ({
  confidencePercent,
  sampleSize,
  basisText = "Calibrated Bayesian model inference from second-by-second reaction drops"
}) => {
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <span style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Calibrated Model Confidence
          </span>
          <div style={{ fontSize: '24px', fontWeight: 700, color: 'var(--lime)', fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', gap: '8px' }} className="tabular-nums">
            <span>{confidencePercent}%</span>
            <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--muted)' }}>
              (Basis: N = {sampleSize.toLocaleString()})
            </span>
          </div>
        </div>

        <span className="badge badge-simulated">
          STATISTICAL INFERENCE
        </span>
      </div>

      {/* Progress Bar Gauge */}
      <div style={{ height: '8px', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${confidencePercent}%`,
            backgroundColor: 'var(--lime)',
            borderRadius: 'var(--radius-sm)',
            transition: 'width 0.3s ease'
          }}
        />
      </div>

      <p style={{ fontSize: '11px', color: 'var(--muted)', margin: 0, lineHeight: 1.4 }}>
        {basisText}
      </p>

      {/* Non-Causal Compliance Callout */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', backgroundColor: 'var(--surface-2)', padding: '8px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
        <Info size={14} color="var(--violet-soft)" style={{ marginTop: '2px', flexShrink: 0 }} />
        <span style={{ fontSize: '10px', color: 'var(--muted)', lineHeight: 1.3 }}>
          <strong>Compliance Disclosure:</strong> Confidence reflects observational retention alignment, not causal guarantee. Mandatory human approval required before launching Cut B.
        </span>
      </div>
    </div>
  );
};
