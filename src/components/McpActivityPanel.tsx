import React from 'react';
import { Activity, CheckCircle, Clock } from 'lucide-react';
import { McpActivity } from '../types/northlight';

interface McpActivityPanelProps {
  activities: McpActivity[];
  status?: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
}

export const McpActivityPanel: React.FC<McpActivityPanelProps> = ({
  activities,
  status = 'CONNECTED'
}) => {
  return (
    <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Activity size={16} color="var(--violet)" />
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>ClickHouse MCP Telemetry Trail</h3>
        </div>
        <span className={`badge ${status === 'CONNECTED' ? 'badge-connected' : status === 'CONNECTING' ? 'badge-simulated' : 'badge-disconnected'}`}>
          {status}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {activities.length > 0 ? (
          activities.map((act) => (
            <div
              key={act.id}
              style={{
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                fontSize: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontFamily: 'monospace', color: 'var(--violet-soft)', fontWeight: 600 }}>
                  {act.toolName}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--muted)', fontSize: '11px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <Clock size={11} />
                    <span className="tabular-nums">{act.durationMs}ms</span>
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--success)' }}>
                    <CheckCircle size={11} />
                    <span className="tabular-nums">{act.rowCount} rows</span>
                  </span>
                </div>
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '11px', lineHeight: 1.4, wordBreak: 'break-word', fontFamily: 'monospace' }}>
                {act.queryPurpose}
              </div>
            </div>
          ))
        ) : (
          <div style={{ padding: '16px', backgroundColor: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)', textAlign: 'center', color: 'var(--muted)', fontSize: '11px', lineHeight: 1.5 }}>
            <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: 'var(--text)' }}>Telemetry Audit Stream Ready</p>
            <p style={{ margin: 0 }}>MCP analytical queries execute in ClickHouse upon playback ingestion and ADK inference runs.</p>
          </div>
        )}
      </div>
    </div>
  );
};
