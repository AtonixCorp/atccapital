import React, { useState, useMemo, useCallback } from 'react';
import { PageHeader, Card, Button } from '../../components/ui';
import { useFilters } from '../../context/FilterContext';

const ALL_AUDIT_EVENTS = [
  { timestamp: '2025-01-31T14:23:01', user: 'sarah.johnson@atc.com', action: 'Journal Entry Created',    entity: 'JE-2025-0142', category: 'Accounting', details: 'Debit: Rent Expense $5,500 / Credit: Cash $5,500', ip: '192.168.1.45' },
  { timestamp: '2025-01-31T11:05:33', user: 'michael.chen@atc.com',  action: 'Invoice Approved',         entity: 'INV-0001',     category: 'Billing',    details: 'Status: Draft → Approved',                      ip: '192.168.1.62' },
  { timestamp: '2025-01-30T16:44:12', user: 'admin@atc.com',         action: 'User Permission Changed',  entity: 'lisa.rodriguez',category: 'Security',  details: 'Role: Viewer → Editor',                         ip: '10.0.0.1' },
  { timestamp: '2025-01-30T09:12:55', user: 'sarah.johnson@atc.com', action: 'Period Closed',            entity: 'Dec 2024',     category: 'Compliance', details: 'Month closed, no further edits allowed',         ip: '192.168.1.45' },
  { timestamp: '2025-01-28T15:30:00', user: 'michael.chen@atc.com',  action: 'Account Modified',         entity: 'GL-5001',      category: 'Accounting', details: 'Account name updated: "Salaries" → "Salaries & Wages"', ip: '192.168.1.62' },
  { timestamp: '2025-01-27T10:00:00', user: 'admin@atc.com',         action: 'API Key Generated',        entity: 'KEY-0042',     category: 'Security',   details: 'New API key issued for integration "Stripe"',    ip: '10.0.0.1' },
  { timestamp: '2025-01-26T14:55:22', user: 'lisa.rodriguez@atc.com',action: 'Report Exported',          entity: 'P&L-2024-Q4',  category: 'Reporting',  details: 'P&L exported to CSV',                           ip: '192.168.1.78' },
  { timestamp: '2025-01-25T09:11:03', user: 'sarah.johnson@atc.com', action: 'Bank Reconciliation',      entity: 'BNK-2025-01',  category: 'Accounting', details: 'Reconciliation completed for account #3041',     ip: '192.168.1.45' },
  { timestamp: '2025-01-24T17:30:47', user: 'michael.chen@atc.com',  action: 'Budget Approved',          entity: 'BUD-2025-Q1', category: 'Budgeting',  details: 'Q1 2025 budget approved by CFO',                 ip: '192.168.1.62' },
  { timestamp: '2025-01-23T11:18:00', user: 'admin@atc.com',         action: 'Entity Created',           entity: 'ENT-0012',     category: 'Security',   details: 'New entity "ATC Asia Pacific" created',         ip: '10.0.0.1' },
];

const CATEGORIES = ['All', 'Accounting', 'Billing', 'Security', 'Compliance', 'Reporting', 'Budgeting'];

const CATEGORY_TONE = {
  Accounting: 'var(--color-cyan-text)',
  Billing:    'var(--color-success)',
  Security:   'var(--color-error)',
  Compliance: 'var(--color-warning)',
  Reporting:  'var(--color-midnight)',
  Budgeting:  'var(--color-info)',
};

const exportCSV = (rows) => {
  const header = 'Timestamp,User,Action,Entity,Category,Details,IP\n';
  const body = rows
    .map((r) => [
      `"${r.timestamp}"`, `"${r.user}"`, `"${r.action}"`,
      `"${r.entity}"`, `"${r.category}"`, `"${r.details}"`, `"${r.ip}"`,
    ].join(','))
    .join('\n');
  const blob = new Blob([header + body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'audit-trail.csv';
  a.click();
  URL.revokeObjectURL(url);
};

export default function AuditTrail() {
  const { filters } = useFilters();
  const [userSearch, setUserSearch]       = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [actionSearch, setActionSearch]   = useState('');

  const filtered = useMemo(() => {
    return ALL_AUDIT_EVENTS.filter((evt) => {
      const evtDate = evt.timestamp.split('T')[0];
      if (evtDate < filters.dateFrom || evtDate > filters.dateTo) return false;
      if (userSearch && !evt.user.toLowerCase().includes(userSearch.toLowerCase())) return false;
      if (categoryFilter !== 'All' && evt.category !== categoryFilter) return false;
      if (actionSearch && !evt.action.toLowerCase().includes(actionSearch.toLowerCase())) return false;
      return true;
    });
  }, [filters.dateFrom, filters.dateTo, userSearch, categoryFilter, actionSearch]);

  const criticalCount = filtered.filter((e) => e.category === 'Security').length;

  const handleExport = useCallback(() => exportCSV(filtered), [filtered]);

  return (
    <div className="module-page">
      <PageHeader
        title="Audit Trail"
        subtitle="Immutable log of all user actions, changes, and system events"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="small" onClick={handleExport}>Export Log</Button>
          </div>
        }
      />

      {/* Summary strip */}
      <div className="stats-row" style={{ marginBottom: 24 }}>
        <Card className="stat-card">
          <div className="stat-label">Events (Filtered)</div>
          <div className="stat-value">{filtered.length}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Total Events</div>
          <div className="stat-value">{ALL_AUDIT_EVENTS.length}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Security Events</div>
          <div className="stat-value" style={{ color: criticalCount > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
            {criticalCount}
          </div>
        </Card>
      </div>

      {/* Filter row */}
      <Card style={{ marginBottom: 20 }}>
        <div className="audit-filter-row">
          <div className="filter-group">
            <label className="filter-label" htmlFor="aud-user">User</label>
            <input
              id="aud-user"
              type="text"
              className="filter-input"
              placeholder="Search user…"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              style={{ minWidth: 200 }}
            />
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor="aud-cat">Category</label>
            <select
              id="aud-cat"
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="filter-group">
            <label className="filter-label" htmlFor="aud-action">Action</label>
            <input
              id="aud-action"
              type="text"
              className="filter-input"
              placeholder="Search action…"
              value={actionSearch}
              onChange={(e) => setActionSearch(e.target.value)}
              style={{ minWidth: 200 }}
            />
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-silver-dark)', alignSelf: 'flex-end', paddingBottom: 2 }}>
            Date range from global filter bar
          </div>
        </div>
      </Card>

      {/* Event table */}
      <Card>
        <table className="risk-table audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Record</th>
              <th>Category</th>
              <th>Details</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-silver-dark)', padding: '32px 0' }}>
                  No events match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((evt, i) => (
                <tr key={i}>
                  <td style={{ whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>
                    {evt.timestamp.replace('T', ' ')}
                  </td>
                  <td>{evt.user}</td>
                  <td><strong>{evt.action}</strong></td>
                  <td><code style={{ fontSize: 'var(--font-size-xs)' }}>{evt.entity}</code></td>
                  <td>
                    <span style={{ color: CATEGORY_TONE[evt.category] || 'var(--color-midnight)', fontWeight: 600, fontSize: 'var(--font-size-xs)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                      {evt.category}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-silver-dark)' }}>{evt.details}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-silver-dark)' }}>{evt.ip}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
