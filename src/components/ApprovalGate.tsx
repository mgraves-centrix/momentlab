import React, { useState } from 'react';
import { ShieldAlert, CheckCircle, Lock } from 'lucide-react';

interface ApprovalGateProps {
  proposedChange: string;
  onApproveAndLaunch: (reviewerId: string) => void;
  status?: 'PENDING' | 'APPROVED' | 'DENIED';
  isApproving?: boolean;
}

export const ApprovalGate: React.FC<ApprovalGateProps> = ({
  proposedChange,
  onApproveAndLaunch,
  status = 'PENDING',
  isApproving = false
}) => {
  const [reviewerId, setReviewerId] = useState('editor_lead_01');
  const [hasConsentChecked, setHasConsentChecked] = useState(false);

  return (
    <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'rgba(139, 92, 246, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--violet)' }}>
          <ShieldAlert size={20} />
        </div>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
            Human Approval Gate Required
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--muted)' }}>
            Server-confirmed human authorization is required to initiate Cut B A/B screening.
          </p>
        </div>
      </div>

      <div style={{ backgroundColor: 'var(--surface-2)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '20px', border: '1px solid var(--border)' }}>
        <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>Target Proposed Edit</div>
        <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{proposedChange}</div>
      </div>

      {status === 'PENDING' ? (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>
              Authorized Reviewer Identity ID:
            </label>
            <input
              type="text"
              value={reviewerId}
              onChange={(e) => setReviewerId(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: 'var(--canvas)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--text)',
                fontSize: '13px'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
            <input
              type="checkbox"
              id="consent-check"
              checked={hasConsentChecked}
              onChange={(e) => setHasConsentChecked(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: 'var(--violet)' }}
            />
            <label htmlFor="consent-check" style={{ fontSize: '12px', color: 'var(--text)', cursor: 'pointer' }}>
              I confirm authorization to initiate A/B experiment with Variant Cut B.
            </label>
          </div>

          <button
            onClick={() => onApproveAndLaunch(reviewerId)}
            disabled={!hasConsentChecked || !reviewerId || isApproving}
            style={{
              width: '100%',
              backgroundColor: hasConsentChecked && reviewerId && !isApproving ? 'var(--lime)' : 'var(--surface-3)',
              color: hasConsentChecked && reviewerId && !isApproving ? '#000' : 'var(--muted)',
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '14px',
              cursor: hasConsentChecked && reviewerId && !isApproving ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px'
            }}
          >
            <Lock size={16} />
            <span>{isApproving ? 'APPROVING...' : 'APPROVE & LAUNCH A/B TEST'}</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--success)', fontSize: '14px', fontWeight: 600 }}>
          <CheckCircle size={18} />
          <span>Server Approval Verified — A/B Test Launched!</span>
        </div>
      )}
    </div>
  );
};
