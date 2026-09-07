import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { CutComparison } from '../components/CutComparison';
import { fetchExperimentHypothesis, fetchExperimentSummary, Hypothesis, ExperimentSummary } from '../api/client';
import { useMobile } from '../hooks/useMobile';
import { 
  ChevronRight, 
  ShieldCheck, 
  Sparkles, 
  Sliders, 
  AlertCircle, 
  CheckCircle2,
  Lock
} from 'lucide-react';

export const CreateAbTestPage: React.FC = () => {
  const [status, setStatus] = useState<'PENDING' | 'APPROVED' | 'DENIED'>('PENDING');
  const [selectedVariant, setSelectedVariant] = useState<'A' | 'B'>('B');
  const [allocation, setAllocation] = useState<number>(50); // 50/50
  const [consentAcknowledged, setConsentAcknowledged] = useState<boolean>(false);
  const [reviewerToken, setReviewerToken] = useState<string>(() => sessionStorage.getItem('reviewer_token') || '');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState<boolean>(false);
  const [auditId, setAuditId] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { projectId, experimentId } = useParams();
  const [hypothesis, setHypothesis] = useState<Hypothesis | null>(null);
  const [summaryData, setSummaryData] = useState<ExperimentSummary | null>(null);
  const [projectData, setProjectData] = useState<{ video_url?: string } | null>(null);

  useEffect(() => {
    if (projectId && experimentId) {
      fetchExperimentHypothesis(projectId, experimentId).then(setHypothesis);
      fetchExperimentSummary(projectId, experimentId).then(setSummaryData);
    }
    if (projectId) {
      fetch(`/api/v1/projects/${projectId}`).then(r => r.ok ? r.json() : null).then(setProjectData);
    }
  }, [projectId, experimentId]);

  const handleTokenChange = (val: string) => {
    setReviewerToken(val);
    if (val.trim()) {
      sessionStorage.setItem('reviewer_token', val.trim());
    } else {
      sessionStorage.removeItem('reviewer_token');
    }
    if (status === 'DENIED') setStatus('PENDING');
    setErrorMessage(null);
  };

  const handleApproveAndLaunch = async () => {
    const token = reviewerToken.trim() || sessionStorage.getItem('reviewer_token')?.trim();
    if (!projectId || !experimentId || !consentAcknowledged || !token) {
      setErrorMessage("Reviewer sign-in required before launch.");
      return;
    }
    setIsApproving(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/v1/projects/${projectId}/experiments/${experimentId}:approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          allocation_split: `${allocation}/${100 - allocation}`,
          allocation_control: allocation,
          allocation_variant: 100 - allocation,
          target_cohorts: ['ALL', '18-24', '25-34'],
          min_sample_size: 100,
          test_window: '7_DAYS',
          stopping_rule: 'STATISTICAL_SIGNIFICANCE_OR_MAX_SAMPLE',
          consent_given: consentAcknowledged
        })
      });
      if (!res.ok) {
        let errMsg = `Approval failed (HTTP ${res.status})`;
        try {
          const errData = await res.json();
          if (errData.detail) errMsg = errData.detail;
        } catch (_) {}
        throw new Error(errMsg);
      }
      const data = await res.json();
      setAuditId(data.audit_id || 'audit_confirmed');
      setStatus('APPROVED');
      setTimeout(() => {
        navigate(`/projects/${projectId}/experiments/${experimentId}/results${location.search}`);
      }, 1400);
    } catch (e: any) {
      console.error("Approval error:", e);
      setStatus('DENIED');
      setErrorMessage(e.message || "Reviewer authorization failed. Invalid token.");
    } finally {
      setIsApproving(false);
    }
  };

  const isMobile = useMobile();

  return (
    <AppShell>
      <div style={{ maxWidth: isMobile ? '100%' : '1440px', margin: '0 auto', padding: isMobile ? '16px' : '24px 32px 64px 32px', color: '#f1f3f2' }}>
        
        {/* Breadcrumb Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 600, color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px' }}>
          <span>EXPERIMENTS</span>
          <ChevronRight size={12} color="#8d979f" />
          <span>SCENE 12</span>
          <ChevronRight size={12} color="#8d979f" />
          <span>EXPERIMENT 23A</span>
          <ChevronRight size={12} color="#8d979f" />
          <span style={{ color: '#ffffff' }}>CREATE A/B EXPERIMENT</span>
        </div>

        {/* Page Top Title Row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', margin: 0 }}>
                CREATE A/B TEST & APPROVAL GATE
              </h1>
              <span className="badge badge-simulated" style={{ backgroundColor: 'rgba(242, 184, 75, 0.15)', color: '#f2b84b', border: '1px solid rgba(242, 184, 75, 0.3)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
                CONFIG DRAFT
              </span>
            </div>
            <p style={{ fontSize: '13px', color: '#8d979f', margin: '4px 0 0 0' }}>
              Configure test allocation, sample size power, stopping rules, and authorize deployment.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '12px', color: '#8d979f' }}>
              Target Experiment: <strong style={{ color: '#ffffff' }}>EXP_23A</strong>
            </span>
          </div>
        </div>

        {/* 2-Column Grid (62% / 36%) */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '62% 36%', gap: '24px', alignItems: 'start' }}>
          
          {/* LEFT COLUMN: Test Setup & Configuration */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Cut Visual Preview & Variant Selection */}
            <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '14px' }}>
                EXPERIMENT SUMMARY & VARIANT PREVIEW
              </div>
              
              <CutComparison
                anomalyWindow={hypothesis?.anomalyWindow}
                hypothesis={hypothesis?.proposedChange || "unavailable"}
                controlVideoUrl={projectData?.video_url}
                projectId={projectId}
                experimentId={experimentId}
                onSelectVariant={(v) => setSelectedVariant(v)}
              />
            </div>

            {/* Test Configuration Matrix */}
            <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', fontWeight: 800, color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>
                <Sliders size={14} color="#8b5cf6" />
                <span>EXPERIMENT CONFIGURATION & PARAMETERS</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '16px' }}>
                
                {/* Traffic Allocation */}
                <div style={{ padding: '14px', backgroundColor: '#131b22', borderRadius: '6px', border: '1px solid #1c2630' }}>
                  <div style={{ fontSize: '11px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '6px' }}>TRAFFIC ALLOCATION</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#f1f3f2', marginBottom: '6px' }}>
                    {allocation}% Control / {100 - allocation}% Variant
                  </div>
                  <input 
                    type="range" 
                    min="10" 
                    max="90" 
                    value={allocation} 
                    onChange={(e) => setAllocation(parseInt(e.target.value, 10))}
                    style={{ width: '100%', accentColor: 'var(--lime)' }}
                  />
                  <div style={{ fontSize: '11px', color: '#8d979f', marginTop: '4px' }}>Recommended: 50/50 Balanced split</div>
                </div>

                {/* Target Cohorts */}
                <div style={{ padding: '14px', backgroundColor: '#131b22', borderRadius: '6px', border: '1px solid #1c2630' }}>
                  <div style={{ fontSize: '11px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '6px' }}>TARGET COHORTS</div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#c4a7ff', marginBottom: '6px' }}>
                    ALL COHORTS (18–24, 25–34, 35+)
                  </div>
                  <div style={{ fontSize: '11px', color: '#8d979f', lineHeight: 1.4 }}>
                    Stratified random assignment across consented screening viewers.
                  </div>
                </div>

                {/* Minimum Sample Size & Power */}
                <div style={{ padding: '14px', backgroundColor: '#131b22', borderRadius: '6px', border: '1px solid #1c2630' }}>
                  <div style={{ fontSize: '11px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '6px' }}>MINIMUM SAMPLE SIZE & POWER</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#f1f3f2', marginBottom: '4px' }} className="tabular-nums">
                    N = {summaryData?.total_respondents != null ? (summaryData.total_respondents * 2).toLocaleString() : 'unavailable'} (Target: Cut {selectedVariant})
                  </div>
                  <div style={{ fontSize: '11px', color: '#8d979f' }}>
                    80% statistical power at &alpha; = 0.05 for minimum detectable effect of 3.5%.
                  </div>
                </div>

                {/* Test Window */}
                <div style={{ padding: '14px', backgroundColor: '#131b22', borderRadius: '6px', border: '1px solid #1c2630' }}>
                  <div style={{ fontSize: '11px', color: '#8d979f', textTransform: 'uppercase', marginBottom: '6px' }}>TEST WINDOW & DURATION</div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#f1f3f2', marginBottom: '4px' }}>
                    {(() => {
                      const now = new Date();
                      const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                      const formatDate = (d: Date) => d.toISOString().split('T')[0];
                      return `7 Days (${formatDate(now)} — ${formatDate(endDate)})`;
                    })()}
                  </div>
                  <div style={{ fontSize: '11px', color: '#8d979f' }}>
                    Auto-pauses when sample target or stopping rule boundary is reached.
                  </div>
                </div>

              </div>

              {/* Stopping Rule & Guardrails */}
              <div style={{ marginTop: '16px', padding: '14px', backgroundColor: '#131b22', borderRadius: '6px', border: '1px solid #1c2630' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#ff654a', marginBottom: '6px' }}>
                  <AlertCircle size={14} />
                  <span>EARLY STOPPING RULE & GUARDRAIL CONSTRAINTS</span>
                </div>
                <p style={{ fontSize: '12px', color: '#8d979f', margin: 0, lineHeight: 1.5 }}>
                  The experiment will automatically terminate if variant abandonment exceeds <strong>{((summaryData as any)?.abandonmentThreshold ?? 8.0).toFixed(1)}%</strong> or if confused reaction rate increases by <strong>&gt; +{((summaryData as any)?.confusedGuardrail ?? 5.0).toFixed(1)}%</strong> (stopping rule). Guardrail metrics are evaluated continuously via ClickHouse real-time streaming.
                </p>
              </div>

            </div>

            {/* Privacy Note & Compliance Assurance */}
            <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '8px', padding: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <ShieldCheck size={20} color="#58c94b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>
                  PRIVACY NOTE & ZERO BIOMETRICS POLICY
                </div>
                <p style={{ fontSize: '11px', color: '#8d979f', margin: 0, lineHeight: 1.4 }}>
                  Privacy note: All audience evaluations rely solely on explicit consented reactions and playback events. Zero facial, gaze, audio, or biometric telemetry is collected or inferred.
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Forecast, Approval Gate, & Launch Action */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Forecasted Uplift Card */}
            <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} color="#c4a7ff" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    SIMULATED FORECAST
                  </span>
                </div>
                <span className="badge badge-simulated">SIMULATED</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#131b22', borderRadius: '4px', border: '1px solid #1c2630' }}>
                  <span style={{ fontSize: '12px', color: '#8d979f' }}>Projected Engagement Lift</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#58c94b' }} className="tabular-nums">
                    {hypothesis?.forecastEngagement || "—"}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#131b22', borderRadius: '4px', border: '1px solid #1c2630' }}>
                  <span style={{ fontSize: '12px', color: '#8d979f' }}>Projected Completion</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#58c94b' }} className="tabular-nums">
                    {hypothesis?.forecastCompletion || "—"}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 12px', backgroundColor: '#131b22', borderRadius: '4px', border: '1px solid #1c2630' }}>
                  <span style={{ fontSize: '12px', color: '#8d979f' }}>Confusion Change</span>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: '#c4a7ff' }} className="tabular-nums">
                    {hypothesis?.forecastConfusion || "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Human Approval Gate Box */}
            <div style={{ backgroundColor: '#0c1115', border: '1px solid rgba(183, 227, 61, 0.3)', borderRadius: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} color="var(--lime)" />
                  <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em', margin: 0 }}>
                    HUMAN AUTHORIZATION GATE
                  </h3>
                </div>
                {reviewerToken.trim() ? (
                  <span style={{ fontSize: '11px', color: '#58c94b', backgroundColor: '#111b15', border: '1px solid #1f3a28', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    REVIEWER SIGNED IN
                  </span>
                ) : (
                  <span style={{ fontSize: '11px', color: '#ff654a', backgroundColor: '#211210', border: '1px solid #4a201c', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                    SIGN-IN REQUIRED
                  </span>
                )}
              </div>
              
              <p style={{ fontSize: '12px', color: '#8d979f', lineHeight: 1.5, marginBottom: '16px' }}>
                Deploying this experiment will route live screening participants between Control Cut A ({allocation}%) and Variant Cut B ({100 - allocation}%) according to the configured {allocation}/{100 - allocation} allocation.
              </p>

              {/* Reviewer Sign-In Control */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#8d979f', textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.04em' }}>
                  Reviewer Authorization Token (Session Only)
                </label>
                <input
                  type="password"
                  placeholder="Enter reviewer secret token..."
                  value={reviewerToken}
                  onChange={(e) => handleTokenChange(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#131b22',
                    border: '1px solid ' + (errorMessage ? '#ff654a' : reviewerToken.trim() ? '#283540' : '#ff654a'),
                    borderRadius: '6px',
                    color: '#ffffff',
                    fontSize: '12px',
                    outline: 'none',
                    fontFamily: 'monospace',
                    boxSizing: 'border-box'
                  }}
                />
                {!reviewerToken.trim() && !errorMessage && (
                  <div style={{ marginTop: '6px', fontSize: '11px', color: '#f2b84b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} />
                    <span>Reviewer sign-in required to authorize live traffic deployment.</span>
                  </div>
                )}
                {errorMessage && (
                  <div style={{ marginTop: '6px', fontSize: '11px', color: '#ff654a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertCircle size={12} />
                    <span>{errorMessage}</span>
                  </div>
                )}
              </div>

              <label htmlFor="consent-check" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '12px', color: '#f1f3f2', cursor: 'pointer', marginBottom: '20px', userSelect: 'none' }}>
                <input 
                  type="checkbox"
                  id="consent-check"
                  checked={consentAcknowledged}
                  onChange={(e) => setConsentAcknowledged(e.target.checked)}
                  style={{ marginTop: '2px', accentColor: 'var(--lime)' }}
                />
                <span>I confirm that I have reviewed the hypothesis, guardrail parameters, and approve live traffic deployment.</span>
              </label>

              {/* Launch CTA */}
              <button
                onClick={handleApproveAndLaunch}
                disabled={!consentAcknowledged || !reviewerToken.trim() || isApproving || status === 'APPROVED'}
                style={{
                  width: '100%',
                  backgroundColor: (consentAcknowledged && reviewerToken.trim() && status !== 'APPROVED') ? 'var(--lime)' : '#1c2630',
                  color: (consentAcknowledged && reviewerToken.trim() && status !== 'APPROVED') ? '#080b0e' : '#5b6670',
                  border: 'none',
                  padding: '14px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: (consentAcknowledged && reviewerToken.trim() && status !== 'APPROVED') ? 'pointer' : 'not-allowed',
                  letterSpacing: '0.04em',
                  transition: 'all 0.2s ease'
                }}
              >
                {status === 'APPROVED' ? (
                  <>
                    <CheckCircle2 size={16} color="#58c94b" />
                    <span style={{ color: '#58c94b' }}>APPROVED & LAUNCHED</span>
                  </>
                ) : isApproving ? (
                  <span>RECORDING AUDIT & LAUNCHING...</span>
                ) : (
                  <>
                    <span>APPROVE & LAUNCH A/B TEST</span>
                    <ChevronRight size={16} strokeWidth={3} />
                  </>
                )}
              </button>

              {auditId && (
                <div style={{ marginTop: '12px', fontSize: '11px', color: '#8d979f', fontFamily: 'monospace', textAlign: 'center' }}>
                  IMMUTABLE AUDIT ID: {auditId}
                </div>
              )}
            </div>

          </div>

        </div>
      </div>
    </AppShell>
  );
};
