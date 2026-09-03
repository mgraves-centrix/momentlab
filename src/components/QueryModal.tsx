import React from 'react';
import { X, Database, Clock, CheckCircle } from 'lucide-react';

interface QueryModalProps {
  queryId: string | null;
  onClose: () => void;
}

export const QueryModal: React.FC<QueryModalProps> = ({ queryId, onClose }) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [queryData, setQueryData] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (!queryId) return;
    setLoading(true);
    setError(null);
    fetch(`/api/v1/telemetry/queries/${queryId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Query details unavailable (${res.status})`);
        return res.json();
      })
      .then((data) => {
        setQueryData(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [queryId]);

  if (!queryId) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#0c1115',
          border: '1px solid #1c2630',
          borderRadius: '12px',
          padding: '24px',
          maxWidth: '680px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #1c2630', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Database size={18} color="#8b5cf6" />
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', letterSpacing: '0.02em' }}>
              CLICKHOUSE QUERY PROVENANCE
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ backgroundColor: 'transparent', border: 'none', color: '#8d979f', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ marginBottom: '12px', fontSize: '11px', color: '#8d979f', fontFamily: 'monospace' }}>
          Query ID: <strong style={{ color: '#58c94b' }}>{queryId}</strong>
        </div>

        {loading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#8d979f', fontSize: '12px' }}>
            Fetching verified ClickHouse SQL execution log...
          </div>
        ) : error ? (
          <div style={{ padding: '16px', backgroundColor: '#211210', border: '1px solid #4a201c', borderRadius: '6px', color: '#ff654a', fontSize: '12px' }}>
            {error}
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', fontSize: '11px', color: '#8d979f' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} color="#c4a7ff" />
                <span>Duration: <strong style={{ color: '#f1f3f2' }}>{queryData?.duration_ms}ms</strong></span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle size={12} color="#58c94b" />
                <span>Read Rows: <strong style={{ color: '#f1f3f2' }}>{queryData?.rows}</strong></span>
              </div>
            </div>

            <div style={{ backgroundColor: '#050a0e', border: '1px solid #162029', borderRadius: '8px', padding: '16px', fontFamily: 'monospace', fontSize: '12px', color: '#c4a7ff', lineHeight: 1.5, overflowX: 'auto', maxHeight: '280px' }}>
              <code>{queryData?.query}</code>
            </div>
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              backgroundColor: '#161e25',
              border: '1px solid #283540',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
