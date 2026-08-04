import React from 'react';
import { AlertCircle, RefreshCw, Lock, WifiOff, Users, Loader2 } from 'lucide-react';

export type StateType =
  | 'loading'
  | 'insufficient_sample'
  | 'mcp_connecting'
  | 'mcp_error'
  | 'permission_denied'
  | 'offline_stale';

interface StatePanelProps {
  type: StateType;
  message?: string;
  onRetry?: () => void;
}

export const StatePanel: React.FC<StatePanelProps> = ({
  type,
  message,
  onRetry
}) => {
  const getIcon = () => {
    switch (type) {
      case 'loading':
        return <Loader2 size={32} className="spin" color="var(--violet)" />;
      case 'insufficient_sample':
        return <Users size={32} color="var(--warning)" />;
      case 'mcp_connecting':
        return <RefreshCw size={32} className="spin" color="var(--violet-soft)" />;
      case 'mcp_error':
        return <AlertCircle size={32} color="var(--coral)" />;
      case 'permission_denied':
        return <Lock size={32} color="var(--coral)" />;
      case 'offline_stale':
        return <WifiOff size={32} color="var(--muted)" />;
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'loading':
        return 'Loading Workspace Data...';
      case 'insufficient_sample':
        return 'INSUFFICIENT_SAMPLE (< 100 Respondents)';
      case 'mcp_connecting':
        return 'Establishing ClickHouse MCP Connection...';
      case 'mcp_error':
        return 'ClickHouse MCP Connection Disconnected';
      case 'permission_denied':
        return 'Permission Denied';
      case 'offline_stale':
        return 'Offline — Displaying Stale Cached Snapshot';
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'loading':
        return 'Fetching second-by-second audience timelines and scene metadata.';
      case 'insufficient_sample':
        return 'Minimum 100 consented respondent completions required before statistical anomaly detection activates.';
      case 'mcp_connecting':
        return 'Negotiating transport stream with official ClickHouse MCP server.';
      case 'mcp_error':
        return 'Unable to query ClickHouse MCP stream. Displaying last-known cached evidence trace.';
      case 'permission_denied':
        return 'Authenticated reviewer identity required to access experiment controls.';
      case 'offline_stale':
        return 'Network connection interrupted. Local cached fixtures active.';
    }
  };

  return (
    <div
      style={{
        backgroundColor: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '32px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px'
      }}
    >
      <div style={{ marginBottom: '4px' }}>{getIcon()}</div>
      <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)' }}>{getTitle()}</h3>
      <p style={{ fontSize: '12px', color: 'var(--muted)', maxWidth: '420px', lineHeight: 1.5 }}>
        {message || getDefaultMessage()}
      </p>

      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            marginTop: '8px',
            backgroundColor: 'var(--surface-3)',
            border: '1px solid var(--border)',
            color: 'var(--text)',
            padding: '8px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <RefreshCw size={14} />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};
