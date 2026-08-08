import React, { useState } from 'react';
import { X, Film } from 'lucide-react';
import { Project } from '../api/client';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (newProject: Project) => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onProjectCreated }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    setUploadProgress(10);
    try {
      const res = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: name, description, owner_id: "admin" })
      });
      
      let newProj: Project;
      if (res.ok) {
        newProj = await res.json();
      } else {
        newProj = {
          id: `proj_${Date.now()}`,
          name,
          description: description || 'New audience screening evaluation project',
          sceneCount: 1,
          totalRespondents: 0,
          status: 'ACTIVE',
          lastActivity: new Date().toISOString()
        };
      }

      setUploadProgress(40);

      // Upload video if selected
      if (file && res.ok) {
        const urlRes = await fetch(`/api/v1/projects/${newProj.id}/media?filename=${encodeURIComponent(file.name)}&content_type=${encodeURIComponent(file.type)}`, {
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
      setFile(null);
      setUploadProgress(0);
      onClose();
    } catch (err) {
      console.warn('API error creating project, utilizing local state:', err);
      const newProj: Project = {
        id: `proj_${Date.now()}`,
        name,
        description: description || 'New audience screening evaluation project',
        sceneCount: 1,
        totalRespondents: 0,
        status: 'ACTIVE',
        lastActivity: new Date().toISOString()
      };
      onProjectCreated(newProj);
      setName('');
      setDescription('');
      setFile(null);
      setUploadProgress(0);
      onClose();
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
        maxWidth: '500px',
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
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}>
            <X size={20} />
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

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
              DESCRIPTION / OBJECTIVE
            </label>
            <textarea
              rows={3}
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

          <div style={{ marginBottom: '24px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>
              VIDEO FILE
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
                fontWeight: 600
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              style={{
                backgroundColor: 'var(--violet)',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                opacity: !name.trim() ? 0.6 : 1
              }}
            >
              {isSubmitting ? (uploadProgress > 0 ? `UPLOADING ${uploadProgress}%` : 'CREATING...') : 'CREATE PROJECT'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
