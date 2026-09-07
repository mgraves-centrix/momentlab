import React, { useState, useEffect } from 'react';
import { Check, PlayCircle, Video, Loader2, AlertCircle } from 'lucide-react';

interface CutComparisonProps {
  anomalyWindow?: string;
  controlRevealMs?: number;
  variantRevealMs?: number;
  hypothesis?: string;
  controlPoster?: string;
  variantPoster?: string;
  controlVideoUrl?: string;
  variantVideoUrl?: string;
  projectId?: string;
  experimentId?: string;
  onSelectVariant?: (variant: 'A' | 'B') => void;
}

export function parseAnomalyWindow(windowStr?: string): { controlRevealMs: number; variantRevealMs: number } | null {
  if (!windowStr) return null;
  const match = windowStr.match(/(\d+):(\d+)\s*[-–—]\s*(\d+):(\d+)/);
  if (!match) return null;
  const stMin = parseInt(match[1], 10);
  const stSec = parseInt(match[2], 10);
  const enMin = parseInt(match[3], 10);
  const enSec = parseInt(match[4], 10);
  const startMs = (stMin * 60 + stSec) * 1000;
  const endMs = (enMin * 60 + enSec) * 1000;
  if (endMs <= startMs) return null;
  return {
    controlRevealMs: endMs,
    variantRevealMs: startMs
  };
}

export const CutComparison: React.FC<CutComparisonProps> = ({
  anomalyWindow,
  controlRevealMs: propControlRevealMs,
  variantRevealMs: propVariantRevealMs,
  hypothesis,
  controlPoster,
  controlVideoUrl,
  variantVideoUrl: initialVariantVideoUrl,
  projectId,
  experimentId,
  onSelectVariant
}) => {
  const [selectedCut, setSelectedCut] = useState<'A' | 'B'>('B');
  const [variantVideoUrl, setVariantVideoUrl] = useState<string | null>(initialVariantVideoUrl || null);
  const [isRendering, setIsRendering] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (initialVariantVideoUrl) {
      setVariantVideoUrl(initialVariantVideoUrl);
    }
  }, [initialVariantVideoUrl]);

  const parsedTimes = parseAnomalyWindow(anomalyWindow);
  const controlRevealMs = parsedTimes ? parsedTimes.controlRevealMs : propControlRevealMs;
  const variantRevealMs = parsedTimes ? parsedTimes.variantRevealMs : propVariantRevealMs;

  const handleSelect = (cut: 'A' | 'B') => {
    setSelectedCut(cut);
    if (onSelectVariant) {
      onSelectVariant(cut);
    }
  };

  const formatMs = (ms: number) => {
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleRenderVariant = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!projectId || !experimentId) {
      setRenderError("Project ID and Experiment ID are required to render variant.");
      return;
    }
    setIsRendering(true);
    setRenderError(null);
    try {
      const token = sessionStorage.getItem('reviewer_token')?.trim() || '';
      if (!token) {
        setRenderError("Reviewer authorization token required.");
        return;
      }
      const res = await fetch(`/api/v1/projects/${projectId}/experiments/${experimentId}/render-variant`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.message || "Failed to render variant cut.");
      }
      if (data.status === 'NO_ANOMALY' || !data.variant_url) {
        setRenderError(data.message || "No anomaly window detected for project. Cannot render variant.");
      } else {
        setVariantVideoUrl(data.variant_url);
      }
    } catch (err: any) {
      setRenderError(err.message || "Error rendering variant cut.");
    } finally {
      setIsRendering(false);
    }
  };

  if (!controlRevealMs || !variantRevealMs) {
    return (
      <div
        style={{
          backgroundColor: 'var(--surface-1, #0c1115)',
          border: '1px solid var(--border, #1c2630)',
          borderRadius: 'var(--radius-lg, 8px)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text, #fff)', margin: 0 }}>
            Cut Comparison & Timeline Shift
          </h3>
          <span style={{ backgroundColor: '#1c2630', color: '#8d979f', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
            NO ANOMALY DETECTED
          </span>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#131b22', border: '1px solid #1c2630', borderRadius: '6px', color: '#8d979f', fontSize: '13px', lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={18} color="#8d979f" style={{ flexShrink: 0 }} />
          <span>
            This project does not have a detected audience drop or anomaly window. Cut comparison and synthetic variant generation require an active anomaly window.
          </span>
        </div>
      </div>
    );
  }

  const shiftSec = Math.round((controlRevealMs - variantRevealMs) / 1000);

  return (
    <div
      style={{
        backgroundColor: 'var(--surface-1, #0c1115)',
        border: '1px solid var(--border, #1c2630)',
        borderRadius: 'var(--radius-lg, 8px)',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text, #fff)', margin: 0 }}>
            Cut Comparison & Timeline Shift
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--muted, #8d979f)', margin: '2px 0 0 0' }}>
            Synchronized preview of Control Cut A ({formatMs(controlRevealMs)}) vs Proposed Variant Cut B ({formatMs(variantRevealMs)})
          </p>
        </div>

        <span className="badge badge-synthetic" style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.4)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 800 }}>
          SYNTHETIC EDIT PREVIEW
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {/* Control Cut A */}
        <div
          onClick={() => handleSelect('A')}
          style={{
            backgroundColor: selectedCut === 'A' ? 'var(--surface-3, #18222b)' : 'var(--surface-2, #131b22)',
            border: `2px solid ${selectedCut === 'A' ? 'var(--muted, #8d979f)' : 'var(--border, #1c2630)'}`,
            borderRadius: 'var(--radius-md, 6px)',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: 'var(--muted, #8d979f)', fontWeight: 700, textTransform: 'uppercase' }}>
              Control Cut A (Reveal at {formatMs(controlRevealMs)})
            </span>
            {selectedCut === 'A' && <Check size={16} color="var(--muted, #8d979f)" />}
          </div>

          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text, #fff)', marginBottom: '8px' }}>
            Original sequence · Reveal at {formatMs(controlRevealMs)}
          </div>

          {/* Real Video Player for Cut A */}
          <div style={{ position: 'relative', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px', border: '1px solid #1c2630', backgroundColor: '#000' }}>
            {controlVideoUrl ? (
              <video 
                src={controlVideoUrl} 
                controls 
                style={{ width: '100%', maxHeight: '180px', display: 'block', objectFit: 'contain' }} 
              />
            ) : (
              <div style={{ position: 'relative', height: '120px' }}>
                <img 
                  src={controlPoster || "/frames/northlight/poster.png"} 
                  alt="Control Cut A Frame" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              </div>
            )}
            <div style={{ position: 'absolute', bottom: '4px', right: '4px', backgroundColor: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '2px', fontSize: '11px', color: '#fff', fontWeight: 700, pointerEvents: 'none' }}>
              REVEAL: {formatMs(controlRevealMs)}
            </div>
          </div>

          {/* Timeline Bar representation */}
          <div style={{ height: '20px', backgroundColor: 'var(--surface-1, #0c1115)', borderRadius: 'var(--radius-sm, 4px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, width: `${(controlRevealMs / 60000) * 100}%`, height: '100%', backgroundColor: 'rgba(141, 151, 159, 0.3)' }} />
            <div style={{ position: 'absolute', left: `${(controlRevealMs / 60000) * 100}%`, top: 0, bottom: 0, width: '4px', backgroundColor: 'var(--muted, #8d979f)' }} />
          </div>
          <span style={{ fontSize: '11px', color: 'var(--muted, #8d979f)', marginTop: '6px', display: 'block' }}>
            Original edit sequence without early reveal
          </span>
        </div>

        {/* Variant Cut B */}
        <div
          onClick={() => handleSelect('B')}
          style={{
            backgroundColor: selectedCut === 'B' ? 'rgba(139, 92, 246, 0.12)' : 'var(--surface-2, #131b22)',
            border: `2px solid ${selectedCut === 'B' ? 'var(--violet, #8b5cf6)' : 'var(--border, #1c2630)'}`,
            borderRadius: 'var(--radius-md, 6px)',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase' }}>
              Variant Cut B (Reveal at {formatMs(variantRevealMs)})
            </span>
            {selectedCut === 'B' && <Check size={16} color="#8b5cf6" />}
          </div>

          <div style={{ fontSize: '14px', fontWeight: 700, color: '#8b5cf6', marginBottom: '8px' }}>
            {hypothesis || 'Proposed Edit Sequence'}
          </div>

          {/* Real Video Player or Explicit Render Action for Cut B */}
          <div style={{ position: 'relative', borderRadius: '4px', overflow: 'hidden', marginBottom: '8px', border: '1px solid rgba(139, 92, 246, 0.4)', backgroundColor: '#000', minHeight: '120px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {variantVideoUrl ? (
              <video 
                src={variantVideoUrl} 
                controls 
                style={{ width: '100%', maxHeight: '180px', display: 'block', objectFit: 'contain' }} 
              />
            ) : (
              <div style={{ padding: '16px', textAlign: 'center', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Video size={24} color="#8b5cf6" />
                <div style={{ fontSize: '12px', color: '#f1f3f2', fontWeight: 600 }}>Variant Cut B Not Rendered</div>
                <div style={{ fontSize: '11px', color: '#8d979f' }}>
                  Trim anomaly window ({anomalyWindow || 'detected window'}) using ffmpeg
                </div>
                <button
                  onClick={handleRenderVariant}
                  disabled={isRendering}
                  style={{
                    backgroundColor: '#8b5cf6',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: isRendering ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '4px'
                  }}
                >
                  {isRendering ? (
                    <>
                      <Loader2 className="animate-spin" size={14} />
                      <span>RENDERING VARIANT (ffmpeg)...</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle size={14} />
                      <span>RENDER VARIANT CUT B</span>
                    </>
                  )}
                </button>
                {renderError && (
                  <div style={{ color: '#ff6652', fontSize: '11px', marginTop: '4px' }}>
                    {renderError}
                  </div>
                )}
              </div>
            )}
            {variantVideoUrl && (
              <div style={{ position: 'absolute', bottom: '4px', right: '4px', backgroundColor: 'rgba(139, 92, 246, 0.85)', padding: '2px 6px', borderRadius: '2px', fontSize: '11px', color: '#fff', fontWeight: 700, pointerEvents: 'none' }}>
                REVEAL: {formatMs(variantRevealMs)} (-{shiftSec}s)
              </div>
            )}
          </div>

          {/* Timeline Bar representation */}
          <div style={{ height: '20px', backgroundColor: 'var(--surface-1, #0c1115)', borderRadius: 'var(--radius-sm, 4px)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', left: 0, width: `${(variantRevealMs / 60000) * 100}%`, height: '100%', backgroundColor: 'rgba(139, 92, 246, 0.4)' }} />
            <div style={{ position: 'absolute', left: `${(variantRevealMs / 60000) * 100}%`, top: 0, bottom: 0, width: '4px', backgroundColor: 'var(--violet, #8b5cf6)' }} />
          </div>
          <span style={{ fontSize: '11px', color: '#a78bfa', marginTop: '6px', display: 'block' }}>
            Applied {shiftSec}s earlier reveal to preserve audience retention
          </span>
        </div>
      </div>
    </div>
  );
};
