import React from 'react';
import { AlertCircle, RefreshCw, Lock, WifiOff, Users, Loader2, FolderX, Cpu, FileCheck, Hourglass, CheckCircle2, XCircle, HelpCircle } from 'lucide-react';

export type StateType =
  | 'loading'
  | 'no_projects'
  | 'insufficient_sample'
  | 'mcp_connecting'
  | 'mcp_error'
  | 'investigating'
  | 'hypothesis_ready'
  | 'awaiting_approval'
  | 'test_running'
  | 'outcome_supported'
  | 'outcome_rejected'
  | 'outcome_inconclusive'
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
      case 'no_projects':
        return <FolderX size={32} color="var(--muted)" />;
      case 'insufficient_sample':
        return <Users size={32} color="var(--warning)" />;
      case 'mcp_connecting':
        return <RefreshCw size={32} className="spin" color="var(--violet-soft)" />;
      case 'mcp_error':
        return <AlertCircle size={32} color="var(--coral)" />;
      case 'investigating':
        return <Cpu size={32} className="spin" color="var(--violet)" />;
      case 'hypothesis_ready':
        return <FileCheck size={32} color="var(--lime)" />;
      case 'awaiting_approval':
        return <Hourglass size={32} color="var(--warning)" />;
      case 'test_running':
        return <RefreshCw size={32} className="spin" color="var(--lime)" />;
      case 'outcome_supported':
        return <CheckCircle2 size={32} color="var(--success)" />;
      case 'outcome_rejected':
        return <XCircle size={32} color="var(--coral)" />;
      case 'outcome_inconclusive':
        return <HelpCircle size={32} color="var(--warning)" />;
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
      case 'no_projects':
        return 'No Projects Found';
      case 'insufficient_sample':
        return 'INSUFFICIENT_SAMPLE (< 100 Respondents)';
      case 'mcp_connecting':
        return 'Establishing ClickHouse MCP Connection...';
      case 'mcp_error':
        return 'ClickHouse MCP Connection Disconnected';
      case 'investigating':
        return 'Agent Investigating ClickHouse Telemetry...';
      case 'hypothesis_ready':
        return 'Edit Hypothesis Formulated (91% Confidence)';
      case 'awaiting_approval':
        return 'Awaiting Server-Signed Human Approval';
      case 'test_running':
        return 'A/B Screening Test Active';
      case 'outcome_supported':
        return 'Hypothesis Supported (+18.2% Lift)';
      case 'outcome_rejected':
        return 'Hypothesis Rejected (No Engagement Lift)';
      case 'outcome_inconclusive':
        return 'Outcome Inconclusive (Insufficient Variance)';
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
      case 'no_projects':
        return 'No active film projects found. Click "NEW PROJECT" to initialize a project workspace.';
      case 'insufficient_sample':
        return 'Minimum 100 consented respondent completions required before statistical anomaly detection activates.';
      case 'mcp_connecting':
        return 'Negotiating transport stream with official ClickHouse MCP server.';
      case 'mcp_error':
        return 'Unable to query ClickHouse MCP stream. Displaying last-known cached evidence trace.';
      case 'investigating':
        return 'Google ADK agent is running analytical queries against ClickHouse retention stream.';
      case 'hypothesis_ready':
        return 'Gemini on Vertex AI has generated a falsifiable edit recommendation: "MOVE REVEAL 6S EARLIER".';
      case 'awaiting_approval':
        return 'Launch blocked pending explicit reviewer sign-off and cryptographic approval signature.';
      case 'test_running':
        return 'Cut A vs Cut B active screening experiment in progress across registered respondents.';
      case 'outcome_supported':
        return 'Variant Cut B demonstrates statistically significant retention improvement (p < 0.001).';
      case 'outcome_rejected':
        return 'Variant Cut B did not achieve target engagement lift. Control Cut A retained as primary edit.';
      case 'outcome_inconclusive':
        return 'Sample variance exceeds threshold. Recommend extending screening sample size.';
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
      <p style={{ fontSize: '12px', color: 'var(--muted)', maxWidth: '440px', lineHeight: 1.5 }}>
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
            gap: '6px',
            cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} />
          <span>Retry Operation</span>
        </button>
      )}
    </div>
  );
};
