import React, { useState } from 'react';
import './WorkspaceModules.css';

const FOLDERS = ['Inbox', 'Sent', 'Drafts', 'Trash'];

const WorkspaceEmail = () => {
  const [folder, setFolder] = useState('Inbox');
  const [composing, setComposing] = useState(false);

  return (
    <div className="wsm-page">
      <div className="wsm-page-header">
        <div>
          <h1 className="wsm-page-title">Email</h1>
          <p className="wsm-page-sub">Workspace-scoped email inbox and messaging.</p>
        </div>
        <button className="wsm-btn-primary" onClick={() => setComposing(true)}>+ Compose</button>
      </div>

      <div style={{ display: 'flex', gap: 20 }}>
        {/* Folder list */}
        <div style={{ width: 180, flexShrink: 0 }}>
          <div className="wsm-section">
            {FOLDERS.map(f => (
              <div
                key={f}
                onClick={() => setFolder(f)}
                style={{
                  padding: '9px 12px',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: folder === f ? 700 : 400,
                  background: folder === f ? '#eff6ff' : 'transparent',
                  color: folder === f ? '#2563eb' : '#374151',
                  fontSize: 13,
                }}
              >
                {f}
                {f === 'Inbox' && <span style={{ float: 'right', fontSize: 11, color: '#9ca3af' }}>0</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Email list */}
        <div style={{ flex: 1 }}>
          <div className="wsm-section">
            <div className="wsm-section-title">{folder}</div>
            <div className="wsm-empty">No messages in {folder.toLowerCase()}.</div>
          </div>
        </div>
      </div>

      {/* Compose modal */}
      {composing && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: 28, width: 540, boxShadow: '0 8px 32px rgba(0,0,0,.2)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700 }}>New Message</h3>
            <div className="wsm-form">
              <div className="wsm-form-group">
                <label className="wsm-label">To</label>
                <input className="wsm-input" placeholder="Recipient email…" />
              </div>
              <div className="wsm-form-group">
                <label className="wsm-label">Subject</label>
                <input className="wsm-input" placeholder="Subject…" />
              </div>
              <div className="wsm-form-group">
                <label className="wsm-label">Message</label>
                <textarea className="wsm-textarea" rows={5} placeholder="Write your message…" />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="wsm-btn-secondary" onClick={() => setComposing(false)}>Cancel</button>
                <button className="wsm-btn-primary">Send</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="wsm-permission-note">
        <strong>Permission rules:</strong> Members and above can send and receive messages. Viewers have read-only access. This module can be disabled in Settings.
      </div>
    </div>
  );
};

export default WorkspaceEmail;
