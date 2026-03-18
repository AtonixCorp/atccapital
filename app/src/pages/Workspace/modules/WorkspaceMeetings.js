import React, { useState } from 'react';
import './WorkspaceModules.css';

const VIEWS = ['List', 'Upcoming', 'Past'];

const WorkspaceMeetings = () => {
  const [view, setView] = useState('Upcoming');

  return (
    <div className="wsm-page">
      <div className="wsm-page-header">
        <div>
          <h1 className="wsm-page-title">Meetings</h1>
          <p className="wsm-page-sub">Schedule and manage workspace meetings and calls.</p>
        </div>
        <button className="wsm-btn-primary">+ Schedule Meeting</button>
      </div>

      <div className="wsm-toolbar">
        <div className="wsm-chips">
          {VIEWS.map(v => (
            <button key={v} className={`wsm-chip${view === v ? ' active' : ''}`} onClick={() => setView(v)}>{v}</button>
          ))}
        </div>
      </div>

      <div className="wsm-event-list">
        <div className="wsm-empty">No {view.toLowerCase()} meetings. Schedule one to get started.</div>
      </div>

      <div className="wsm-permission-note">
        <strong>Permission rules:</strong> Members and above can schedule meetings. Viewers can only view meeting details.
      </div>
    </div>
  );
};

export default WorkspaceMeetings;
