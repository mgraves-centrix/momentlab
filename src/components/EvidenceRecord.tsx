import React, { useState } from 'react';
import { Database, ChevronDown, ChevronUp, Code } from 'lucide-react';
import { EvidenceRecord as EvidenceType } from '../fixtures/northlight';

interface EvidenceRecordProps {
  record: EvidenceType;
}

export const EvidenceRecordCard: React.FC<EvidenceRecordProps> = ({ record }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      style={{
        backgroundColor: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        marginBottom: '12px'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', background: 'var(--surface-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--violet)' }}>
            <Database size={16} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)' }}>
              {record.observedEffect}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--muted)', display: 'flex', gap: '12px', marginTop: '2px' }}>
              <span>ID: <strong style={{ color: 'var(--text)' }}>{record.id}</strong></span>
              <span>Query Run: <span className="tabular-nums" style={{ color: 'var(--text)' }}>{record.queryRunId}</span></span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--violet)', padding: '4px 8px', borderRadius: 'var(--radius-sm)' }}
          aria-expanded={isExpanded}
        >
          <span>{isExpanded ? 'Hide Trace' : 'Inspect SQL'}</span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '10px', lineHeight: 1.4 }}>
        {record.description}
      </p>

      <div style={{ display: 'flex', gap: '16px', marginTop: '12px', fontSize: '11px', color: 'var(--muted)' }}>
        <div>Uncertainty: <strong style={{ color: 'var(--text)' }}>{record.uncertainty}</strong></div>
        <div>Time Range: <strong className="tabular-nums" style={{ color: 'var(--text)' }}>{record.timeRange}</strong></div>
        <div>Sample Size: <strong className="tabular-nums" style={{ color: 'var(--text)' }}>{record.sampleSize.toLocaleString()}</strong></div>
      </div>

      {/* Expanded SQL Trace */}
      {isExpanded && (
        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--muted)', marginBottom: '6px' }}>
            <Code size={12} />
            <span>Executed ClickHouse MCP SQL Statement:</span>
          </div>
          <pre
            style={{
              backgroundColor: 'var(--canvas)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '10px',
              fontFamily: 'monospace',
              fontSize: '11px',
              color: 'var(--violet-soft)',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap'
            }}
          >
            {record.sqlQuery}
          </pre>
        </div>
      )}
    </div>
  );
};
