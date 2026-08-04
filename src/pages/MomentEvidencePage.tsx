import React from 'react';
import { AppShell } from '../components/AppShell';
import { EvidenceRecordCard } from '../components/EvidenceRecord';
import { McpActivityPanel } from '../components/McpActivityPanel';
import { NORTHLIGHT_EVIDENCE, NORTHLIGHT_MCP_ACTIVITIES } from '../fixtures/northlight';

export const MomentEvidencePage: React.FC = () => {
  return (
    <AppShell>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
            Evidence & ClickHouse MCP Telemetry
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
            Inspect query-level provenance records and real-time ClickHouse MCP transport logs
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
              Query Provenance Records
            </h2>
            {NORTHLIGHT_EVIDENCE.map((rec) => (
              <EvidenceRecordCard key={rec.id} record={rec} />
            ))}
          </div>

          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '12px' }}>
              Live Telemetry Stream
            </h2>
            <McpActivityPanel activities={NORTHLIGHT_MCP_ACTIVITIES} status="CONNECTED" />
          </div>
        </div>
      </div>
    </AppShell>
  );
};
