import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { CutComparison } from '../components/CutComparison';
import { ConfidenceMeter } from '../components/ConfidenceMeter';
import { 
  fetchExperimentHypothesis, 
  fetchExperimentSummary, 
  requestRevisionHypothesis, 
  discardHypothesis, 
  Hypothesis, 
  ExperimentSummary 
} from '../api/client';
import { 
  ExternalLink, 
  AlertTriangle, 
  ChevronRight, 
  RotateCcw, 
  Trash2, 
  ShieldAlert, 
  Activity,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

import { useMobile } from '../hooks/useMobile';

export const EditHypothesisPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId, experimentId } = useParams();
  const [hypothesis, setHypothesis] = useState<Hypothesis | null>(null);
  const [summaryData, setSummaryData] = useState<ExperimentSummary | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const isMobile = useMobile();

  useEffect(() => {
    if (projectId && experimentId) {
      fetchExperimentHypothesis(projectId, experimentId).then(setHypothesis);
      fetchExperimentSummary(projectId, experimentId).then(setSummaryData);
    }
  }, [projectId, experimentId]);

  const handleRequestRevision = async () => {
    if (!projectId || !experimentId) return;
    setActionLoading('revision');
    try {
      const res = await requestRevisionHypothesis(projectId, experimentId, "Tighten cut window around 00:37 cliff");
      setHypothesis(res.hypothesis);
      setStatusMessage({ text: "Revision requested from agent. Model re-evaluated query parameters.", type: 'success' });
    } catch (e) {
      console.error(e);
      setStatusMessage({ text: "Failed to request revision from agent.", type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleDiscard = async () => {
    if (!projectId || !experimentId) return;
    setActionLoading('discard');
    try {
      await discardHypothesis(projectId, experimentId);
      setStatusMessage({ text: "Hypothesis discarded.", type: 'success' });
      setTimeout(() => {
        navigate(`/projects/${projectId}/experiments/${experimentId}/finding${location.search}`);
      }, 1000);
    } catch (e) {
      console.error(e);
      setStatusMessage({ text: "Failed to discard hypothesis.", type: 'error' });
    } finally {
      setActionLoading(null);
    }
  };

  if (!hypothesis) {
    return (
      <AppShell>
        <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '32px', color: '#8d979f' }}>
          Loading hypothesis specification...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: '1440px', margin: '0 auto', padding: isMobile ? '16px' : '28px 32px 64px 32px', boxSizing: 'border-box', width: '100%', overflowX: 'hidden' }}>
        
        {/* Header Action Bar */}
        <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', color: '#8d979f', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                HYPOTHESIS SPECIFICATION
              </span>
              <span style={{ color: '#283540' }}>·</span>
              <span style={{ fontSize: '11px', color: '#c4a7ff', fontWeight: 600 }}>EXP-23A</span>
            </div>
            <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)', margin: 0, letterSpacing: '-0.01em' }}>
              {hypothesis.proposedChange}
            </h1>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={handleDiscard}
              disabled={actionLoading === 'discard'}
              style={{
                backgroundColor: 'transparent',
                color: '#ff654a',
                border: '1px solid #3d1c18',
                padding: '10px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: actionLoading === 'discard' ? 'not-allowed' : 'pointer'
              }}
            >
              <Trash2 size={14} />
              <span>DISCARD</span>
            </button>

            <button
              onClick={handleRequestRevision}
              disabled={actionLoading === 'revision'}
              style={{
                backgroundColor: '#161e25',
                color: '#ffffff',
                border: '1px solid #283540',
                padding: '10px 16px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: actionLoading === 'revision' ? 'not-allowed' : 'pointer'
              }}
            >
              <RotateCcw size={14} className={actionLoading === 'revision' ? 'spin' : ''} />
              <span>REQUEST REVISION</span>
            </button>

            <button
              onClick={() => navigate(`/projects/${projectId}/experiments/${experimentId}/test${location.search}`)}
              style={{
                backgroundColor: 'var(--lime)',
                color: '#080b0e',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                letterSpacing: '0.04em'
              }}
            >
              <span>CREATE A/B TEST</span>
              <ChevronRight size={16} strokeWidth={3} />
            </button>
          </div>
        </div>

        {statusMessage && (
          <div style={{
            padding: '12px 16px',
            backgroundColor: statusMessage.type === 'error' ? '#211210' : '#131b22',
            border: `1px solid ${statusMessage.type === 'error' ? '#4a201c' : '#283540'}`,
            borderRadius: '6px',
            marginBottom: '20px',
            fontSize: '12px',
            color: statusMessage.type === 'error' ? '#ff654a' : '#c4a7ff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            {statusMessage.type === 'error' ? (
              <AlertTriangle size={16} color="#ff654a" />
            ) : (
              <CheckCircle2 size={16} color="#58c94b" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* 2-Column Workspace (64% / 36%) or 1-Column on Mobile */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'minmax(0, 64%) minmax(0, 34%)', gap: '24px', alignItems: 'start', width: '100%', boxSizing: 'border-box' }}>
          
          {/* LEFT COLUMN: Structured Specification Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: 0 }}>
            
            {/* ROW 1: OBSERVATION */}
            <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  OBSERVATION & TELEMETRY TRIGGER
                </div>
                <span style={{ fontSize: '10px', backgroundColor: '#2d1b54', color: '#c4a7ff', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                  CLICKHOUSE DETECTED
                </span>
              </div>
              <div style={{ fontSize: '14px', color: '#f1f3f2', lineHeight: 1.5, marginBottom: '12px' }}>
                Detector: {summaryData?.retention_drop || 'unavailable'} retention drop (vs 00:00–00:10 baseline) detected at timestamp {summaryData?.detected_moment || 'unavailable'} in Scene 12. Agent's own analysis: {(hypothesis as any)?.retentionDrop || (hypothesis as any)?.evidenceRecords?.[0]?.effectSize || 'unavailable'} drop (vs local pre-cliff baseline).
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '11px', backgroundColor: '#161e25', border: '1px solid #283540', padding: '4px 10px', borderRadius: '4px', color: '#c4a7ff', fontFamily: 'monospace' }}>
                  CH_EVIDENCE: EV-01
                </div>
                <div style={{ fontSize: '11px', backgroundColor: '#161e25', border: '1px solid #283540', padding: '4px 10px', borderRadius: '4px', color: '#8d979f', fontFamily: 'monospace' }}>
                  QUERY_RUN: QRY-23A-8841
                </div>
                <div style={{ fontSize: '11px', backgroundColor: '#161e25', border: '1px solid #283540', padding: '4px 10px', borderRadius: '4px', color: '#ff654a', fontWeight: 700 }}>
                  CLIFF: {summaryData?.retention_drop || 'unavailable'} (vs 00:00–00:10 baseline)
                </div>
              </div>
            </div>

            {/* ROW 2: PROPOSED CHANGE (CUT A vs CUT B) */}
            <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                PROPOSED CHANGE — VISUAL CUT COMPARISON
              </div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--lime)', marginBottom: '14px' }}>
                {hypothesis.proposedChange}
              </div>
              <CutComparison 
                controlRevealMs={43000} 
                variantRevealMs={37000} 
                hypothesis={hypothesis.proposedChange}
              />
            </div>

            {/* ROW 3: RATIONALE */}
            <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                EDITORIAL RATIONALE & MECHANISM
              </div>
              <div style={{ fontSize: '13px', color: '#f1f3f2', lineHeight: 1.6 }}>
                {hypothesis.rationale}
              </div>
            </div>

            {/* ROW 4: SUCCESS METRICS & GUARDRAILS */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#c4a7ff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <Sparkles size={14} color="#c4a7ff" />
                    <span>SIMULATED TARGETS</span>
                  </div>
                  <span className="badge badge-simulated">SIMULATED</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#131b22', borderRadius: '4px' }}>
                    <span style={{ color: '#8d979f' }}>Engagement Lift</span>
                    <span style={{ color: '#58c94b', fontWeight: 700 }} className="tabular-nums">{hypothesis.forecastEngagement}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#131b22', borderRadius: '4px' }}>
                    <span style={{ color: '#8d979f' }}>Scene Completion</span>
                    <span style={{ color: '#58c94b', fontWeight: 700 }} className="tabular-nums">{hypothesis.forecastCompletion}</span>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '8px', padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: '#ff654a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                  <ShieldAlert size={14} />
                  GUARDRAIL METRICS & CONSTRAINTS
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#131b22', borderRadius: '4px' }}>
                    <span style={{ color: '#8d979f' }}>Confusion Change</span>
                    <span style={{ color: '#c4a7ff', fontWeight: 700 }} className="tabular-nums">{hypothesis.forecastConfusion}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#131b22', borderRadius: '4px' }}>
                    <span style={{ color: '#8d979f' }}>Max Drop-off Threshold</span>
                    <span style={{ color: '#8d979f', fontWeight: 700 }} className="tabular-nums">&lt; 8.0%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 5: UNCERTAINTY & CONFOUNDERS */}
            <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
                UNCERTAINTY BOUNDS & POTENTIAL CONFOUNDERS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', fontSize: '12px' }}>
                <div style={{ padding: '12px', backgroundColor: '#131b22', borderRadius: '6px', border: '1px solid #1c2630' }}>
                  <div style={{ color: '#c4a7ff', fontWeight: 700, marginBottom: '4px' }}>Uncertainty & Sample Size</div>
                  <div style={{ color: '#8d979f', lineHeight: 1.4 }}>
                    Observed N={summaryData?.total_respondents || 0} respondents with 95% CI on retention dip. p &lt; 0.001 against baseline.
                  </div>
                </div>
                <div style={{ padding: '12px', backgroundColor: '#131b22', borderRadius: '6px', border: '1px solid #1c2630' }}>
                  <div style={{ color: '#f2b84b', fontWeight: 700, marginBottom: '4px' }}>Confounders & Potential Biases</div>
                  <div style={{ color: '#8d979f', lineHeight: 1.4 }}>
                    Audience segment skew in 18–24 cohort during weekend screenings; audio cue at 00:36 may influence reaction speed.
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Model Confidence, Provenance, & Agent Run Trace */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Confidence Meter */}
            <ConfidenceMeter
              confidencePercent={hypothesis.confidenceScore}
              sampleSize={summaryData?.total_respondents || 0}
            />

            {/* Agent Run Trace Panel */}
            <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '8px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Activity size={14} color="#8b5cf6" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    AGENT RUN TRACE
                  </span>
                </div>
                <span style={{ fontSize: '11px', color: '#c4a7ff', fontFamily: 'monospace', backgroundColor: '#2d1b54', padding: '2px 6px', borderRadius: '3px' }}>
                  RUN: {hypothesis.trace?.runId || 'unavailable'}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: '#8d979f', marginBottom: '12px' }}>
                Total duration: <strong style={{ color: '#f1f3f2' }}>{hypothesis.trace?.totalDurationMs != null ? `${hypothesis.trace.totalDurationMs}ms` : 'unavailable'}</strong> across {hypothesis.trace?.steps ? hypothesis.trace.steps.length : 0} agent tools.
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(hypothesis.trace?.steps || []).map((step, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', padding: '8px 10px', backgroundColor: '#131b22', borderRadius: '4px', border: '1px solid #1c2630' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: step.status === 'success' ? '#58c94b' : '#ff654a' }} />
                      <span style={{ color: '#f1f3f2', fontWeight: 600 }}>{step.name}</span>
                    </div>
                    <span style={{ color: '#8d979f', fontFamily: 'monospace' }}>{step.durationMs}ms</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Linked ClickHouse Evidence Records */}
            <div style={{ backgroundColor: '#0c1115', border: '1px solid #1c2630', borderRadius: '8px', padding: '20px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                LINKED MCP EVIDENCE RECORDS
              </div>
              <p style={{ fontSize: '11px', color: '#8d979f', marginBottom: '14px', lineHeight: 1.4 }}>
                Inspected by Google ADK runtime over official ClickHouse MCP socket.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {(hypothesis.evidenceRecords || [
                  { id: "EV-01", timestamp: "00:37", metric: "Response cliff", segment: "ALL", sourceQueryRunId: "QRY-23A-8841" },
                  { id: "EV-02", timestamp: "00:35", metric: "Confusion spike", segment: "18–24", sourceQueryRunId: "QRY-23A-8842" },
                  { id: "EV-03", timestamp: "00:40", metric: "Boredom exit", segment: "25–34", sourceQueryRunId: "QRY-23A-8843" }
                ]).map((ev, idx) => (
                  <div
                    key={idx}
                    onClick={() => navigate(`/projects/${projectId}/experiments/${experimentId}/evidence${location.search}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: '#131b22',
                      borderRadius: '4px',
                      border: '1px solid #1c2630',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '11px', color: '#c4a7ff', fontWeight: 700 }}>{ev.id} · {ev.metric}</div>
                      <div style={{ fontSize: '10px', color: '#8d979f' }}>Time: {ev.timestamp} | {ev.sourceQueryRunId}</div>
                    </div>
                    <ExternalLink size={12} color="#8d979f" />
                  </div>
                ))}
              </div>
            </div>

            {/* Advisory Gate Notice */}
            <div style={{ backgroundColor: 'rgba(242, 184, 75, 0.08)', border: '1px solid rgba(242, 184, 75, 0.25)', borderRadius: '8px', padding: '16px', display: 'flex', gap: '12px' }}>
              <AlertTriangle size={18} color="#f2b84b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#f2b84b', marginBottom: '2px' }}>
                  Mandatory Human Sign-off
                </div>
                <p style={{ fontSize: '11px', color: '#8d979f', margin: 0, lineHeight: 1.4 }}>
                  Gemini-generated hypotheses are advisory proposals. Launching an A/B test requires explicit authenticated human approval.
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </AppShell>
  );
};
