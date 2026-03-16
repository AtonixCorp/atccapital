import React, { useState } from 'react';
import './WorkspaceModules.css';

const STATUSES = ['All', 'Draft', 'Active', 'Completed'];

const WorkspaceMarketing = () => {
  const [filter, setFilter] = useState('All');

  return (
    <div className="wsm-page">
      <div className="wsm-page-header">
        <div>
          <h1 className="wsm-page-title">Marketing</h1>
          <p className="wsm-page-sub">Manage campaigns, outreach, and engagement for this workspace.</p>
        </div>
        <button className="wsm-btn-primary">+ New Campaign</button>
      </div>

      {/* Stats */}
      <div className="wsm-stats-row">
        <div className="wsm-stat-card">
          <span className="wsm-stat-label">Total Campaigns</span>
          <span className="wsm-stat-value">0</span>
        </div>
        <div className="wsm-stat-card">
          <span className="wsm-stat-label">Active</span>
          <span className="wsm-stat-value wsm-status-active">0</span>
        </div>
        <div className="wsm-stat-card">
          <span className="wsm-stat-label">Avg. Open Rate</span>
          <span className="wsm-stat-value">—</span>
        </div>
        <div className="wsm-stat-card">
          <span className="wsm-stat-label">Leads Generated</span>
          <span className="wsm-stat-value">0</span>
        </div>
      </div>

      <div className="wsm-toolbar">
        <div className="wsm-chips">
          {STATUSES.map(s => (
            <button key={s} className={`wsm-chip${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>{s}</button>
          ))}
        </div>
      </div>

      <div className="wsm-table-wrap">
        <table className="wsm-table">
          <thead>
            <tr>
              <th>Campaign Name</th>
              <th>Status</th>
              <th>Type</th>
              <th>Created</th>
              <th>Open Rate</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={6}>
                <div className="wsm-empty">No campaigns yet. Create your first campaign to start engaging your audience.</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="wsm-permission-note">
        <strong>Permission rules:</strong> Members and above can create and manage campaigns. Viewers can only see campaign stats. This module can be disabled in Settings.
      </div>
    </div>
  );
};

export default WorkspaceMarketing;
