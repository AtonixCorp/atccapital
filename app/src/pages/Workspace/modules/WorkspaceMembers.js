import React, { useState } from 'react';
import './WorkspaceModules.css';

const ROLES = ['Owner', 'Admin', 'Member', 'Viewer'];

const WorkspaceMembers = () => {
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  return (
    <div className="wsm-page">
      <div className="wsm-page-header">
        <div>
          <h1 className="wsm-page-title">Members</h1>
          <p className="wsm-page-sub">Manage workspace membership and role assignments.</p>
        </div>
        <button className="wsm-btn-primary">+ Invite Member</button>
      </div>

      <div className="wsm-toolbar">
        <input
          className="wsm-search"
          type="text"
          placeholder="Search members…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="wsm-chips">
          <button className={`wsm-chip${filterRole === 'all' ? ' active' : ''}`} onClick={() => setFilterRole('all')}>All</button>
          {ROLES.map(r => (
            <button key={r} className={`wsm-chip${filterRole === r ? ' active' : ''}`} onClick={() => setFilterRole(r)}>{r}</button>
          ))}
        </div>
      </div>

      <div className="wsm-section">
        <div className="wsm-empty">No members yet. Invite someone to get started.</div>
      </div>

      <div className="wsm-permission-note">
        <strong>Permission rules:</strong> Owners and Admins can add or remove members. Role changes are logged in the audit trail.
      </div>
    </div>
  );
};

export default WorkspaceMembers;
