import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { ResponseTimeline } from '../components/ResponseTimeline';
import { MediaPlayer } from '../components/MediaPlayer';
import { AnomalyCallout } from '../components/AnomalyCallout';
import { HypothesisCard } from '../components/HypothesisCard';
import { NORTHLIGHT_TIMELINE, NORTHLIGHT_HYPOTHESIS } from '../fixtures/northlight';

export const ResponseTimelinePage: React.FC = () => {
  const [selectedCohort, setSelectedCohort] = useState<'all' | '18_24' | '25_34'>('all');
  const [selectedTimeMs, setSelectedTimeMs] = useState<number>(37000);
  const navigate = useNavigate();

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;

  return (
    <AppShell>
      <div style={{ maxWidth: '1600px', margin: '0 auto', padding: isMobile ? '16px' : '24px' }}>
        {/* Desktop Top Metric Bar (Hidden on Mobile Finding per spec) */}
        {!isMobile && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '16px',
              marginBottom: '20px',
              backgroundColor: 'var(--surface-1)',
              padding: '16px 20px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)'
            }}
          >
            <div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Respondents</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-display)' }} className="tabular-nums">
                4,732
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Detected Moment</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--coral)', fontFamily: 'var(--font-display)' }} className="tabular-nums">
                00:37
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Retention Drop</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--coral)', fontFamily: 'var(--font-display)' }} className="tabular-nums">
                −28.4%
              </div>
            </div>

            <div>
              <div style={{ fontSize: '10px', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calibrated Confidence</div>
              <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--lime)', fontFamily: 'var(--font-display)' }} className="tabular-nums">
                91%
              </div>
            </div>
          </div>
        )}

        {/* Workspace Layout */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : '31% 46% 23%',
            gap: '16px'
          }}
        >
          {/* Column 1: Video Player & Filmstrip */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <MediaPlayer
              initialTimecodeMs={selectedTimeMs}
              onTimeUpdate={(t) => setSelectedTimeMs(t)}
              sceneTitle="12 · INT. APARTMENT – NIGHT"
            />

            {/* Anomaly Callout */}
            <AnomalyCallout
              label="RESPONSE CLIFF"
              effect="−28%"
              timeRange="00:33–00:41"
              isSelected={selectedTimeMs === 37000}
              onClick={() => setSelectedTimeMs(37000)}
            />
          </div>

          {/* Column 2: Synchronized Response Timeline Chart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Cohort Selector */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'var(--surface-1)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
              <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>Cohort:</span>
              {(['all', '18_24', '25_34'] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCohort(c)}
                  style={{
                    backgroundColor: selectedCohort === c ? 'var(--violet)' : 'transparent',
                    color: selectedCohort === c ? '#fff' : 'var(--muted)',
                    padding: '4px 10px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontWeight: 600
                  }}
                >
                  {c === 'all' ? 'All (4,732)' : c === '18_24' ? '18–24' : '25–34'}
                </button>
              ))}
            </div>

            <ResponseTimeline
              data={NORTHLIGHT_TIMELINE}
              currentTimeMs={selectedTimeMs}
              onTimeSelect={(t) => setSelectedTimeMs(t)}
              selectedCohort={selectedCohort}
            />
          </div>

          {/* Column 3: Proposal & Action Rail */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <HypothesisCard
              hypothesis={NORTHLIGHT_HYPOTHESIS}
              onApproveClick={() => navigate('/projects/proj_northlight_01/experiments/exp_23a/test')}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
};
