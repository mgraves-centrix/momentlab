import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Hypothesis } from '../types/northlight';

interface HypothesisCardProps {
  hypothesis: Hypothesis;
  onApproveClick?: () => void;
  onDismiss?: () => void;
}

export const HypothesisCard: React.FC<HypothesisCardProps> = ({
  hypothesis,
  onApproveClick,
  onDismiss
}) => {
  const [isDismissed, setIsDismissed] = React.useState(false);

  const handleNotNow = () => {
    setIsDismissed(true);
    if (onDismiss) onDismiss();
  };

  if (isDismissed) {
    return (
      <div
        style={{
          backgroundColor: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
          Gemini Edit Proposal deferred.
        </span>
        <button
          onClick={() => setIsDismissed(false)}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            padding: '6px 12px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          REOPEN PROPOSAL
        </button>
      </div>
    );
  }
  return (
    <div
      style={{
        backgroundColor: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px',
        position: 'relative'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: 'var(--radius-sm)', background: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
            <Sparkles size={16} />
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--violet-soft)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Gemini Edit Proposal
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {hypothesis.grounded === false ? (
            <span className="badge" style={{ backgroundColor: 'rgba(255, 101, 74, 0.15)', color: '#ff654a', border: '1px solid #ff654a', fontWeight: 700, letterSpacing: '0.04em' }}>
              UNGROUNDED (0 QUERIES)
            </span>
          ) : hypothesis.grounded === true ? (
            <span className="badge" style={{ backgroundColor: 'rgba(88, 201, 75, 0.15)', color: '#58c94b', border: '1px solid #58c94b', fontWeight: 700, letterSpacing: '0.04em' }}>
              GROUNDED IN CLICKHOUSE
            </span>
          ) : null}

          {hypothesis.isSimulated && (
            <span className="badge badge-simulated">
              SIMULATED FORECAST
            </span>
          )}
        </div>
      </div>

      {/* Warning banner for ungrounded runs */}
      {hypothesis.grounded === false && (
        <div style={{
          backgroundColor: 'rgba(255, 101, 74, 0.12)',
          border: '1px solid rgba(255, 101, 74, 0.35)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px 14px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '12px',
          color: '#ff654a',
          fontWeight: 600
        }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>UNGROUNDED ANALYSIS: 0 ClickHouse data queries succeeded during this run. Proposal is derived from model priors.</span>
        </div>
      )}

      {/* Proposed Change Title */}
      <h2 style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)', marginBottom: '12px' }}>
        {hypothesis.proposedChange}
      </h2>

      <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5, marginBottom: '20px' }}>
        {hypothesis.rationale}
      </p>

      {/* Forecast Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', backgroundColor: 'var(--surface-2)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--success)' }} className="tabular-nums">
            {hypothesis.forecastEngagement}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>Engagement</div>
        </div>

        <div style={{ textAlign: 'center', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--lime)' }} className="tabular-nums">
            {hypothesis.forecastCompletion}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>Completion</div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--violet-soft)' }} className="tabular-nums">
            {hypothesis.forecastConfusion}
          </div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase' }}>Confusion</div>
        </div>
      </div>

      {/* Footer / Action */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--muted)' }}>
          <CheckCircle2 size={16} color="var(--success)" />
          <span>Calibrated Confidence: <strong style={{ color: 'var(--text)' }}>{hypothesis.confidenceScore}%</strong></span>
        </div>

        {onApproveClick && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              onClick={handleNotNow}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--muted)',
                padding: '10px 16px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '13px',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              NOT NOW
            </button>
            <button
              onClick={onApproveClick}
              style={{
                backgroundColor: 'var(--lime)',
                color: '#000',
                padding: '10px 20px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                fontSize: '13px',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: 'pointer'
              }}
            >
              <span>PROPOSE A/B TEST</span>
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
