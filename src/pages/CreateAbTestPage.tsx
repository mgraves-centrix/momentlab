import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { ApprovalGate } from '../components/ApprovalGate';
import { CutComparison } from '../components/CutComparison';
import { fetchExperimentHypothesis, Hypothesis, approveHypothesis } from '../api/client';
import { useMobile } from '../hooks/useMobile';

export const CreateAbTestPage: React.FC = () => {
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'DENIED'>('PENDING');
  const [selectedVariant, setSelectedVariant] = useState<'A' | 'B'>('B');
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId, experimentId } = useParams();
  const [hypothesis, setHypothesis] = useState<Hypothesis | null>(null);

  React.useEffect(() => {
    if (projectId && experimentId) {
      fetchExperimentHypothesis(projectId, experimentId).then(setHypothesis);
    }
  }, [projectId, experimentId]);

  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async (_reviewerId: string) => {
    if (!projectId || !experimentId) return;
    setIsApproving(true);
    try {
      await approveHypothesis(projectId, experimentId);
      setStatus('APPROVED');
      setTimeout(() => {
        navigate(`/projects/${projectId}/experiments/${experimentId}/results${location.search}`);
      }, 1200);
    } catch (e) {
      console.error(e);
      setStatus('DENIED');
    } finally {
      setIsApproving(false);
    }
  };

  const isMobile = useMobile();

  return (
    <AppShell>
      <div style={{ padding: isMobile ? '0' : '32px 24px', maxWidth: '900px', margin: '0 auto', backgroundColor: isMobile ? '#050a0e' : 'transparent', minHeight: isMobile ? '100vh' : 'auto' }}>
        
        {isMobile ? (
          /* --- MOBILE LAYOUT (11-mobile-test.png) --- */
          <div style={{ display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px' }}>
            
            {/* Mobile Subheader */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#f1f3f2', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              <span>SCENE 12</span>
              <span style={{ color: '#5b6670' }}>/</span>
              <span>EXPERIMENT DESIGN</span>
            </div>

            {/* A/B Variant Preview */}
            <div style={{ backgroundColor: '#091218', border: '1px solid #16232c', borderRadius: '12px', overflow: 'hidden' }}>
              <div style={{ padding: '16px', borderBottom: '1px solid #16232c' }}>
                <div style={{ fontSize: '10px', color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>A/B VARIANT PREVIEW</div>
              </div>
              <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* Fake player for layout */}
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f1f3f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                {/* Top Badge */}
                <div style={{ position: 'absolute', top: '12px', left: '12px', backgroundColor: 'rgba(9, 18, 24, 0.8)', border: '1px solid #1c2630', padding: '6px 10px', borderRadius: '4px', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '4px', backgroundColor: selectedVariant === 'A' ? '#c4a7ff' : '#b7e33d' }} />
                  <span style={{ fontSize: '9px', fontWeight: 700, color: '#f1f3f2', letterSpacing: '0.04em' }}>
                    VARIANT {selectedVariant} / {selectedVariant === 'A' ? 'CONTROL CUT' : 'MOVE REVEAL 6S EARLIER'}
                  </span>
                </div>
              </div>
            </div>

            {/* Select Variant */}
            <div style={{ backgroundColor: '#091218', border: '1px solid #16232c', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '10px', color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>SELECT VARIANT FOR LAUNCH</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  onClick={() => setSelectedVariant('A')}
                  style={{
                    backgroundColor: selectedVariant === 'A' ? '#1a103c' : '#0d1318',
                    border: selectedVariant === 'A' ? '1px solid #8b5cf6' : '1px solid #1c2630',
                    borderRadius: '8px',
                    padding: '12px',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '6px', backgroundColor: selectedVariant === 'A' ? '#8b5cf6' : '#1c2630', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedVariant === 'A' && <div style={{ width: '6px', height: '6px', borderRadius: '3px', backgroundColor: '#fff' }} />}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: selectedVariant === 'A' ? '#f1f3f2' : '#8d979f' }}>[A] CONTROL CUT</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#5b6670', paddingLeft: '18px' }}>Original Sequence</div>
                </button>
                <button
                  onClick={() => setSelectedVariant('B')}
                  style={{
                    backgroundColor: selectedVariant === 'B' ? 'rgba(183, 227, 61, 0.1)' : '#0d1318',
                    border: selectedVariant === 'B' ? '1px solid #b7e33d' : '1px solid #1c2630',
                    borderRadius: '8px',
                    padding: '12px',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '6px', backgroundColor: selectedVariant === 'B' ? '#b7e33d' : '#1c2630', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {selectedVariant === 'B' && <div style={{ width: '6px', height: '6px', borderRadius: '3px', backgroundColor: '#050a0e' }} />}
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: selectedVariant === 'B' ? '#b7e33d' : '#8d979f' }}>[B] TEST CUT</span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#5b6670', paddingLeft: '18px' }}>Earlier Reveal</div>
                </button>
              </div>
            </div>

            {/* Forecasted Impact */}
            {selectedVariant === 'B' && (
              <div style={{ backgroundColor: '#091218', border: '1px solid #16232c', borderRadius: '12px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div style={{ fontSize: '10px', color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>FORECASTED IMPACT</div>
                  <span style={{ backgroundColor: 'rgba(242, 184, 75, 0.15)', color: '#f2b84b', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px', border: '1px solid rgba(242, 184, 75, 0.3)' }}>SIMULATED</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ flex: 1, backgroundColor: '#0d1318', border: '1px solid #1c2630', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '4px' }}>ENGAGEMENT LIFT</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#58c94b' }}>+18%</div>
                  </div>
                  <div style={{ flex: 1, backgroundColor: '#0d1318', border: '1px solid #1c2630', borderRadius: '8px', padding: '12px', textAlign: 'center' }}>
                    <div style={{ fontSize: '9px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '4px' }}>COMPLETION LIFT</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#58c94b' }}>+9%</div>
                  </div>
                </div>
              </div>
            )}

            {/* Human Approval Gate */}
            <div style={{ backgroundColor: 'rgba(242, 184, 75, 0.05)', border: '1px solid rgba(242, 184, 75, 0.2)', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f2b84b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#f2b84b', letterSpacing: '0.04em' }}>HUMAN APPROVAL GATE</h3>
              </div>
              <p style={{ fontSize: '11px', color: '#9aa8b2', lineHeight: '1.5', marginBottom: '16px' }}>
                By approving, you authorize MomentLab to generate a deployment spec and launch this A/B test to a 10% live audience segment.
              </p>
              
              <button
                onClick={() => handleApprove('mobile-reviewer-id')}
                disabled={status !== 'PENDING' || isApproving}
                style={{
                  width: '100%',
                  backgroundColor: status === 'PENDING' && !isApproving ? '#b7e33d' : '#1c2630',
                  color: status === 'PENDING' && !isApproving ? '#050a0e' : '#5b6670',
                  border: 'none',
                  padding: '16px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  letterSpacing: '0.04em',
                  transition: 'all 0.2s ease'
                }}
              >
                {status === 'PENDING' ? (
                  isApproving ? 'APPROVING...' : (
                    <>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                      APPROVE & LAUNCH A/B TEST
                    </>
                  )
                ) : status === 'APPROVED' ? (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#58c94b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    <span style={{ color: '#58c94b' }}>APPROVED</span>
                  </>
                ) : (
                  'DENIED'
                )}
              </button>
            </div>
            
          </div>
        ) : (
          /* --- DESKTOP LAYOUT (Fallback) --- */
          <>
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                Create A/B Experiment Approval Gate
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                Northlight · Experiment 23A (Scene 12 Edit Evaluation)
              </p>
            </div>

            {/* Interactive Cut Comparison */}
            <div style={{ marginBottom: '24px' }}>
              <CutComparison
                controlRevealMs={43000}
                variantRevealMs={37000}
                onSelectVariant={(variant) => setSelectedVariant(variant)}
              />
            </div>

            {/* Server-Signed Approval Gate */}
            <ApprovalGate
              proposedChange={`${hypothesis?.proposedChange || 'Edit Proposal'} (Selected Target: Cut ${selectedVariant})`}
              onApproveAndLaunch={handleApprove}
              status={status}
              isApproving={isApproving}
            />
          </>
        )}
      </div>
    </AppShell>
  );
};
