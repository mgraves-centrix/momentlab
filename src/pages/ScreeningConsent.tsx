import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, AlertCircle, CheckCircle, Flame, HelpCircle, Frown } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { MediaPlayer } from '../components/MediaPlayer';

export const ScreeningConsentPage: React.FC = () => {
  const [hasConsented, setHasConsented] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(37000);
  const [lastReaction, setLastReaction] = useState<{ type: string; timestamp: string } | null>(null);
  const [reactionCounts, setReactionCounts] = useState({ CONFUSED: 0, ENGAGING: 0, BORED: 0 });
  const navigate = useNavigate();

  const handleSendReaction = async (reactionType: 'CONFUSED' | 'ENGAGING' | 'BORED') => {
    const seconds = Math.floor(currentTimeMs / 1000);
    const timecode = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    
    setLastReaction({ type: reactionType, timestamp: timecode });
    setReactionCounts((prev) => ({ ...prev, [reactionType]: prev[reactionType] + 1 }));

    try {
      await fetch('/api/v1/events/playback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: 'sess_screener_demo_01',
          project_id: 'proj_northlight_01',
          experiment_id: 'exp_23a',
          scene_id: 'sc_12',
          media_time_ms: currentTimeMs,
          retention_score: reactionType === 'ENGAGING' ? 0.95 : reactionType === 'CONFUSED' ? 0.45 : 0.50,
          playback_state: 'PLAYING',
          idempotency_key: `idemp_${Date.now()}`
        })
      });
    } catch (err) {
      console.warn('Playback event dispatch offline, reaction recorded locally:', err);
    }
  };

  return (
    <AppShell>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        {!hasConsented ? (
          /* Pre-Consent Privacy Disclosure Screen */
          <div style={{ backgroundColor: 'var(--surface-1)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '32px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(88, 201, 75, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)', marginBottom: '12px' }}>
                <ShieldCheck size={28} />
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
                Audience Screening Consent & Privacy Notice
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '4px' }}>
                Northlight · Scene 12 Edit Evaluation Study
              </p>
            </div>

            <div style={{ backgroundColor: 'var(--surface-2)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '24px', fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6 }}>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>Data Collection Policy:</h3>
              <ul style={{ paddingLeft: '20px' }}>
                <li>We collect only second-by-second playback interaction, timecode position, and explicit reaction button taps.</li>
                <li style={{ color: 'var(--coral)', fontWeight: 600, marginTop: '4px' }}>
                  <AlertCircle size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  ZERO biometric, facial, gaze, microphone, or emotion-recognition data is collected or inferred.
                </li>
                <li style={{ marginTop: '4px' }}>All data is aggregated anonymously and stored securely in ClickHouse.</li>
              </ul>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={() => setHasConsented(true)}
                style={{
                  backgroundColor: 'var(--violet)',
                  color: '#fff',
                  padding: '14px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  border: 'none'
                }}
              >
                <Lock size={16} />
                <span>I AGREE & START SCREENING PLAYBACK</span>
              </button>

              <button
                onClick={() => navigate('/projects')}
                style={{
                  backgroundColor: 'transparent',
                  color: 'var(--muted)',
                  padding: '10px',
                  fontSize: '13px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Decline & Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Post-Consent Audience Player Screen */
          <div>
            <MediaPlayer
              sceneTitle="Northlight · Scene 12 Cut A"
              onTimeUpdate={(timeMs) => setCurrentTimeMs(timeMs)}
            />

            {/* Reaction Feedback Banner */}
            {lastReaction && (
              <div style={{
                marginTop: '16px',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                fontSize: '13px',
                color: 'var(--lime)'
              }}>
                <CheckCircle size={16} />
                <span>Reaction Recorded: <strong>{lastReaction.type}</strong> at timecode <strong>{lastReaction.timestamp}</strong></span>
              </div>
            )}

            {/* Live Interactive Reaction Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
              <button
                onClick={() => handleSendReaction('CONFUSED')}
                style={{
                  backgroundColor: 'rgba(255, 102, 82, 0.15)',
                  border: '1px solid var(--coral)',
                  color: 'var(--coral)',
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <HelpCircle size={18} />
                <span>CONFUSING MOMENT ({reactionCounts.CONFUSED})</span>
              </button>

              <button
                onClick={() => handleSendReaction('ENGAGING')}
                style={{
                  backgroundColor: 'rgba(183, 227, 61, 0.15)',
                  border: '1px solid var(--lime)',
                  color: 'var(--lime)',
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Flame size={18} />
                <span>ENGAGING MOMENT ({reactionCounts.ENGAGING})</span>
              </button>

              <button
                onClick={() => handleSendReaction('BORED')}
                style={{
                  backgroundColor: 'rgba(148, 163, 184, 0.15)',
                  border: '1px solid var(--muted)',
                  color: 'var(--text)',
                  padding: '12px 24px',
                  borderRadius: 'var(--radius-sm)',
                  fontWeight: 700,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Frown size={18} />
                <span>BORED MOMENT ({reactionCounts.BORED})</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
