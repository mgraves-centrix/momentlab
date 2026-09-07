import React, { useState, useEffect } from 'react';
import { AppShell } from '../components/AppShell';
import { StatePanel, StateType } from '../components/StatePanel';
import { Activity, RefreshCw, AlertTriangle, CheckCircle, Database, Server, Check } from 'lucide-react';
import { useMobile } from '../hooks/useMobile';
import { plural } from '../utils/format';

interface HealthData {
  status: string;
  database_connected: boolean;
  buffered_events: number;
  timelineRows?: number;
  lastChecked?: string;
  error?: string;
}

export const AdminDemoPage: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [isHealthLoading, setIsHealthLoading] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [resetConfirmed, setResetConfirmed] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [activeState, setActiveState] = useState<StateType>('insufficient_sample');
  const isMobile = useMobile();

  const fetchHealth = () => {
    setIsHealthLoading(true);
    Promise.all([
      fetch('/health').then(r => r.json()),
      fetch('/api/v1/telemetry/timeline?project_id=proj_northlight_01&experiment_id=exp_23a').then(r => r.json())
    ]).then(([healthData, timelineData]) => {
      setHealth({
        ...healthData,
        timelineRows: Array.isArray(timelineData) ? timelineData.length : 0,
        lastChecked: new Date().toLocaleTimeString(),
        error: undefined
      });
      setIsHealthLoading(false);
    }).catch((err) => {
      setHealth({
        status: 'UNREACHABLE',
        database_connected: false,
        buffered_events: 0,
        timelineRows: 0,
        lastChecked: new Date().toLocaleTimeString(),
        error: err?.message || 'Failed to connect to backend engine'
      });
      setIsHealthLoading(false);
    });
  };

  useEffect(() => {
    Promise.all([
      fetch('/health').then(r => r.json()),
      fetch('/api/v1/telemetry/timeline?project_id=proj_northlight_01&experiment_id=exp_23a').then(r => r.json())
    ]).then(([healthData, timelineData]) => {
      setHealth({
        ...healthData,
        timelineRows: Array.isArray(timelineData) ? timelineData.length : 0,
        lastChecked: new Date().toLocaleTimeString(),
        error: undefined
      });
    }).catch((err) => {
      setHealth({
        status: 'UNREACHABLE',
        database_connected: false,
        buffered_events: 0,
        timelineRows: 0,
        lastChecked: new Date().toLocaleTimeString(),
        error: err?.message || 'Failed to connect to backend engine'
      });
    });
  }, []);

  const handleResetTelemetry = async () => {
    if (!resetConfirmed) return;
    setIsResetting(true);
    setResetMessage(null);
    try {
      const res = await fetch('/api/v1/telemetry/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: 'proj_northlight_01',
          experiment_id: 'exp_23a',
          sample_size: 525
        })
      });
      if (!res.ok) {
        throw new Error(`Reset failed with HTTP status ${res.status}`);
      }
      const data = await res.json();
      setResetMessage(`Success: Reseeded ${data.reseeded_respondents} ${plural(data.reseeded_respondents, 'respondent')} (${data.total_events_inserted} ${plural(data.total_events_inserted, 'event')}).`);
      setResetConfirmed(false);
      fetchHealth();
    } catch (e: any) {
      setResetMessage(`Reset failed: ${e.message || 'Unknown error'}`);
    } finally {
      setIsResetting(false);
    }
  };

  const states: { type: StateType; label: string }[] = [
    { type: 'loading', label: '1. Loading Skeleton' },
    { type: 'no_projects', label: '2. No Projects' },
    { type: 'insufficient_sample', label: '3. Insufficient Sample (<100)' },
    { type: 'mcp_connecting', label: '4. MCP Connecting' },
    { type: 'mcp_error', label: '5. MCP Disconnected / Error' },
    { type: 'investigating', label: '6. Agent Investigating' },
    { type: 'hypothesis_ready', label: '7. Hypothesis Ready' },
    { type: 'awaiting_approval', label: '8. Awaiting Approval' },
    { type: 'test_running', label: '9. Test Running' },
    { type: 'outcome_supported', label: '10. Outcome Supported' },
    { type: 'outcome_rejected', label: '11. Outcome Rejected' },
    { type: 'outcome_inconclusive', label: '12. Outcome Inconclusive' },
    { type: 'permission_denied', label: '13. Permission Denied' },
    { type: 'offline_stale', label: '14. Offline / Stale Cache' }
  ];

  return (
    <AppShell>
      <div style={{ maxWidth: '1100px', width: '100%', boxSizing: 'border-box', overflowX: 'hidden', margin: '0 auto', padding: isMobile ? '16px' : '32px 24px' }}>
        
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: isMobile ? '20px' : '24px', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text)', letterSpacing: '-0.02em', margin: 0 }}>
              System Health & Demo Operations
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
              Live ClickHouse telemetry diagnostics, idempotent seeder controls, and Screen 13 state verification
            </p>
          </div>

          <button
            onClick={fetchHealth}
            disabled={isHealthLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <RefreshCw size={14} style={{ animation: isHealthLoading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh Health
          </button>
        </div>

        {/* Top Controls Grid: Live Health Panel & Telemetry Reset Panel */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', marginBottom: '32px' }}>
          
          {/* 1. Live Health Panel */}
          <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Server size={16} color="var(--lime)" />
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Live Engine Health
                </h3>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {health?.status === 'HEALTHY' ? (
                  <span style={{ backgroundColor: 'rgba(88, 201, 75, 0.15)', color: '#58c94b', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckCircle size={12} />
                    HEALTHY
                  </span>
                ) : (
                  <span style={{ backgroundColor: 'rgba(255, 101, 74, 0.15)', color: '#ff654a', fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <AlertTriangle size={12} />
                    {health?.status || 'CHECKING'}
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
              <div style={{ backgroundColor: 'var(--surface-2)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>CLICKHOUSE ADAPTER</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: health?.database_connected ? 'var(--text)' : '#ff654a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Database size={14} color={health?.database_connected ? 'var(--lime)' : '#ff654a'} />
                  {health?.database_connected ? 'CONNECTED' : 'DISCONNECTED'}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--surface-2)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>BUFFERED EVENTS</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)' }}>
                  {health?.buffered_events ?? 0}
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--surface-2)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>ACTIVE EXPERIMENT</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--violet)' }}>
                  proj_northlight_01 / exp_23a
                </div>
              </div>

              <div style={{ backgroundColor: 'var(--surface-2)', padding: '12px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', textTransform: 'uppercase', marginBottom: '4px' }}>TIMELINE BUCKETS</div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--lime)' }}>
                  {health?.timelineRows ?? 0} {plural(health?.timelineRows ?? 0, 'row')} (00:00–01:00)
                </div>
              </div>
            </div>

            <div style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Endpoint: <code>GET /health</code></span>
              <span>Last checked: {health?.lastChecked || 'just now'}</span>
            </div>
          </div>

          {/* 2. Telemetry Reset & Seeder Panel */}
          <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Activity size={16} color="#ff654a" />
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Audience Telemetry Reset
                </h3>
              </div>

              <p style={{ fontSize: '12px', color: 'var(--muted)', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                <strong>Blast Radius:</strong> Clears all 30,358+ rows for Northlight (<code>exp_23a</code>) in ClickHouse <code>audience_events</code> and re-seeds clean, second-by-second telemetry with the 00:37 cliff (-28.0%, N=525).
              </p>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text)', cursor: 'pointer', marginBottom: '16px' }}>
                <input
                  type="checkbox"
                  checked={resetConfirmed}
                  onChange={(e) => setResetConfirmed(e.target.checked)}
                  style={{ accentColor: 'var(--lime)', cursor: 'pointer' }}
                />
                <span>I confirm resetting telemetry for <strong>proj_northlight_01 / exp_23a</strong></span>
              </label>
            </div>

            <div>
              {resetMessage && (
                <div style={{ fontSize: '11px', color: 'var(--lime)', backgroundColor: 'rgba(183, 227, 61, 0.1)', padding: '8px 12px', borderRadius: '4px', marginBottom: '12px' }}>
                  {resetMessage}
                </div>
              )}

              <button
                onClick={handleResetTelemetry}
                disabled={!resetConfirmed || isResetting}
                style={{
                  width: '100%',
                  backgroundColor: resetConfirmed ? 'var(--lime)' : 'var(--surface-3)',
                  color: resetConfirmed ? '#000000' : 'var(--muted)',
                  border: 'none',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: resetConfirmed && !isResetting ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.15s ease'
                }}
              >
                {isResetting ? <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={14} />}
                RESEED AUDIENCE TELEMETRY (N=525)
              </button>
            </div>
          </div>

        </div>

        {/* Section Divider */}
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '28px', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text)', marginBottom: '6px' }}>
            System State Reference & Edge Condition Verification
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '16px' }}>
            Verify all 14 visual component states and recovery UI workflows from specification Screen 13
          </p>
        </div>

        {/* State Switcher Buttons */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
          {states.map((s) => (
            <button
              key={s.type}
              onClick={() => setActiveState(s.type)}
              style={{
                backgroundColor: activeState === s.type ? 'var(--violet)' : 'var(--surface-1)',
                color: activeState === s.type ? '#fff' : 'var(--muted)',
                border: `1px solid ${activeState === s.type ? 'var(--violet)' : 'var(--border)'}`,
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Active State Preview Panel */}
        <StatePanel 
          type={activeState} 
          onRetry={() => {
            fetchHealth();
            setResetMessage(`Retried state: ${activeState} at ${new Date().toLocaleTimeString()}`);
          }} 
        />
      </div>
    </AppShell>
  );
};
