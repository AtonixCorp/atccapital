import React from 'react';
import { useParams } from 'react-router-dom';
import { useEnterprise } from '../../../context/EnterpriseContext';
import './WorkspaceModules.css';

const ENTITY_TYPE_LABELS = {
  corporation: 'Corporation',
  llc: 'LLC',
  partnership: 'Partnership',
  sole_proprietorship: 'Sole Proprietorship',
  non_profit: 'Non-Profit',
  holding_company: 'Holding Company',
  branch: 'Branch / Subsidiary',
  trust: 'Trust',
};

const WorkspaceOverview = () => {
  const { workspaceId } = useParams();
  const { activeWorkspace, entities } = useEnterprise();

  // Resolve the workspace for this URL — prefer URL param match over context
  const ws = React.useMemo(() => {
    if (workspaceId) {
      const fromList = (entities || []).find(e => String(e.id) === String(workspaceId));
      if (fromList) return fromList;
      if (activeWorkspace && String(activeWorkspace.id) === String(workspaceId)) return activeWorkspace;
      // localStorage fallback
      try {
        const saved = localStorage.getItem('atc_active_workspace');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (String(parsed.id) === String(workspaceId)) return parsed;
        }
      } catch { /* ignore */ }
    }
    return activeWorkspace || {};
  }, [workspaceId, activeWorkspace, entities]);

  const statusClass =
    ws.status === 'active' ? 'wsm-status-active' :
    ws.status === 'draft'  ? 'wsm-status-draft'  : 'wsm-status-archived';

  const fyLabel = ws.fiscal_year_end
    ? (() => {
        try {
          const d = new Date(ws.fiscal_year_end);
          return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        } catch { return ws.fiscal_year_end; }
      })()
    : '—';

  return (
    <div className="wsm-page">
      <div className="wsm-page-header">
        <div>
          <h1 className="wsm-page-title">{ws.name || 'Workspace Overview'}</h1>
          <p className="wsm-page-sub">Workspace activity summary and key indicators.</p>
        </div>
      </div>

      {/* ── Key stats ── */}
      <div className="wsm-stats-row">
        <div className="wsm-stat-card">
          <span className="wsm-stat-label">Status</span>
          <span className={`wsm-stat-value ${statusClass}`} style={{ textTransform: 'capitalize' }}>
            {ws.status || 'Active'}
          </span>
        </div>
        <div className="wsm-stat-card">
          <span className="wsm-stat-label">Country</span>
          <span className="wsm-stat-value">{ws.country || '—'}</span>
        </div>
        <div className="wsm-stat-card">
          <span className="wsm-stat-label">Currency</span>
          <span className="wsm-stat-value">{ws.local_currency || '—'}</span>
        </div>
        <div className="wsm-stat-card">
          <span className="wsm-stat-label">Entity Type</span>
          <span className="wsm-stat-value">
            {ENTITY_TYPE_LABELS[ws.entity_type] || ws.entity_type || '—'}
          </span>
        </div>
      </div>

      {/* ── Details card ── */}
      <div className="wsm-section" style={{ maxWidth: 600, marginBottom: 24 }}>
        <div className="wsm-section-title">Workspace Details</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            {[
              ['Workspace Name',    ws.name],
              ['Registration No.',  ws.registration_number],
              ['Entity Type',       ENTITY_TYPE_LABELS[ws.entity_type] || ws.entity_type],
              ['Country',           ws.country],
              ['Functional Currency', ws.local_currency],
              ['Fiscal Year End',   fyLabel],
              ['Status',            ws.status],
            ].map(([label, value]) => value ? (
              <tr key={label}>
                <td style={{ padding: '8px 0', color: '#6b7280', width: 180, fontWeight: 500, verticalAlign: 'top' }}>{label}</td>
                <td style={{ padding: '8px 0', color: '#0d1b2e', fontWeight: 600, textTransform: label === 'Status' ? 'capitalize' : 'none' }}>{value}</td>
              </tr>
            ) : null)}
          </tbody>
        </table>
      </div>

      {/* ── Activity grid ── */}
      <div className="wsm-sections-grid">
        <section className="wsm-section">
          <h2 className="wsm-section-title">Recent Activity</h2>
          <div className="wsm-empty">No recent activity yet.</div>
        </section>
        <section className="wsm-section">
          <h2 className="wsm-section-title">Upcoming Meetings</h2>
          <div className="wsm-empty">No upcoming meetings.</div>
        </section>
        <section className="wsm-section">
          <h2 className="wsm-section-title">File Activity</h2>
          <div className="wsm-empty">No recent file activity.</div>
        </section>
        <section className="wsm-section">
          <h2 className="wsm-section-title">Calendar Highlights</h2>
          <div className="wsm-empty">No upcoming events.</div>
        </section>
      </div>
    </div>
  );
};

export default WorkspaceOverview;
