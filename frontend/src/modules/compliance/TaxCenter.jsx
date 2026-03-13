import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../components/ui';

const INITIAL_TAX = [
  { tax: 'Federal Income Tax (Q4 2024)', jurisdiction: 'USA', dueDate: '2025-01-15', amount: '$42,000.00', status: 'Filed',           filedDate: '2025-01-10' },
  { tax: 'California State Tax (Q4 2024)', jurisdiction: 'CA', dueDate: '2025-01-15', amount: '$9,800.00',  status: 'Filed',           filedDate: '2025-01-10' },
  { tax: 'Federal Payroll Tax (Jan 2025)', jurisdiction: 'USA', dueDate: '2025-02-15', amount: '$5,508.00',  status: 'Upcoming',        filedDate: '—' },
  { tax: 'Sales Tax (Jan 2025)',           jurisdiction: 'CA',  dueDate: '2025-02-28', amount: '$1,250.00',  status: 'Upcoming',        filedDate: '—' },
  { tax: 'Annual 1099 Filing',            jurisdiction: 'USA', dueDate: '2025-02-28', amount: 'N/A',        status: 'Action Required', filedDate: '—' },
];

const STATUS_COLORS = {
  Filed:           'var(--color-success)',
  Upcoming:        'var(--color-cyan)',
  'Action Required': 'var(--color-error)',
  Overdue:         'var(--color-error)',
};

const BLANK_FILING = { tax: '', jurisdiction: '', dueDate: '', amount: '', notes: '' };

export default function TaxCenter() {
  const [filings, setFilings] = useState(INITIAL_TAX);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_FILING);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const markFiled = (taxName) => {
    setFilings(prev => prev.map((r) =>
      r.tax === taxName ? { ...r, status: 'Filed', filedDate: new Date().toISOString().slice(0, 10) } : r
    ));
  };

  const handleCreate = () => {
    const newFiling = {
      tax: form.tax,
      jurisdiction: form.jurisdiction,
      dueDate: form.dueDate,
      amount: form.amount ? `$${Number(form.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A',
      status: 'Upcoming',
      filedDate: '—',
    };
    setFilings(prev => [...prev, newFiling]);
    setForm(BLANK_FILING);
    setShowModal(false);
  };

  const columns = [
    { key: 'tax', header: 'Tax Obligation' },
    { key: 'jurisdiction', header: 'Jurisdiction' },
    { key: 'dueDate', header: 'Due Date' },
    { key: 'amount', header: 'Amount' },
    { key: 'filedDate', header: 'Filed Date' },
    { key: 'status', header: 'Status', render: (row) => (
      <span className="status-badge" style={{ background: STATUS_COLORS[row.status] }}>{row.status}</span>
    )},
    { key: '_actions', header: '', render: (_, row) => (
      row.status !== 'Filed' ? (
        <Button variant="secondary" size="small" onClick={() => markFiled(row.tax)}>Mark Filed</Button>
      ) : null
    )},
  ];

  const upcomingCount = filings.filter(r => r.status === 'Upcoming').length;
  const actionCount   = filings.filter(r => r.status === 'Action Required' || r.status === 'Overdue').length;
  const filedCount    = filings.filter(r => r.status === 'Filed').length;

  return (
    <div className="module-page">
      <PageHeader
        title="Tax Center"
        subtitle="Manage all tax obligations, filings, and compliance deadlines"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="small">Tax Summary</Button>
            <Button variant="primary" size="small" onClick={() => setShowModal(true)}>New Filing</Button>
          </div>
        }
      />

      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-label">Filings This Quarter</div>
          <div className="stat-value">{filedCount}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Total Tax Paid (QTD)</div>
          <div className="stat-value">$51,800.00</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Upcoming Deadlines</div>
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>{upcomingCount}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Action Required</div>
          <div className="stat-value" style={{ color: actionCount > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>{actionCount}</div>
        </Card>
      </div>

      <Card title="Tax Obligations">
        <Table columns={columns} data={filings} />
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(BLANK_FILING); }} title="New Tax Filing">
        <div className="form-grid">
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="input-label">Tax Obligation</label>
            <Input placeholder="e.g. Federal Payroll Tax (Feb 2025)" value={form.tax} onChange={set('tax')} />
          </div>
          <div>
            <label className="input-label">Jurisdiction</label>
            <Input placeholder="e.g. USA, CA, UK" value={form.jurisdiction} onChange={set('jurisdiction')} />
          </div>
          <div>
            <label className="input-label">Due Date</label>
            <Input type="date" value={form.dueDate} onChange={set('dueDate')} />
          </div>
          <div>
            <label className="input-label">Amount ($)</label>
            <Input placeholder="e.g. 5500.00" value={form.amount} onChange={set('amount')} />
          </div>
          <div>
            <label className="input-label">Notes</label>
            <Input placeholder="Optional notes…" value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(BLANK_FILING); }}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={!form.tax.trim() || !form.dueDate}>Add Filing</Button>
        </div>
      </Modal>
    </div>
  );
}
