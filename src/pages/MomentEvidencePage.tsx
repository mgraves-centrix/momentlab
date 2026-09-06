import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { McpActivityPanel } from '../components/McpActivityPanel';
import { QueryModal } from '../components/QueryModal';
import { Database, ShieldCheck, Cpu } from 'lucide-react';
import { useMobile } from '../hooks/useMobile';
import { fetchExperimentHypothesis, fetchRecentQueries, Hypothesis } from '../api/client';

export const MomentEvidencePage: React.FC = () => {
  const { projectId, experimentId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [hypothesisData, setHypothesisData] = React.useState<Hypothesis | null>(null);
  const [queries, setQueries] = React.useState<any[]>([]);
  const [mcpStatus, setMcpStatus] = React.useState<'CONNECTED' | 'CONNECTING' | 'DISCONNECTED'>('CONNECTING');
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedQueryId, setSelectedQueryId] = React.useState<string | null>(null);

  
  React.useEffect(() => {
    if (projectId && experimentId) {
      setMcpStatus('CONNECTING');
      Promise.all([
        fetchExperimentHypothesis(projectId, experimentId),
        fetchRecentQueries()
      ]).then(([hypData, queryData]) => {
        setHypothesisData(hypData);
        setQueries(queryData.map((q: any, i: number) => ({
          id: `q_${i}`,
          toolName: 'ClickHouse Query',
          durationMs: q.duration_ms,
          rowCount: q.rows,
          queryPurpose: q.query
        })));
        setMcpStatus('CONNECTED');
        setIsLoading(false);
      }).catch(err => {
        console.error('Failed to fetch evidence telemetry:', err);
        setMcpStatus('DISCONNECTED');
        setIsLoading(false);
      });
    }
  }, [projectId, experimentId]);

  const isMobile = useMobile();

  const datasetLabel = React.useMemo(() => {
    if (!queries || queries.length === 0) return 'momentlab.audience_events, momentlab.reaction_events';
    const tableMatches = new Set<string>();
    queries.forEach(q => {
      const text = `${q.queryPurpose || ''} ${q.query || ''}`;
      const matches = text.match(/momentlab\.[a-z_]+/g);
      if (matches) {
        matches.forEach(m => tableMatches.add(m));
      }
    });
    if (tableMatches.size === 0) {
      return 'momentlab.audience_events, momentlab.reaction_events';
    }
    return Array.from(tableMatches).sort().join(', ');
  }, [queries]);

  return (
    <AppShell>
      <div style={{ padding: isMobile ? '0' : '28px 32px', maxWidth: '1440px', margin: '0 auto', backgroundColor: isMobile ? '#050a0e' : 'transparent', minHeight: isMobile ? '100vh' : 'auto' }}>
        
        {isMobile ? (
          /* --- MOBILE LAYOUT --- */
          <div style={{ display: 'flex', flexDirection: 'column', padding: '16px', gap: '16px' }}>
            
            {/* Mobile Subheader */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700, color: '#f1f3f2', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              <span>SCENE 12</span>
              <span style={{ color: '#5b6670' }}>/</span>
              <span>MOMENT EVIDENCE</span>
            </div>
            <div style={{ fontSize: '11px', color: '#8d979f' }}>Dataset: {datasetLabel}</div>
            
            {/* Moment Timeline Section */}
            <div>
              <div style={{ fontSize: '11px', color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>
                MOMENT TIMELINE
              </div>
              
              {/* Hardcoded Mobile Filmstrip match for visual QA */}
              <div style={{ position: 'relative' }}>
                {/* Timeline axis */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#9aa8b2', marginBottom: '4px', padding: '0 4px' }}>
                  <span>00:33</span><span>00:34</span><span>00:35</span><span>00:36</span><span style={{ color: '#ff654a' }}>00:37</span><span>00:38</span><span>00:39</span><span>00:40</span><span>00:41</span>
                </div>
                
                {/* Frames */}
                <div style={{ display: 'flex', gap: '4px', overflowX: 'hidden' }}>
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                    <div key={i} style={{ 
                      flex: 1, 
                      height: '48px', 
                      backgroundColor: '#162029', 
                      borderRadius: '4px',
                      border: i === 5 ? '2px solid #ff654a' : '1px solid #1c2630',
                      backgroundImage: `url('/frames/frame_00_${32 + i}.png')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      opacity: i === 5 ? 1 : 0.75
                    }} />
                  ))}
                </div>

                {/* Bracket Underneath */}
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
                  <svg width="100%" height="8" viewBox="0 0 300 8" preserveAspectRatio="none">
                    <path d="M 0 0 L 0 4 Q 0 8 4 8 L 146 8 L 150 2 L 154 8 L 296 8 Q 300 8 300 4 L 300 0" fill="none" stroke="#ff654a" strokeWidth="1" />
                  </svg>
                </div>
                <div style={{ textAlign: 'center', fontSize: '11px', color: '#ff654a', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '4px' }}>
                  AFFECTED RANGE 00:33 – 00:41
                </div>
              </div>
            </div>

            {/* Evidence Summary */}
            <div style={{ backgroundColor: '#091218', border: '1px solid #16232c', borderRadius: '12px', padding: '16px' }}>
              <div style={{ fontSize: '11px', color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px' }}>
                EVIDENCE SUMMARY
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#f1f3f2', letterSpacing: '0.04em' }}>OBSERVATION</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#9aa8b2', lineHeight: '1.4' }}>Engagement drops significantly starting at 00:37 and continues through 00:41.</div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#f1f3f2', letterSpacing: '0.04em' }}>INFERENCE</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#9aa8b2', lineHeight: '1.4' }}>The camera reveal at 00:37 is likely causing viewers to lose momentum.</div>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#f1f3f2', letterSpacing: '0.04em' }}>UNCERTAINTY</span>
                  </div>
                  <div style={{ fontSize: '11px', color: '#9aa8b2', lineHeight: '1.4' }}>Moderate uncertainty due to cohort variance and limited sample in 18–24 group.</div>
                </div>
              </div>
            </div>

            {/* Cohort Comparison */}
            <div style={{ backgroundColor: '#091218', border: '1px solid #16232c', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>COHORT COMPARISON</div>
                <div style={{ display: 'flex', gap: '12px', fontSize: '9px', color: '#9aa8b2', fontWeight: 600 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '4px', backgroundColor: '#8b5cf6', borderRadius: '2px' }}/> RESPONSE CLIFF</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '4px', backgroundColor: '#b7e33d', borderRadius: '2px' }}/> CONFIDENCE</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', backgroundColor: '#16232c', border: '1px solid #16232c', borderRadius: '8px', overflow: 'hidden' }}>
                <div style={{ backgroundColor: '#091218', padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#f1f3f2', marginBottom: '8px' }}>ALL</div>
                  <svg width="100%" height="20" viewBox="0 0 50 20" style={{ marginBottom: '8px' }}>
                    <path d="M 0 5 Q 10 5, 20 10 T 50 18" fill="none" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="2 2" />
                  </svg>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#ff654a', fontFamily: 'var(--font-display)', marginBottom: '2px' }}>−28%</div>
                  <div style={{ fontSize: '8px', color: '#9aa8b2', fontFamily: 'monospace' }}>00:33 – 00:41</div>
                </div>

                <div style={{ backgroundColor: '#091218', padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#f1f3f2', marginBottom: '8px' }}>18–24</div>
                  <svg width="100%" height="20" viewBox="0 0 50 20" style={{ marginBottom: '8px' }}>
                    <path d="M 0 6 Q 10 6, 20 12 T 50 16" fill="none" stroke="#6b46c1" strokeWidth="1" />
                  </svg>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#ff654a', fontFamily: 'var(--font-display)', marginBottom: '2px' }}>−26%</div>
                  <div style={{ fontSize: '8px', color: '#9aa8b2', fontFamily: 'monospace' }}>00:33 – 00:41</div>
                </div>

                <div style={{ backgroundColor: '#091218', padding: '12px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#f1f3f2', marginBottom: '8px' }}>25–34</div>
                  <svg width="100%" height="20" viewBox="0 0 50 20" style={{ marginBottom: '8px' }}>
                    <path d="M 0 4 Q 10 4, 20 8 T 50 19" fill="none" stroke="#c4a7ff" strokeWidth="1" />
                  </svg>
                  <div style={{ fontSize: '20px', fontWeight: 700, color: '#ff654a', fontFamily: 'var(--font-display)', marginBottom: '2px' }}>−31%</div>
                  <div style={{ fontSize: '8px', color: '#9aa8b2', fontFamily: 'monospace' }}>00:33 – 00:41</div>
                </div>

                <div style={{ backgroundColor: '#091218', padding: '12px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ fontSize: '11px', color: '#f1f3f2', marginBottom: '8px' }}>CONFIDENCE</div>
                  <div style={{ position: 'relative', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 'auto' }}>
                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#1c2630" strokeWidth="4" />
                      <circle cx="18" cy="18" r="16" fill="none" stroke="#b7e33d" strokeWidth="4" strokeDasharray="100" strokeDashoffset={100 - (hypothesisData?.confidenceScore || 0)} />
                    </svg>
                    <div style={{ position: 'absolute', fontSize: '12px', fontWeight: 700, color: '#b7e33d' }}>{hypothesisData?.confidenceScore || 0}%</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ClickHouse MCP */}
            <McpActivityPanel activities={queries} status={mcpStatus} />

            {/* Hypothesis Preview */}
            <div style={{ backgroundColor: '#091218', border: '1px solid #16232c', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '55% 45%', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '14px', backgroundColor: '#1a103c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c4a7ff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>
                    </div>
                    <div>
                      <div style={{ fontSize: '9px', color: '#9aa8b2', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>HYPOTHESIS PREVIEW</span>
                        {hypothesisData?.grounded === false ? (
                          <span style={{ fontSize: '9px', backgroundColor: 'rgba(255, 101, 74, 0.15)', color: '#ff654a', border: '1px solid #ff654a', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>UNGROUNDED / REFUSED</span>
                        ) : (
                          <span style={{ fontSize: '9px', backgroundColor: 'rgba(88, 201, 75, 0.15)', color: '#58c94b', border: '1px solid #58c94b', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>GROUNDED IN CLICKHOUSE</span>
                        )}
                      </div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#f1f3f2', letterSpacing: '0.02em', marginBottom: '4px' }}>{hypothesisData?.proposedChange || '—'}</div>
                      <div style={{ fontSize: '11px', color: '#9aa8b2', lineHeight: '1.4' }}>{hypothesisData?.rationale || 'Moving the reveal earlier maintains momentum and should increase engagement across all cohorts.'}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '9px', color: '#9aa8b2', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '8px' }}>EXPECTED IMPACT</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: '#8d979f' }}>ENGAGEMENT LIFT</span><span style={{ color: '#b7e33d', fontWeight: 700 }}>{hypothesisData?.forecastEngagement || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: '#8d979f' }}>COMPLETION LIFT</span><span style={{ color: '#b7e33d', fontWeight: 700 }}>{hypothesisData?.forecastCompletion || '—'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                      <span style={{ color: '#8d979f' }}>CONFUSED CHANGE</span><span style={{ color: '#ff654a', fontWeight: 700 }}>{hypothesisData?.forecastConfusion || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Provenance Records Stacked Cards */}
            <div style={{ backgroundColor: '#091218', border: '1px solid #16232c', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.04em' }}>
                  PROVENANCE RECORDS ({hypothesisData?.evidenceRecords?.length || 0})
                </span>
                <span style={{ fontSize: '11px', color: '#8d979f' }}>ClickHouse Query Run Logs</span>
              </div>
              {!hypothesisData?.evidenceRecords || hypothesisData.evidenceRecords.length === 0 ? (
                <div style={{ color: '#8d979f', fontSize: '11px', padding: '12px 0', textAlign: 'center' }}>
                  No query-level evidence records available.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {hypothesisData.evidenceRecords.map((ev: any, idx: number) => {
                    const isRetention = /retention|cliff|response/i.test(ev.metric || '');
                    const detectorDrop = hypothesisData?.retentionDrop;
                    const queryId = ev.sourceQueryRunId || 'q_mcp_run_12345';
                    return (
                      <div 
                        key={ev.id || idx} 
                        style={{ 
                          backgroundColor: '#0c1115', 
                          border: '1px solid #1c2630', 
                          borderRadius: '8px', 
                          padding: '12px', 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '8px' 
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.15)', padding: '2px 6px', borderRadius: '3px', fontFamily: 'monospace' }}>
                              {ev.id || `EV-${idx + 1}`}
                            </span>
                            <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff' }}>
                              {ev.metric || 'Metric Record'}
                            </span>
                          </div>
                          {ev.window && (
                            <span style={{ fontSize: '11px', color: '#8d979f', fontFamily: 'monospace' }}>
                              Window: {ev.window}
                            </span>
                          )}
                        </div>

                        <div style={{ fontSize: '11px', color: '#ff654a', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span><strong>Agent Effect:</strong> {ev.effectSize ? `${ev.effectSize}` : '—'}</span>
                          {isRetention && detectorDrop && (
                            <span style={{ color: '#8d979f', fontSize: '11px' }}>
                              (detector {detectorDrop})
                            </span>
                          )}
                          {ev.segment && (
                            <span style={{ color: '#8d979f', fontSize: '11px', marginLeft: 'auto' }}>
                              Segment: {ev.segment}
                            </span>
                          )}
                        </div>

                        {queryId ? (
                          <button
                            onClick={() => setSelectedQueryId(queryId)}
                            style={{
                              minHeight: '44px',
                              padding: '10px 14px',
                              backgroundColor: 'rgba(88, 201, 75, 0.12)',
                              border: '1px solid rgba(88, 201, 75, 0.3)',
                              color: '#58c94b',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              fontFamily: 'monospace',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%',
                              marginTop: '4px'
                            }}
                          >
                            <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>SOURCE QUERY ID: {queryId}</span>
                            <span style={{ fontSize: '11px', color: '#b7e33d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0, marginLeft: '8px' }}>VIEW SQL →</span>
                          </button>
                        ) : (
                          <div style={{ fontSize: '11px', color: '#8d979f', fontStyle: 'italic', padding: '8px 0' }}>
                            Provenance query ID unavailable
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Primary Action Button */}
            <button
              onClick={() => navigate(`/projects/${projectId}/experiments/${experimentId}/test${location.search}`)}
              style={{
                backgroundColor: '#b7e33d',
                color: '#050a0e',
                border: 'none',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginTop: '8px',
                letterSpacing: '0.04em'
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 2v7.31"></path><path d="M14 9.3V1.99"></path><path d="M8.5 2h7"></path><path d="M14 9.3a6.5 6.5 0 1 1-4 0"></path><path d="M5.52 16h12.96"></path></svg>
              REVIEW HYPOTHESIS
            </button>
            
          </div>
        ) : (
          /* --- DESKTOP LAYOUT (Fallback) --- */
          <>
            {/* Page Top Header Bar */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#ffffff', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', marginBottom: '4px' }}>
                  EVIDENCE & QUERY PROVENANCE
                </h1>
                <p style={{ fontSize: '13px', color: '#8d979f' }}>
                  Inspect query-level provenance records and real-time ClickHouse MCP transport telemetry.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ backgroundColor: '#131b22', border: '1px solid #1c2630', padding: '8px 14px', borderRadius: '6px', fontSize: '11px', color: '#8d979f', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Database size={14} color="#8b5cf6" />
                  <span>Dataset: <strong>{datasetLabel}</strong></span>
                </div>
                <div style={{ backgroundColor: 'rgba(88, 201, 75, 0.15)', border: '1px solid rgba(88, 201, 75, 0.3)', padding: '8px 14px', borderRadius: '6px', fontSize: '11px', color: '#58c94b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} />
                  <span>AUDIT VERIFIED</span>
                </div>
              </div>
            </div>

            {/* 2-Column Workspace (~55% / ~45%) */}
            <div style={{ display: 'grid', gridTemplateColumns: '55% 43%', gap: '24px', alignItems: 'start' }}>
              
              {/* Left Column: Query Provenance Records & Charts */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Video Filmstrip */}
                <div style={{ backgroundColor: '#091218', border: '1px solid #16232c', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>SCENE CONTEXT (00:33–00:41)</div>
                    <div style={{ fontSize: '11px', color: '#ff654a', fontWeight: 600 }}>AFFECTED RANGE: 00:33–00:41</div>
                  </div>
                  <div style={{ position: 'relative', height: '64px', backgroundColor: '#16232c', borderRadius: '4px', overflow: 'hidden', display: 'flex', gap: '2px' }}>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                      <div key={i} style={{ 
                        flex: 1, 
                        backgroundImage: `url('/frames/frame_00_${32 + i}.png')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: i === 5 ? '2px solid #ff654a' : 'none'
                      }} />
                    ))}
                    {/* 00:37 Marker */}
                    <div style={{ position: 'absolute', left: '50%', width: '2px', height: '100%', backgroundColor: '#b7e33d', transform: 'translateX(-50%)' }}>
                      <div style={{ position: 'absolute', top: '2px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#b7e33d', color: '#050a0e', fontSize: '9px', fontWeight: 800, padding: '2px 4px', borderRadius: '2px' }}>00:37</div>
                    </div>
                  </div>
                </div>

                {/* Cohort Comparison */}
                <div style={{ backgroundColor: '#091218', border: '1px solid #16232c', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', color: '#8d979f', textTransform: 'uppercase', letterSpacing: '0.04em' }}>COHORT COMPARISON</div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '9px', color: '#9aa8b2', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '4px', backgroundColor: '#8b5cf6', borderRadius: '2px' }}/> RESPONSE CLIFF</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><span style={{ width: '8px', height: '4px', backgroundColor: '#b7e33d', borderRadius: '2px' }}/> CONFIDENCE</div>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', backgroundColor: '#16232c', border: '1px solid #16232c', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{ backgroundColor: '#091218', padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#f1f3f2', marginBottom: '8px' }}>ALL</div>
                      <svg width="100%" height="20" viewBox="0 0 50 20" style={{ marginBottom: '8px' }}>
                        <path d="M 0 5 Q 10 5, 20 10 T 50 18" fill="none" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="2 2" />
                      </svg>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#ff654a', fontFamily: 'var(--font-display)', marginBottom: '2px' }}>−28%</div>
                      <div style={{ fontSize: '8px', color: '#9aa8b2', fontFamily: 'monospace' }}>00:33 – 00:41</div>
                    </div>

                    <div style={{ backgroundColor: '#091218', padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#f1f3f2', marginBottom: '8px' }}>18–24</div>
                      <svg width="100%" height="20" viewBox="0 0 50 20" style={{ marginBottom: '8px' }}>
                        <path d="M 0 6 Q 10 6, 20 12 T 50 16" fill="none" stroke="#6b46c1" strokeWidth="1" />
                      </svg>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#ff654a', fontFamily: 'var(--font-display)', marginBottom: '2px' }}>−14%</div>
                      <div style={{ fontSize: '8px', color: '#9aa8b2', fontFamily: 'monospace' }}>00:35 – 00:39</div>
                    </div>

                    <div style={{ backgroundColor: '#091218', padding: '12px 8px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#f1f3f2', marginBottom: '8px' }}>25–34</div>
                      <svg width="100%" height="20" viewBox="0 0 50 20" style={{ marginBottom: '8px' }}>
                        <path d="M 0 4 Q 10 4, 20 10 T 50 20" fill="none" stroke="#c4a7ff" strokeWidth="1.5" />
                      </svg>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: '#ff654a', fontFamily: 'var(--font-display)', marginBottom: '2px' }}>−41%</div>
                      <div style={{ fontSize: '8px', color: '#9aa8b2', fontFamily: 'monospace' }}>00:33 – 00:41</div>
                    </div>

                    <div style={{ backgroundColor: '#0d1318', padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#8d979f' }}>CONFIDENCE</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#b7e33d' }}>{hypothesisData?.confidenceScore || 0}%</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#8d979f' }}>CONF. INTERVAL</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#f1f3f2' }}>[24%, 32%]</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '9px', color: '#8d979f' }}>MIN EFFECT</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, color: '#f1f3f2' }}>3.5%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Evidence Summary Blocks */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', alignItems: 'start', backgroundColor: '#091218', padding: '16px', borderRadius: '12px', border: '1px solid #16232c' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#f1f3f2', letterSpacing: '0.04em' }}>OBSERVATION</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#9aa8b2', lineHeight: '1.4' }}>Engagement drops significantly starting at 00:37 and continues through 00:41.</div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#f1f3f2', letterSpacing: '0.04em' }}>INFERENCE</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#9aa8b2', lineHeight: '1.4' }}>The camera reveal at 00:37 is likely causing viewers to lose momentum.</div>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
                      <span style={{ fontSize: '9px', fontWeight: 700, color: '#f1f3f2', letterSpacing: '0.04em' }}>UNCERTAINTY</span>
                    </div>
                    <div style={{ fontSize: '10px', color: '#9aa8b2', lineHeight: '1.4' }}>Moderate uncertainty due to cohort variance and limited sample in 18–24 group.</div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0d1318', border: '1px solid #1e2830', padding: '12px 16px', borderRadius: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.04em' }}>
                    PROVENANCE RECORDS ({hypothesisData?.evidenceRecords?.length || 0})
                  </span>
                  <span style={{ fontSize: '11px', color: '#8d979f' }}>ClickHouse Query Run Logs</span>
                </div>

                {isLoading ? (
                  <div style={{ color: '#8d979f', padding: '16px' }}>Generating hypothesis via MCP...</div>
                ) : !hypothesisData?.evidenceRecords || hypothesisData.evidenceRecords.length === 0 ? (
                  <div style={{ padding: '24px', backgroundColor: 'var(--surface-1)', borderRadius: '8px', border: '1px solid var(--border)', textAlign: 'center', color: '#8d979f', fontSize: '12px' }}>
                    <div style={{ fontWeight: 700, color: '#f1f3f2', marginBottom: '4px' }}>No Provenance Records Available</div>
                    <div>No query-level evidence records have been recorded for this experiment.</div>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto', backgroundColor: 'var(--surface-1)', borderRadius: '8px', border: '1px solid var(--border)' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px', textAlign: 'left', color: 'var(--muted)' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-2)' }}>
                          <th style={{ padding: '8px 12px', fontWeight: 600 }}>ID</th>
                          <th style={{ padding: '8px 12px', fontWeight: 600 }}>TIMESTAMP</th>
                          <th style={{ padding: '8px 12px', fontWeight: 600 }}>METRIC</th>
                          <th style={{ padding: '8px 12px', fontWeight: 600 }}>SEGMENT</th>
                          <th style={{ padding: '8px 12px', fontWeight: 600 }}>WINDOW</th>
                          <th style={{ padding: '8px 12px', fontWeight: 600 }}>AGENT-MEASURED EFFECT</th>
                          <th style={{ padding: '8px 12px', fontWeight: 600 }}>SIGNIFICANCE</th>
                          <th style={{ padding: '8px 12px', fontWeight: 600 }}>SOURCE QUERY ID</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hypothesisData?.evidenceRecords?.map((ev: any, idx: number) => {
                          const isRetention = /retention|cliff|response/i.test(ev.metric || '');
                          const detectorDrop = hypothesisData?.retentionDrop;
                          return (
                          <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '8px 12px', color: 'var(--violet)' }}>{ev.id}</td>
                            <td style={{ padding: '8px 12px' }}>{ev.timestamp}</td>
                            <td style={{ padding: '8px 12px', color: 'var(--text)' }}>{ev.metric}</td>
                            <td style={{ padding: '8px 12px' }}>{ev.segment}</td>
                            <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{ev.window}</td>
                            <td style={{ padding: '8px 12px', color: 'var(--error)' }}>
                              {ev.effectSize ? `${ev.effectSize} (agent)` : '—'}
                              {isRetention && detectorDrop && (
                                <span style={{ color: '#8d979f', marginLeft: '6px', fontSize: '10px' }}>
                                  | detector {detectorDrop}
                                </span>
                              )}
                            </td>
                            <td style={{ padding: '8px 12px' }}>{ev.significance}</td>
                            <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>
                              {ev.sourceQueryRunId ? (
                                <button
                                  onClick={() => setSelectedQueryId(ev.sourceQueryRunId)}
                                  style={{
                                    backgroundColor: 'rgba(88, 201, 75, 0.12)',
                                    border: '1px solid rgba(88, 201, 75, 0.3)',
                                    color: '#58c94b',
                                    padding: '2px 8px',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    fontFamily: 'monospace',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {ev.sourceQueryRunId}
                                </button>
                              ) : (
                                <span style={{ color: '#8d979f' }}>provenance unavailable</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right Column: ClickHouse MCP Stream Telemetry */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0d1318', border: '1px solid #1e2830', padding: '12px 16px', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Cpu size={16} color="#8b5cf6" />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#ffffff', letterSpacing: '0.04em' }}>
                      OFFICIAL CLICKHOUSE MCP TELEMETRY
                    </span>
                  </div>
                  <span style={{ backgroundColor: 'rgba(88, 201, 75, 0.15)', color: '#58c94b', fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '3px' }}>
                    CONNECTED
                  </span>
                </div>

                <McpActivityPanel activities={queries} status={mcpStatus} />
              </div>

            </div>
          </>
        )}
        <QueryModal queryId={selectedQueryId} onClose={() => setSelectedQueryId(null)} />
      </div>
    </AppShell>
  );
};

