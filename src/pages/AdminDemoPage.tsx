import React, { useState } from 'react';
import { AppShell } from '../components/AppShell';
import { StatePanel, StateType } from '../components/StatePanel';

export const AdminDemoPage: React.FC = () => {
  const [activeState, setActiveState] = useState<StateType>('insufficient_sample');

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
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '32px 24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
            State Reference Board & Health Controls
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
            Interactive verification of screen 13 edge state behavior and recovery contracts
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
                border: '1px solid var(--border)',
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
        <StatePanel type={activeState} onRetry={() => alert('Retry triggered for state: ' + activeState)} />
      </div>
    </AppShell>
  );
};
