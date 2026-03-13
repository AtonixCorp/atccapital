import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../components/ui';

const INITIAL_COLLECTIONS = [
  { invoice: 'INV-0002', customer: 'Globex Inc',   amount: '$4,200.00',  overdueDays: 15, lastContact: '2025-01-25', nextAction: 'Call',  priority: 'High',     notes: '' },
  { invoice: 'INV-0005', customer: 'Weyland Corp', amount: '$9,800.00',  overdueDays: 32, lastContact: '2025-01-10', nextAction: 'Legal', priority: 'Critical', notes: '' },
  { invoice: 'INV-0007', customer: 'Tyrell Inc',   amount: '$2,100.00',  overdueDays: 5,  lastContact: '2025-01-28', nextAction: 'Email', priority: 'Medium',   notes: '' },
];

const PRIORITY_COLORS = { Low: 'var(--color-success)', Medium: 'var(--color-warning)', High: 'var(--color-warning)', Critical: 'var(--color-error)' };

const BLANK_CONTACT = { invoice: '', contactType: 'Email', notes: '', nextAction: 'Email', nextDate: '' };

export default function Collections() {
  const [list, setList] = useState(INITIAL_COLLECTIONS);
  const [showModal, setShowModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [form, setForm] = useState(BLANK_CONTACT);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const openLog = (row) => { setSelectedRow(row); setShowModal(true); };

  const handleSave = () => {
    if (selectedRow) {
      setList(prev => prev.map(r =>
        r.invoice === selectedRow.invoice
          ? { ...r, lastContact: new Date().toISOString().slice(0, 10), nextAction: form.nextAction, notes: form.notes }
          : r
      ));
    }
    setForm(BLANK_CONTACT);
    setSelectedRow(null);
    setShowModal(false);
  };

  const totalOverdue = list.reduce((s, r) => s + parseFloat(r.amount.replace(/[$,]/g, '')), 0);
  const avgDays = Math.round(list.reduce((s, r) => s + r.overdueDays, 0) / list.length);

  const columns = [
    { key: 'invoice',     header: 'Invoice' },
    { key: 'customer',    header: 'Customer' },
    { key: 'amount',      header: 'Amount' },
    { key: 'overdueDays', header: 'Days Overdue', render: (row) => (
      <span style={{ color: 'var(--color-error)', fontWeight: 600 }}>{row.overdueDays} days</span>
    )},
    { key: 'lastContact', header: 'Last Contact' },
    { key: 'nextAction',  header: 'Next Action' },
    { key: 'priority',    header: 'Priority', render: (row) => (
      <span className="status-badge" style={{ background: PRIORITY_COLORS[row.priority] }}>{row.priority}</span>
    )},
    { key: '_actions', header: '', render: (_, row) => (
      <Button variant="secondary" size="small" onClick={() => openLog(row)}>Log Contact</Button>
    )},
  ];

  return (
    <div className="module-page">
      <PageHeader
        title="Collections"
        subtitle="Track and manage overdue invoices and collection workflows"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="small">Export Report</Button>
            <Button variant="primary" size="small" onClick={() => { setSelectedRow(null); setShowModal(true); }}>Log Contact</Button>
          </div>
        }
      />

      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-label">Total Overdue</div>
          <div className="stat-value" style={{ color: 'var(--color-error)' }}>
            ${totalOverdue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Accounts in Collections</div>
          <div className="stat-value">{list.length}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Avg Days Overdue</div>
          <div className="stat-value">{avgDays}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Critical Accounts</div>
          <div className="stat-value" style={{ color: 'var(--color-error)' }}>
            {list.filter(r => r.priority === 'Critical').length}
          </div>
        </Card>
      </div>

      <Card title="Overdue Accounts">
        <Table columns={columns} data={list} />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setForm(BLANK_CONTACT); setSelectedRow(null); }}
        title={selectedRow ? `Log Contact — ${selectedRow.invoice} (${selectedRow.customer})` : 'Log Contact'}
      >
        <div className="form-grid">
          {!selectedRow && (
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="input-label">Invoice</label>
              <select className="filter-select" style={{ width: '100%', height: 40 }} value={form.invoice} onChange={set('invoice')}>
                <option value="">Select invoice…</option>
                {list.map(r => <option key={r.invoice} value={r.invoice}>{r.invoice} — {r.customer}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="input-label">Contact Type</label>
            <select className="filter-select" style={{ width: '100%', height: 40 }} value={form.contactType} onChange={set('contactType')}>
              <option value="Email">Email</option>
              <option value="Call">Phone Call</option>
              <option value="Letter">Demand Letter</option>
              <option value="Legal">Legal Action</option>
            </select>
          </div>
          <div>
            <label className="input-label">Next Action</label>
            <select className="filter-select" style={{ width: '100%', height: 40 }} value={form.nextAction} onChange={set('nextAction')}>
              <option value="Email">Email</option>
              <option value="Call">Call</option>
              <option value="Legal">Legal</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
          <div>
            <label className="input-label">Next Follow-up Date</label>
            <Input type="date" value={form.nextDate} onChange={set('nextDate')} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="input-label">Notes</label>
            <Input placeholder="Contact outcome, promises made, etc." value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(BLANK_CONTACT); setSelectedRow(null); }}>Cancel</Button>
          <Button variant="primary" onClick={handleSave}>Save Contact Log</Button>
        </div>
      </Modal>
    </div>
  );
}
