import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AppShell } from '../components/AppShell';

export const ExperimentResultsPage: React.FC = () => {
  return (
    <AppShell>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Outcome Banner */}
        <div
          style={{
            backgroundColor: 'rgba(88, 201, 75, 0.12)',
            border: '1px solid var(--success)',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={28} />
            </div>
            <div>
              <div className="badge badge-connected" style={{ marginBottom: '4px' }}>
                HYPOTHESIS SUPPORTED
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                Variant Cut B Statistically Superior
              </h1>
              <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                Northlight · Experiment 23A Final Outcome (p &lt; 0.001)
              </p>
            </div>
          </div>

          <span className="badge badge-simulated">
            SIMULATED DEMO RESULT
          </span>
        </div>

        {/* Results Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Engagement Lift</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--success)', margin: '4px 0' }} className="tabular-nums">
              +18.2%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>95% CI [+15.1%, +21.3%]</div>
          </div>

          <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Scene Completion</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--lime)', margin: '4px 0' }} className="tabular-nums">
              +9.4%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>95% CI [+7.2%, +11.6%]</div>
          </div>

          <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', padding: '20px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase' }}>Narrative Confusion</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: 'var(--violet-soft)', margin: '4px 0' }} className="tabular-nums">
              −4.1%
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)' }}>95% CI [−5.2%, −3.0%]</div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};
