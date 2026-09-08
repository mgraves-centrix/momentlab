import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { McpActivity } from '../types/northlight';
import { plural } from '../utils/format';

interface McpActivityPanelProps {
  activities: McpActivity[];
  status?: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED';
}

export const McpActivityPanel: React.FC<McpActivityPanelProps> = ({
  activities,
  status = 'CONNECTED'
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  const totalItems = activities.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Reset to page 1 if current page is out of range due to activities or pageSize changes
  useEffect(() => {
    if (page > totalPages) {
      setPage(1);
    }
  }, [totalItems, pageSize, totalPages, page]);

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const pagedActivities = activities.slice(startIndex, endIndex);

  const showPaginationControls = totalItems > pageSize;

  return (
    <div
      style={{
        backgroundColor: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        maxWidth: '100%',
        boxSizing: 'border-box'
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: isCollapsed ? 0 : '16px',
          gap: '8px',
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <Activity size={16} color="var(--violet)" />
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', margin: 0 }}>
            ClickHouse MCP Telemetry Trail
          </h3>
          {isCollapsed && (
            <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>
              ({totalItems} {plural(totalItems, 'query', 'queries')})
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            className={`badge ${
              status === 'CONNECTED'
                ? 'badge-connected'
                : status === 'CONNECTING'
                ? 'badge-simulated'
                : 'badge-disconnected'
            }`}
          >
            {status}
          </span>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expand telemetry trail' : 'Collapse telemetry trail'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'transparent',
              color: 'var(--muted)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px',
              cursor: 'pointer',
              minHeight: '28px',
              minWidth: '28px'
            }}
          >
            {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Top Controls Row (Showing count + page size selector) */}
          {totalItems > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap',
                fontSize: '11px',
                color: 'var(--muted)'
              }}
            >
              <span>
                Showing <span className="tabular-nums">{startIndex + 1}</span>-
                <span className="tabular-nums">{endIndex}</span> of{' '}
                <span className="tabular-nums">{totalItems}</span>
              </span>

              {(totalItems > 10 || showPaginationControls) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontWeight: 500 }}>Per page:</span>
                  {[10, 25].map((size) => {
                    const isSelected = pageSize === size;
                    return (
                      <button
                        key={size}
                        type="button"
                        onClick={() => {
                          setPageSize(size);
                          setPage(1);
                        }}
                        aria-label={`Show ${size} items per page`}
                        style={{
                          backgroundColor: isSelected ? 'var(--surface-3)' : 'transparent',
                          color: isSelected ? 'var(--text)' : 'var(--muted)',
                          border: `1px solid ${isSelected ? 'var(--violet)' : 'var(--border)'}`,
                          borderRadius: 'var(--radius-sm)',
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          minHeight: '24px'
                        }}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Activities List / Empty State */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {pagedActivities.length > 0 ? (
              pagedActivities.map((act) => (
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
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '4px'
                    }}
                  >
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
                        <span className="tabular-nums">{act.rowCount} {plural(act.rowCount, 'row')}</span>
                      </span>
                    </div>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: '11px', lineHeight: 1.4, wordBreak: 'break-word', fontFamily: 'monospace' }}>
                    {act.queryPurpose}
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--surface-2)',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px dashed var(--border)',
                  textAlign: 'center',
                  color: 'var(--muted)',
                  fontSize: '11px',
                  lineHeight: 1.5
                }}
              >
                <p style={{ margin: '0 0 4px 0', fontWeight: 600, color: 'var(--text)' }}>
                  Telemetry Audit Stream Ready
                </p>
                <p style={{ margin: 0 }}>
                  MCP analytical queries execute in ClickHouse upon playback ingestion and ADK inference runs.
                </p>
              </div>
            )}
          </div>

          {/* Bottom Pagination Controls */}
          {showPaginationControls && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                flexWrap: 'wrap',
                paddingTop: '4px'
              }}
            >
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                aria-label="Previous page"
                style={{
                  backgroundColor: page === 1 ? 'transparent' : 'var(--surface-2)',
                  color: page === 1 ? 'var(--muted)' : 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: page === 1 ? 'not-allowed' : 'pointer',
                  opacity: page === 1 ? 0.5 : 1,
                  minHeight: '28px'
                }}
              >
                Previous
              </button>

              <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>
                Page <span className="tabular-nums">{page}</span> of <span className="tabular-nums">{totalPages}</span>
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                aria-label="Next page"
                style={{
                  backgroundColor: page === totalPages ? 'transparent' : 'var(--surface-2)',
                  color: page === totalPages ? 'var(--muted)' : 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: page === totalPages ? 'not-allowed' : 'pointer',
                  opacity: page === totalPages ? 0.5 : 1,
                  minHeight: '28px'
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

