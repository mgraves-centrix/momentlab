import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Lock, AlertCircle } from 'lucide-react';
import { AppShell } from '../components/AppShell';
import { MediaPlayer } from '../components/MediaPlayer';

export const ScreeningConsentPage: React.FC = () => {
  const [hasConsented, setHasConsented] = useState(false);
  const navigate = useNavigate();

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
                  gap: '8px'
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
                  fontSize: '13px'
                }}
              >
                Decline & Return to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Post-Consent Audience Player Screen */
          <div>
            <MediaPlayer sceneTitle="Northlight · Scene 12 Cut A" />

            {/* Explicit Reaction Buttons */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '20px' }}>
              <button style={{ backgroundColor: 'rgba(255, 102, 82, 0.2)', border: '1px solid var(--coral)', color: 'var(--coral)', padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                😖 Confusing Moment
              </button>
              <button style={{ backgroundColor: 'rgba(183, 227, 61, 0.2)', border: '1px solid var(--lime)', color: 'var(--lime)', padding: '10px 20px', borderRadius: 'var(--radius-sm)', fontWeight: 600 }}>
                ⚡ Engaging Moment
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};
