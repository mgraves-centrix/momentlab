import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, AlertCircle, CheckCircle, Flame, HelpCircle, Frown, Film, ChevronDown, PlayCircle, Smile, MessageSquare, Activity, Shield, Users, Trash2, Info, Ban } from 'lucide-react';
import { MediaPlayer } from '../components/MediaPlayer';
import { useMobile } from '../hooks/useMobile';

export const ScreeningConsentPage: React.FC = () => {
  const [hasConsented, setHasConsented] = useState(false);
  const [currentTimeMs, setCurrentTimeMs] = useState(37000);
  const [lastReaction, setLastReaction] = useState<{ type: string; timestamp: string } | null>(null);
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({ CONFUSED: 0, ENGAGING: 0, BORED: 0, ENGAGED: 0, FUNNY: 0, 'TOO SLOW': 0 });
  const [noteText, setNoteText] = useState('');
  
  // Desktop consent state
  const [desktopConsentChecked, setDesktopConsentChecked] = useState(false);
  const [selectedAge, setSelectedAge] = useState('18-24');

  const navigate = useNavigate();
  const isMobile = useMobile();

  const handleSendReaction = async (reactionType: 'CONFUSED' | 'ENGAGING' | 'ENGAGED' | 'BORED' | 'FUNNY' | 'TOO SLOW') => {
    const seconds = Math.floor(currentTimeMs / 1000);
    const timecode = `00:${String(seconds).padStart(2, '0')}`;
    
    setLastReaction({ type: reactionType, timestamp: timecode });
    setReactionCounts((prev) => ({ ...prev, [reactionType]: prev[reactionType] + 1 }));

    try {
      await fetch('/api/v1/telemetry/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify([{
          session_id: 'sess_screener_demo_01',
          project_id: 'proj_northlight_01',
          experiment_id: 'exp_23a',
          media_time_ms: currentTimeMs,
          event_type: reactionType,
          value: reactionType === 'ENGAGING' ? 0.95 : reactionType === 'CONFUSED' ? 0.45 : 0.50
        }])
      });
    } catch (err) {
      console.warn('Telemetry event dispatch offline, reaction recorded locally:', err);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#090a0c', color: '#f1f3f2', display: 'flex', flexDirection: 'column' }}>
      
      {!hasConsented ? (
        /* ======================================================== */
        /*                     PRE-CONSENT                          */
        /* ======================================================== */
        isMobile ? (
          /* --- MOBILE PRE-CONSENT (Screen 00) --- */
          <>
            <header style={{ height: '60px', backgroundColor: '#0c1115', borderBottom: '1px solid #1c262e', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                    <Film size={16} />
                  </div>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '16px', letterSpacing: '0.04em' }}>
                    MOMENT<span style={{ color: '#8b5cf6' }}>LAB</span>
                  </span>
                </div>
              </div>
            </header>
            
            <main style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ maxWidth: '640px', width: '100%', backgroundColor: '#0d1318', border: '1px solid #1e2830', borderRadius: '12px', padding: '24px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '32px' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6', marginBottom: '16px' }}>
                    <ShieldCheck size={24} />
                  </div>
                  <h1 style={{ fontSize: '24px', fontWeight: 800, fontFamily: 'var(--font-display)', marginBottom: '12px', letterSpacing: '0.02em', color: '#fff' }}>
                    Audience Screening Consent
                  </h1>
                  <p style={{ fontSize: '14px', color: '#8d979f', lineHeight: 1.5 }}>
                    You have been selected to screen <span style={{ color: '#f1f3f2', fontWeight: 600 }}>Project Northlight · Scene 12 Cut A</span>. 
                    Before we begin, please review how we collect and use your data.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                  <div style={{ backgroundColor: '#121a21', border: '1px solid #1e2830', borderRadius: '8px', padding: '16px', display: 'flex', gap: '12px' }}>
                    <CheckCircle style={{ color: '#8b5cf6', flexShrink: 0, marginTop: '2px' }} size={18} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f3f2', marginBottom: '4px' }}>Pseudonymous Sentiment Tracking</div>
                      <div style={{ fontSize: '13px', color: '#8d979f', lineHeight: 1.5 }}>We collect continuous sentiment data as you watch to help creators understand audience engagement.</div>
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#121a21', border: '1px solid #1e2830', borderRadius: '8px', padding: '16px', display: 'flex', gap: '12px' }}>
                    <Lock style={{ color: '#8b5cf6', flexShrink: 0, marginTop: '2px' }} size={18} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f3f2', marginBottom: '4px' }}>ZERO biometric data collected</div>
                      <div style={{ fontSize: '13px', color: '#8d979f', lineHeight: 1.5 }}>We do not ask for camera access, and we do not use facial recognition, gaze tracking, or vocal analysis.</div>
                    </div>
                  </div>
                  <div style={{ backgroundColor: '#121a21', border: '1px solid #1e2830', borderRadius: '8px', padding: '16px', display: 'flex', gap: '12px' }}>
                    <AlertCircle style={{ color: '#8b5cf6', flexShrink: 0, marginTop: '2px' }} size={18} />
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#f1f3f2', marginBottom: '4px' }}>Right to Delete</div>
                      <div style={{ fontSize: '13px', color: '#8d979f', lineHeight: 1.5 }}>You can request to delete your pseudonymous session data at any time via the screening portal.</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
                  <button 
                    onClick={async () => {
                      await fetch('/api/v1/screenings/consent', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ consent_given: true, session_id: 'sess_screener_demo_01' }) });
                      setHasConsented(true);
                    }}
                    style={{ width: '100%', backgroundColor: '#8b5cf6', color: '#fff', border: 'none', padding: '16px', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s ease', letterSpacing: '0.02em', boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)' }}
                  >
                    I AGREE & START SCREENING PLAYBACK
                  </button>
                  <button
                    onClick={() => navigate('/projects')}
                    style={{ width: '100%', backgroundColor: 'transparent', border: '1px solid #1e2830', color: '#8d979f', padding: '16px', borderRadius: '8px', fontSize: '15px', fontWeight: 700, cursor: 'pointer', letterSpacing: '0.02em' }}
                  >
                    DECLINE & LEAVE
                  </button>
                </div>
              </div>
            </main>
          </>
        ) : (
          /* --- DESKTOP PRE-CONSENT (Screen 02) --- */
          <>
            <header style={{ height: '60px', backgroundColor: '#090a0c', borderBottom: '1px solid #1c262e', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <Link to="/projects" style={{ textDecoration: 'none' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', letterSpacing: '0.04em', color: '#fff', cursor: 'pointer' }}>
                    MOMENT<span style={{ color: '#8b5cf6' }}>LAB</span> <span style={{ color: '#8d979f', fontSize: '14px', fontWeight: 500 }}>SCREENING</span>
                  </span>
                </Link>
                
                <button style={{ backgroundColor: 'transparent', border: '1px solid #1c262e', borderRadius: '6px', padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: '#8d979f', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.05em' }}>
                  <span>PROJECT NORTHLIGHT</span>
                  <ChevronDown size={14} />
                </button>
                
                <span style={{ fontSize: '12px', color: '#f1f3f2', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  SCENE 12 · INT. APARTMENT — NIGHT
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ backgroundColor: 'transparent', border: '1px solid #1f3a28', borderRadius: '14px', padding: '4px 10px', fontSize: '10px', fontWeight: 600, color: '#8d979f', display: 'flex', alignItems: 'center', gap: '6px', letterSpacing: '0.04em' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#58c94b' }} />
                  <span>AGENTS ONLINE</span>
                  <span style={{ backgroundColor: '#1d4825', color: '#58c94b', padding: '2px 6px', borderRadius: '10px', fontSize: '9px' }}>4</span>
                </div>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '1px solid #1c262e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8d979f' }}>
                  <HelpCircle size={14} />
                </div>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#1c262e', color: '#f1f3f2', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  NS
                </div>
              </div>
            </header>

            <main style={{ flex: 1, display: 'flex', padding: '24px', gap: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
              <div style={{ flex: '1', display: 'flex', flexDirection: 'column', backgroundColor: '#0d1318', borderRadius: '12px', border: '1px solid #1c262e', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '20px', display: 'flex', justifyContent: 'space-between', zIndex: 10 }}>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#f1f3f2', letterSpacing: '0.04em' }}>CUT A · ORIGINAL</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#f1f3f2' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                    02:18
                  </div>
                </div>
                
                <div style={{ flex: 1, backgroundColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <div style={{ width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0) 20%, rgba(0,0,0,0) 80%, rgba(0,0,0,0.6) 100%)', position: 'absolute' }} />
                  <div style={{ fontSize: '14px', color: '#455564', letterSpacing: '0.1em' }}>[VIDEO PLAYBACK AREA]</div>
                </div>
              </div>

              <div style={{ width: '400px', flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-display)', color: '#ffffff', marginBottom: '12px' }}>
                  BEFORE YOU WATCH
                </h2>
                <p style={{ fontSize: '13px', color: '#9aa8b2', lineHeight: 1.5, marginBottom: '24px' }}>
                  MomentLab records how you watch and your explicit reactions to help filmmakers understand what works.
                </p>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                  <div style={{ flex: 1, display: 'flex', gap: '12px' }}>
                    <Shield style={{ color: '#8b5cf6', flexShrink: 0 }} size={24} />
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#f1f3f2', letterSpacing: '0.04em', marginBottom: '4px' }}>YOUR PRIVACY</div>
                      <div style={{ fontSize: '11px', color: '#8d979f', lineHeight: 1.4 }}>Your data is pseudonymous, aggregated, and used for research purposes only.</div>
                    </div>
                  </div>
                  <div style={{ flex: 1, display: 'flex', gap: '12px' }}>
                    <Ban style={{ color: '#8b5cf6', flexShrink: 0 }} size={24} />
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#f1f3f2', letterSpacing: '0.04em', marginBottom: '4px' }}>NO BIOMETRICS</div>
                      <div style={{ fontSize: '11px', color: '#8d979f', lineHeight: 1.4 }}>We do not use webcams, microphones, facial analysis, gaze tracking, or biometrics.</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginBottom: '32px' }}>
                  {[
                    { icon: PlayCircle, title: 'Viewing behavior', desc: 'Play, pause, seek, replay, completion' },
                    { icon: Smile, title: 'Explicit reactions', desc: 'Ratings, moments, and open feedback' },
                    { icon: MessageSquare, title: 'Survey responses', desc: 'Questions and scales during and after' },
                    { icon: Activity, title: 'System events', desc: 'Device, timestamp, and session data' }
                  ].map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #1c262e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}>
                        <item.icon size={16} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f3f2' }}>{item.title}</div>
                        <div style={{ fontSize: '12px', color: '#5b6670' }}>{item.desc}</div>
                      </div>
                      <div style={{ width: '16px', height: '16px', borderRadius: '4px', backgroundColor: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                      </div>
                    </div>
                  ))}
                </div>

                <label 
                  htmlFor="desktop-consent-checkbox"
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px', cursor: 'pointer' }}
                >
                  <input
                    id="desktop-consent-checkbox"
                    type="checkbox"
                    checked={desktopConsentChecked}
                    onChange={(e) => setDesktopConsentChecked(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                    aria-label="I consent to this screening data use (required)"
                  />
                  <div style={{ fontSize: '13px', color: '#f1f3f2', fontWeight: 500, userSelect: 'none' }}>
                    I consent to this screening data use <span style={{ color: '#5b6670', fontWeight: 400 }}>(required)</span>
                  </div>
                </label>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', alignItems: 'flex-end' }}>
                  <div style={{ flex: '1.5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '10px', color: '#8d979f', fontWeight: 700, letterSpacing: '0.04em' }}>AGE RANGE</span>
                      <Info size={12} color="#5b6670" />
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {['18-24', '25-34', '35+'].map(age => (
                        <button
                          key={age}
                          onClick={() => setSelectedAge(age)}
                          style={{
                            flex: 1,
                            height: '36px',
                            backgroundColor: 'transparent',
                            border: selectedAge === age ? '1px solid #8b5cf6' : '1px solid #1c262e',
                            color: selectedAge === age ? '#8b5cf6' : '#8d979f',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          {age}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: '1' }}>
                    <div style={{ fontSize: '10px', color: '#8d979f', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '8px' }}>RESEARCH CODE (OPTIONAL)</div>
                    <input 
                      type="text" 
                      placeholder="Enter code"
                      style={{ width: '100%', boxSizing: 'border-box', height: '36px', backgroundColor: 'transparent', border: '1px solid #1c262e', borderRadius: '6px', padding: '0 12px', color: '#f1f3f2', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
                  <button
                    disabled={!desktopConsentChecked}
                    onClick={async () => {
                      await fetch('/api/v1/screenings/consent', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ consent_given: true, session_id: 'sess_screener_demo_01' }) });
                      setHasConsented(true);
                    }}
                    style={{
                      backgroundColor: desktopConsentChecked ? '#58c94b' : '#33402a',
                      color: desktopConsentChecked ? '#000' : '#4f6140',
                      border: 'none',
                      padding: '16px',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: 700,
                      letterSpacing: '0.04em',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      cursor: desktopConsentChecked ? 'pointer' : 'not-allowed',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {!desktopConsentChecked && <Lock size={16} />}
                    <span>START SCREENING</span>
                  </button>
                  <button
                    onClick={() => navigate('/projects')}
                    style={{ backgroundColor: 'transparent', border: '1px solid #1c262e', color: '#8d979f', padding: '16px', borderRadius: '8px', fontSize: '14px', fontWeight: 700, letterSpacing: '0.04em', cursor: 'pointer' }}
                  >
                    LEAVE SCREENING
                  </button>
                </div>
              </div>
            </main>

            <footer style={{ height: '56px', backgroundColor: '#090a0c', borderTop: '1px solid #1c262e', display: 'flex', alignItems: 'center', padding: '0 48px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'center' }}>
                <Users size={16} color="#8b5cf6" />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#8d979f', letterSpacing: '0.05em' }}>YOUR RESPONSES ARE AGGREGATED</span>
              </div>
              <div style={{ width: '1px', height: '24px', backgroundColor: '#1c262e' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'center' }}>
                <ShieldCheck size={16} color="#8b5cf6" />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#8d979f', letterSpacing: '0.05em' }}>MINIMUM COHORT SIZE 10</span>
              </div>
              <div style={{ width: '1px', height: '24px', backgroundColor: '#1c262e' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'center' }}>
                <Trash2 size={16} color="#8b5cf6" />
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#8d979f', letterSpacing: '0.05em' }}>DELETE REQUEST AVAILABLE</span>
              </div>
            </footer>
          </>
        )
      ) : (
        /* ======================================================== */
        /*                     POST-CONSENT                         */
        /* ======================================================== */
        isMobile ? (
          /* --- MOBILE PLAYER (Screen 03) --- */
          <div style={{ flex: 1, backgroundColor: '#000', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <div style={{ height: '56px', backgroundColor: '#0c1115', borderBottom: '1px solid #1c262e', padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '11px', color: '#8d979f', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  Project Northlight
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#f1f3f2' }}>
                  Northlight · Scene 12 Cut A
                </span>
              </div>
              <button 
                onClick={() => navigate('/projects/proj_northlight_01/experiments/exp_23a/finding')}
                style={{ backgroundColor: 'transparent', border: '1px solid #1c262e', borderRadius: '4px', padding: '6px 12px', fontSize: '11px', fontWeight: 700, color: '#8d979f', cursor: 'pointer' }}
              >
                DONE
              </button>
            </div>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MediaPlayer initialTimecodeMs={currentTimeMs} onTimeUpdate={setCurrentTimeMs} />
            </div>

            <div style={{ padding: '20px 16px', borderTop: '1px solid #1c262e', backgroundColor: '#0c1115' }}>
              <div style={{ fontSize: '11px', color: '#8d979f', textAlign: 'center', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Tap only when the feeling changes
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                <button onClick={() => handleSendReaction('CONFUSED')} style={{ backgroundColor: '#121a21', border: '1px solid #202b35', color: '#f1f3f2', padding: '14px', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '0.04em' }}>
                  <HelpCircle size={20} color="#8b5cf6" />
                  <span>CONFUSING ({reactionCounts.CONFUSED})</span>
                </button>
                <button onClick={() => handleSendReaction('ENGAGING')} style={{ backgroundColor: 'rgba(183, 227, 61, 0.15)', border: '1px solid #b7e33d', color: '#b7e33d', padding: '14px', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '0.04em' }}>
                  <Flame size={20} />
                  <span>ENGAGING ({reactionCounts.ENGAGING})</span>
                </button>
                <button onClick={() => handleSendReaction('BORED')} style={{ backgroundColor: '#121a21', border: '1px solid #202b35', color: '#f1f3f2', padding: '14px', borderRadius: '6px', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', letterSpacing: '0.04em' }}>
                  <Frown size={20} color="#8d979f" />
                  <span>BORED ({reactionCounts.BORED})</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* --- DESKTOP PLAYER (Screen 03) --- */
          <>
            <header style={{ height: '60px', backgroundColor: '#090a0c', borderBottom: '1px solid #1c262e', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <Link to="/projects" style={{ textDecoration: 'none' }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '18px', letterSpacing: '0.04em', color: '#fff', cursor: 'pointer' }}>
                    MOMENT<span style={{ color: '#8b5cf6' }}>LAB</span> <span style={{ color: '#8d979f', fontSize: '14px', fontWeight: 500 }}>SCREENING</span>
                  </span>
                </Link>
                
                <span style={{ fontSize: '12px', color: '#f1f3f2', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  PROJECT NORTHLIGHT <span style={{ color: '#455564', margin: '0 8px' }}>|</span> CUT A · ORIGINAL
                </span>
                <ShieldCheck size={16} color="#8d979f" />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#b7e33d' }} />
                <span style={{ fontSize: '10px', fontWeight: 600, color: '#b7e33d', letterSpacing: '0.04em' }}>CONNECTION ONLINE</span>
              </div>
            </header>

            <main style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '24px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
              <div style={{ display: 'flex', gap: '24px', flex: 1 }}>
                
                {/* Left: Player and Buttons */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ backgroundColor: '#0d1318', borderRadius: '8px', border: '1px solid #1c262e', overflow: 'hidden' }}>
                    <MediaPlayer initialTimecodeMs={currentTimeMs} onTimeUpdate={setCurrentTimeMs} />
                  </div>
                  
                  <div>
                    <div style={{ fontSize: '11px', color: '#8d979f', textAlign: 'center', marginBottom: '16px', letterSpacing: '0.04em' }}>Tap only when the feeling changes.</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
                      <button onClick={() => handleSendReaction('ENGAGED')} style={{ backgroundColor: '#121a21', border: lastReaction?.type === 'ENGAGED' ? '1px solid #8b5cf6' : '1px solid #202b35', color: lastReaction?.type === 'ENGAGED' ? '#8b5cf6' : '#f1f3f2', padding: '24px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <Smile size={32} />
                        <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.04em' }}>ENGAGED</span>
                      </button>
                      <button onClick={() => handleSendReaction('CONFUSED')} style={{ backgroundColor: '#121a21', border: lastReaction?.type === 'CONFUSED' ? '1px solid #8b5cf6' : '1px solid #202b35', color: lastReaction?.type === 'CONFUSED' ? '#8b5cf6' : '#f1f3f2', padding: '24px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <HelpCircle size={32} />
                        <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.04em' }}>CONFUSED</span>
                      </button>
                      <button onClick={() => handleSendReaction('FUNNY')} style={{ backgroundColor: '#121a21', border: lastReaction?.type === 'FUNNY' ? '1px solid #58c94b' : '1px solid #202b35', color: lastReaction?.type === 'FUNNY' ? '#58c94b' : '#f1f3f2', padding: '24px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <Smile size={32} />
                        <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.04em' }}>FUNNY</span>
                      </button>
                      <button onClick={() => handleSendReaction('TOO SLOW')} style={{ backgroundColor: '#121a21', border: lastReaction?.type === 'TOO SLOW' ? '1px solid #f97316' : '1px solid #202b35', color: lastReaction?.type === 'TOO SLOW' ? '#f97316' : '#f1f3f2', padding: '24px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', cursor: 'pointer' }}>
                        <Activity size={32} />
                        <span style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.04em' }}>TOO SLOW</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Scene Reaction and Progress */}
                <div style={{ width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ border: '1px solid #1c262e', borderRadius: '8px', backgroundColor: '#090a0c', padding: '24px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f3f2', letterSpacing: '0.04em', marginBottom: '16px', textTransform: 'uppercase' }}>SCENE REACTION</div>
                    <div style={{ border: '1px solid #1c262e', borderRadius: '8px', backgroundColor: '#0c1115', padding: '24px', display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                      <div style={{ width: '56px', height: '56px', borderRadius: '50%', border: '1px solid #8b5cf6', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {lastReaction?.type === 'CONFUSED' ? <HelpCircle size={28} /> : lastReaction?.type === 'TOO SLOW' ? <Activity size={28} color="#f97316" /> : lastReaction?.type === 'FUNNY' ? <Smile size={28} color="#58c94b" /> : <Smile size={28} />}
                      </div>
                      <div style={{ fontSize: '20px', fontWeight: 700, color: lastReaction?.type === 'TOO SLOW' ? '#f97316' : lastReaction?.type === 'FUNNY' ? '#58c94b' : '#8b5cf6', letterSpacing: '0.04em' }}>
                        {lastReaction?.type || 'ENGAGED'}
                      </div>
                    </div>
                    
                    <div style={{ fontSize: '12px', color: '#8d979f', marginBottom: '8px' }}>Add a note (optional)</div>
                    <div style={{ position: 'relative' }}>
                      <textarea 
                        value={noteText}
                        onChange={(e) => setNoteText(e.target.value.slice(0, 200))}
                        placeholder="What's going through your mind?"
                        style={{ width: '100%', height: '120px', backgroundColor: '#0c1115', border: '1px solid #1c262e', borderRadius: '8px', padding: '16px', color: '#f1f3f2', resize: 'none', fontSize: '13px', lineHeight: 1.5 }}
                      />
                      <div style={{ position: 'absolute', bottom: '12px', right: '12px', fontSize: '11px', color: '#8d979f' }}>{noteText.length} / 200</div>
                    </div>
                  </div>
                  
                  <div style={{ border: '1px solid #1c262e', borderRadius: '8px', backgroundColor: '#090a0c', padding: '24px', flex: 1 }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#f1f3f2', letterSpacing: '0.04em', marginBottom: '24px', textTransform: 'uppercase' }}>SCREENING PROGRESS</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                      <div style={{ position: 'relative', width: '80px', height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="80" height="80" viewBox="0 0 80 80" style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
                          <circle cx="40" cy="40" r="36" fill="none" stroke="#1c262e" strokeWidth="4" />
                          <circle cx="40" cy="40" r="36" fill="none" stroke="#8b5cf6" strokeWidth="4" strokeDasharray="226.19" strokeDashoffset="162.86" strokeLinecap="round" />
                        </svg>
                        <div style={{ fontSize: '20px', fontWeight: 700, position: 'relative', zIndex: 1 }}>28%</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '13px', color: '#f1f3f2', fontWeight: 600, marginBottom: '4px' }}>Keep watching.</div>
                        <div style={{ fontSize: '13px', color: '#8d979f', lineHeight: 1.5 }}>We'll ask a few questions after the screening.</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', paddingTop: '24px', borderTop: '1px solid #1c262e' }}>
                <div style={{ display: 'flex', gap: '32px', alignItems: 'center', fontSize: '11px', fontWeight: 600, color: '#8d979f', letterSpacing: '0.04em' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#b7e33d' }}><CheckCircle size={14} /> EVENTS SAVED</div>
                  <div>SESSION ID: N-8F24-7Q9M</div>
                  <div>YOU: VIEWER_7A1C9D</div>
                </div>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid #1c262e', borderRadius: '6px', padding: '12px 16px', color: '#8d979f', fontSize: '11px' }}>
                    <Lock size={14} />
                    <div>
                      <div style={{ color: '#f1f3f2', marginBottom: '2px', fontWeight: 600 }}>POST-SCENE SURVEY</div>
                      <div style={{ fontWeight: 400 }}>Available after you complete the screening.</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/projects/proj_northlight_01/experiments/exp_23a/finding')}
                    style={{ backgroundColor: 'transparent', border: '1px solid #202b35', color: '#f1f3f2', padding: '12px 24px', borderRadius: '6px', fontWeight: 600, fontSize: '12px', cursor: 'pointer', letterSpacing: '0.05em' }}
                  >
                    EXIT SCREENING
                  </button>
                </div>
              </div>
            </main>
          </>
        )
      )}
    </div>
  );
};
