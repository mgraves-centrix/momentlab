import React from 'react';
import { useNavigate, Link, useParams, useLocation } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { HypothesisCard } from '../components/HypothesisCard';
import { ConfidenceMeter } from '../components/ConfidenceMeter';
import { fetchExperimentHypothesis, fetchExperimentSummary, Hypothesis, ExperimentSummary } from '../api/client';
import { ExternalLink, AlertTriangle, ChevronRight } from 'lucide-react';

export const EditHypothesisPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId, experimentId } = useParams();
  const [hypothesis, setHypothesis] = React.useState<Hypothesis | null>(null);
  const [summaryData, setSummaryData] = React.useState<ExperimentSummary | null>(null);

  React.useEffect(() => {
    if (projectId && experimentId) {
      fetchExperimentHypothesis(projectId, experimentId).then(setHypothesis);
      fetchExperimentSummary(projectId, experimentId).then(setSummaryData);
    }
  }, [projectId, experimentId]);

  if (!hypothesis) {
    return (
      <AppShell>
        <div style={{ padding: '40px', color: '#fff' }}>Loading hypothesis...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 32px' }}>
        {/* Page Top Header Bar */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
              HYPOTHESIS REVIEW & AGENT RECOMMENDATION
            </h1>
            <p style={{ fontSize: '13px', color: '#8d979f' }}>
              Inspect Gemini on Vertex AI edit proposal prior to mandatory human approval gate.
            </p>
          </div>

          <button
            onClick={() => navigate(`/projects/${projectId}/experiments/${experimentId}/test${location.search}`)}
            style={{
              backgroundColor: '#b7e33d',
              color: '#080b0e',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              letterSpacing: '0.04em'
            }}
          >
            <span>PROCEED TO A/B TEST APPROVAL</span>
            <ChevronRight size={16} strokeWidth={2.5} />
          </button>
        </div>

        {/* 2-Column Workspace (~62% / ~38%) */}
        <div style={{ display: 'grid', gridTemplateColumns: '62% 35%', gap: '24px', alignItems: 'start' }}>
          
          {/* Left Column: Proposal & Rationale */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <HypothesisCard
              hypothesis={hypothesis}
              onApproveClick={() => navigate(`/projects/${projectId}/experiments/${experimentId}/test${location.search}`)}
            />

            {/* Linked ClickHouse Evidence Trace */}
            <div style={{ backgroundColor: '#0d1318', border: '1px solid #1e2830', borderRadius: '10px', padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 700, color: '#ffffff', marginBottom: '8px', letterSpacing: '0.04em' }}>
                LINKED CLICKHOUSE EVIDENCE PROVENANCE
              </h3>
              <p style={{ fontSize: '12px', color: '#8d979f', marginBottom: '14px', lineHeight: 1.5 }}>
                The edit hypothesis was synthesized by Google ADK agent after executing queries against second-by-second reaction timelines in ClickHouse Cloud.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {hypothesis.evidenceRecords?.map((ev, idx) => (
                  <Link
                    key={idx}
                    to={`/projects/${projectId}/experiments/${experimentId}/evidence${location.search}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: '#c4a7ff',
                      fontSize: '12px',
                      fontWeight: 700,
                      textDecoration: 'none',
                      backgroundColor: '#161e25',
                      padding: '8px 14px',
                      borderRadius: '6px',
                      border: '1px solid #283540'
                    }}
                  >
                    <span>View Provenance Record {ev.id} in ClickHouse MCP</span>
                    <ExternalLink size={14} />
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Model Confidence & Risk Notice */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <ConfidenceMeter
              confidencePercent={hypothesis.confidenceScore}
              sampleSize={summaryData?.total_respondents || 0}
            />

            {/* Simulated Forecast Card */}
            <div style={{ backgroundColor: '#0d1318', border: '1px solid #1e2830', borderRadius: '10px', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                  SIMULATED FORECAST METRICS
                </h3>
                <span className="badge badge-simulated">SIMULATED</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', textAlign: 'center' }}>
                <div style={{ backgroundColor: '#131b22', padding: '12px 8px', borderRadius: '6px', border: '1px solid #1c2630' }}>
                  <div style={{ fontSize: '9px', color: '#8d979f', textTransform: 'uppercase' }}>ENGAGEMENT LIFT</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#58c94b', marginTop: '2px' }} className="tabular-nums">{hypothesis.forecastEngagement}</div>
                </div>

                <div style={{ backgroundColor: '#131b22', padding: '12px 8px', borderRadius: '6px', border: '1px solid #1c2630' }}>
                  <div style={{ fontSize: '9px', color: '#8d979f', textTransform: 'uppercase' }}>COMPLETION LIFT</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#58c94b', marginTop: '2px' }} className="tabular-nums">{hypothesis.forecastCompletion}</div>
                </div>

                <div style={{ backgroundColor: '#131b22', padding: '12px 8px', borderRadius: '6px', border: '1px solid #1c2630' }}>
                  <div style={{ fontSize: '9px', color: '#8d979f', textTransform: 'uppercase' }}>CONFUSION</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#c4a7ff', marginTop: '2px' }} className="tabular-nums">{hypothesis.forecastConfusion}</div>
                </div>
              </div>
            </div>

            {/* Agent Run Trace Panel */}
            {hypothesis.trace && (
              <div style={{ backgroundColor: '#0d1318', border: '1px solid #1e2830', borderRadius: '10px', padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em' }}>
                    AGENT RUN TRACE
                  </h3>
                  <span style={{ fontSize: '11px', color: '#8d979f', fontFamily: 'monospace' }}>
                    {hypothesis.trace.totalDurationMs}ms
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {hypothesis.trace.steps.map((step, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', padding: '8px', backgroundColor: '#131b22', borderRadius: '4px', border: '1px solid #1c2630' }}>
                      <span style={{ color: '#c4a7ff', fontWeight: 600 }}>{step.name}</span>
                      <span style={{ color: step.status === 'success' ? '#58c94b' : '#ff654a' }}>{step.durationMs}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Agent Risk & Limitation Callout */}
            <div style={{ backgroundColor: 'rgba(242, 184, 75, 0.1)', border: '1px solid rgba(242, 184, 75, 0.3)', borderRadius: '10px', padding: '16px', display: 'flex', gap: '12px' }}>
              <AlertTriangle size={20} color="#f2b84b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', marginBottom: '2px' }}>
                  Agent Limitations & Risk Notice
                </div>
                <p style={{ fontSize: '11px', color: '#8d979f', margin: 0, lineHeight: 1.4 }}>
                  Edit proposals are advisory machine predictions based on aggregated response data. Approval requires explicit human sign-off.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
};
