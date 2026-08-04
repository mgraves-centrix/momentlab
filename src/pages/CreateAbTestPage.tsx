import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { ApprovalGate } from '../components/ApprovalGate';
import { NORTHLIGHT_HYPOTHESIS } from '../fixtures/northlight';

export const CreateAbTestPage: React.FC = () => {
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'DENIED'>('PENDING');
  const navigate = useNavigate();

  const handleApprove = (_reviewerId: string) => {
    setStatus('APPROVED');
    setTimeout(() => {
      navigate('/projects/proj_northlight_01/experiments/exp_23a/results');
    }, 1200);
  };

  return (
    <AppShell>
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
            Create A/B Experiment Approval
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
            Northlight · Experiment 23A
          </p>
        </div>

        {/* Cut Preview Comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Control Cut A</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Reveal keyframe at 00:43</div>
            <span className="badge badge-simulated" style={{ marginTop: '8px' }}>CURRENT EDIT</span>
          </div>

          <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--violet)', padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '11px', color: 'var(--violet-soft)', textTransform: 'uppercase', marginBottom: '4px' }}>Variant Cut B</div>
            <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)' }}>Move reveal 6s earlier (00:37)</div>
            <span className="badge badge-synthetic" style={{ marginTop: '8px' }}>PROPOSED VARIANT</span>
          </div>
        </div>

        <ApprovalGate
          proposedChange={NORTHLIGHT_HYPOTHESIS.proposedChange}
          onApproveAndLaunch={handleApprove}
          status={status}
        />
      </div>
    </AppShell>
  );
};
