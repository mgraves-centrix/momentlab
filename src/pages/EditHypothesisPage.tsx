import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { HypothesisCard } from '../components/HypothesisCard';
import { NORTHLIGHT_HYPOTHESIS } from '../fixtures/northlight';

export const EditHypothesisPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <AppShell>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
            Hypothesis Review & Agent Recommendation
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
            Inspect Gemini-generated edit proposal prior to human approval gate
          </p>
        </div>

        <HypothesisCard
          hypothesis={NORTHLIGHT_HYPOTHESIS}
          onApproveClick={() => navigate('/projects/proj_northlight_01/experiments/exp_23a/test')}
        />
      </div>
    </AppShell>
  );
};
