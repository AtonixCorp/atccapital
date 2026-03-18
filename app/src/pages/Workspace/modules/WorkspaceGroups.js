import React, { useState } from 'react';
import './WorkspaceModules.css';

const WorkspaceGroups = () => {
  const [search, setSearch] = useState('');

  return (
    <div className="wsm-page">
      <div className="wsm-page-header">
        <div>
          <h1 className="wsm-page-title">Groups</h1>
          <p className="wsm-page-sub">Organise members into groups for focused collaboration.</p>
        </div>
        <button className="wsm-btn-primary">+ Create Group</button>
      </div>

      <div className="wsm-toolbar">
        <input
          className="wsm-search"
          type="text"
          placeholder="Search groups…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className="wsm-table-wrap">
        <table className="wsm-table">
          <thead>
            <tr>
              <th>Group Name</th>
              <th>Description</th>
              <th>Members</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5}>
                <div className="wsm-empty">No groups yet. Create one to organise members.</div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="wsm-permission-note">
        <strong>Permission rules:</strong> Owners and Admins can create, edit, or delete groups. Members can view group membership.
      </div>
    </div>
  );
};

export default WorkspaceGroups;
