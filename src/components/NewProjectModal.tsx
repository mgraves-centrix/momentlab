import React, { useState } from 'react';
import { X, Film, Youtube, Upload, AlertCircle } from 'lucide-react';
import { Project } from '../api/client';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (newProject: Project) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onProjectCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sourceType, setSourceType] = useState<'upload' | 'youtube'>('upload');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    setUploadProgress(10);
    try {
      // 1. Create project
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: name, description, owner_id: "admin" })
      });
      
      if (!res.ok) {
        let errMsg = `Project creation failed (HTTP ${res.status})`;
        try {
          const errData = await res.json();
          if (errData.detail) errMsg = errData.detail;
        } catch (_) {}
        throw new Error(errMsg);
      }
      
      const newProj: Project = await res.json();
      setUploadProgress(40);

      // 2. Handle YouTube Ingest
      if (sourceType === 'youtube' && youtubeUrl.trim()) {
        const ytRes = await fetch('/api/v1/media/youtube-ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            youtube_url: youtubeUrl.trim(),
            project_id: newProj.project_id
          })
        });
        if (!ytRes.ok) {
          console.warn('YouTube ingestion queued but returned status:', ytRes.status);
        }
      }

      // 3. Handle File Direct Upload
      if (sourceType === 'upload' && file) {
        setUploadProgress(50);
        const urlRes = await fetch(`/api/v1/projects/${newProj.project_id}/media?filename=${encodeURIComponent(file.name)}&content_type=${encodeURIComponent(file.type)}`, {
          method: 'POST'
        });
        
        if (urlRes.ok) {
          const { url } = await urlRes.json();
          setUploadProgress(60);
          
          await fetch(url, {
            method: 'PUT',
            headers: {
              'Content-Type': file.type
            },
            body: file
          });
        }
      }

      setUploadProgress(100);
      onProjectCreated(newProj);
      setName('');
      setDescription('');
      setYoutubeUrl('');
      setFile(null);
      setUploadProgress(0);
      onClose();
    } catch (err: any) {
      console.error('API error creating project:', err);
      setErrorMessage(err.message || 'Failed to create project on server. Please try again.');
      setUploadProgress(0);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '24px'
    }}>
      <div style={{
        backgroundColor: 'var(--surface-1)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '520px',
        padding: '24px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)'
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: 'var(--radius-sm)', background: 'var(--violet)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <Film size={20} />
            </div>
            <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text)' }}>Create New Film Project</h2>
          </div>
          <button onClick={onClose} aria-label="Close modal" style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Error Message */}
        {errorMessage && (
          <div style={{
            padding: '10px 14px',
            backgroundColor: '#211210',
            border: '1px solid #4a201c',
            borderRadius: '6px',
            color: '#ff654a',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <AlertCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Source Switcher */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => setSourceType('upload')}
            style={{
              padding: '10px',
              borderRadius: '6px',
              border: sourceType === 'upload' ? '1px solid var(--lime)' : '1px solid var(--border)',
              backgroundColor: sourceType === 'upload' ? 'rgba(183, 227, 61, 0.1)' : 'var(--surface-2)',
              color: sourceType === 'upload' ? 'var(--lime)' : 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Upload size={14} />
            <span>File Upload (GCS)</span>
          </button>

          <button
            type="button"
            onClick={() => setSourceType('youtube')}
            style={{
              padding: '10px',
              borderRadius: '6px',
              border: sourceType === 'youtube' ? '1px solid #ff4444' : '1px solid var(--border)',
              backgroundColor: sourceType === 'youtube' ? 'rgba(255, 68, 68, 0.1)' : 'var(--surface-2)',
              color: sourceType === 'youtube' ? '#ff6666' : 'var(--muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Youtube size={14} />
            <span>YouTube IFrame Ingest</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
              PROJECT TITLE *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Eclipse - Feature Edit Study"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                color: 'var(--text)',
                fontSize: '14px'
              }}
            />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
              DESCRIPTION / OBJECTIVE
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Scene pacing optimization and audience retention evaluation..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: 'var(--surface-2)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                padding: '10px 12px',
                color: 'var(--text)',
                fontSize: '14px',
                resize: 'none'
              }}
            />
          </div>

          {sourceType === 'youtube' ? (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                YOUTUBE VIDEO URL *
              </label>
              <input
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  color: 'var(--text)',
                  fontSize: '14px'
                }}
              />
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '4px' }}>
                Instruments playback reactions via private YouTube IFrame Player API.
              </div>
            </div>
          ) : (
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
                LOCAL VIDEO FILE (GCS Signed Upload)
              </label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                style={{
                  width: '100%',
                  color: 'var(--text)',
                  fontSize: '14px',
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                padding: '10px 16px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || (sourceType === 'youtube' && !youtubeUrl.trim())}
              style={{
                backgroundColor: 'var(--lime)',
                color: '#080b0e',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: 800,
                cursor: 'pointer',
                opacity: !name.trim() ? 0.6 : 1
              }}
            >
              {isSubmitting ? (uploadProgress > 0 ? `INITIALIZING ${uploadProgress}%` : 'CREATING...') : 'CREATE PROJECT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
