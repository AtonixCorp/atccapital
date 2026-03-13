import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../components/ui';

const INITIAL_SCHEDULE = [
  { id: 'PAY-001', type: 'Invoice', ref: 'INV-0001', party: 'Acme Corp',   amount: '$12,500.00', date: '2025-02-15', method: 'ACH',           status: 'Scheduled' },
  { id: 'PAY-002', type: 'Bill',    ref: 'BILL-0001', party: 'AWS Cloud',  amount: '$3,200.00',  date: '2025-02-10', method: 'Bank Transfer', status: 'Approved'  },
  { id: 'PAY-003', type: 'Bill',    ref: 'BILL-0004', party: 'Landlord LLC', amount: '$5,500.00', date: '2025-02-01', method: 'ACH',          status: 'Completed' },
  { id: 'PAY-004', type: 'Invoice', ref: 'INV-0002', party: 'Globex Inc',  amount: '$4,200.00',  date: '2025-01-30', method: 'Wire',          status: 'Overdue'   },
];

const STATUS_COLORS = { Scheduled: 'var(--color-cyan)', Approved: 'var(--color-warning)', Completed: 'var(--color-success)', Overdue: 'var(--color-error)' };

const BLANK_PAY = { type: 'Invoice', ref: '', party: '', amount: '', date: '', method: 'ACH', notes: '' };

export default function PaymentScheduling() {
  const [list, setList] = useState(INITIAL_SCHEDULE);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(BLANK_PAY);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleCreate = () => {
    const newId = `PAY-${String(list.length + 1).padStart(3, '0')}`;
    setList(prev => [...prev, {
      id: newId,
      type: form.type,
      ref: form.ref || newId,
      party: form.party,
      amount: `$${Number(form.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      date: form.date,
      method: form.method,
      status: 'Scheduled',
    }]);
    setForm(BLANK_PAY);
    setShowModal(false);
  };

  const columns = [
    { key: 'id',     header: 'Payment ID' },
    { key: 'type',   header: 'Type' },
    { key: 'ref',    header: 'Reference' },
    { key: 'party',  header: 'Party' },
    { key: 'amount', header: 'Amount' },
    { key: 'date',   header: 'Date' },
    { key: 'method', header: 'Method' },
    { key: 'status', header: 'Status', render: (row) => (
      <span className="status-badge" style={{ background: STATUS_COLORS[row.status] }}>{row.status}</span>
    )},
  ];

  return (
    <div className="module-page">
      <PageHeader
        title="Payment Scheduling"
        subtitle="Schedule, approve and track outgoing and incoming payments"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="small">Approve Selected</Button>
            <Button variant="primary" size="small" onClick={() => setShowModal(true)}>Schedule Payment</Button>
          </div>
        }
      />

      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-label">Scheduled</div>
          <div className="stat-value">$15,700.00</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Pending Approval</div>
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>$3,200.00</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Overdue</div>
          <div className="stat-value" style={{ color: 'var(--color-error)' }}>$4,200.00</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Total Payments</div>
          <div className="stat-value">{list.length}</div>
        </Card>
      </div>

      <Card>
        <Table columns={columns} data={list} />
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(BLANK_PAY); }} title="Schedule Payment">
        <div className="form-grid">
          <div>
            <label className="input-label">Payment Type</label>
            <select className="filter-select" style={{ width: '100%', height: 40 }} value={form.type} onChange={set('type')}>
              <option value="Invoice">Invoice</option>
              <option value="Bill">Bill</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="input-label">Reference</label>
            <Input placeholder="INV-0001 or BILL-0001" value={form.ref} onChange={set('ref')} />
          </div>
          <div>
            <label className="input-label">Payee / Payer</label>
            <Input placeholder="Company or person name" value={form.party} onChange={set('party')} />
          </div>
          <div>
            <label className="input-label">Amount ($)</label>
            <Input placeholder="0.00" value={form.amount} onChange={set('amount')} />
          </div>
          <div>
            <label className="input-label">Payment Date</label>
            <Input type="date" value={form.date} onChange={set('date')} />
          </div>
          <div>
            <label className="input-label">Payment Method</label>
            <select className="filter-select" style={{ width: '100%', height: 40 }} value={form.method} onChange={set('method')}>
              <option value="ACH">ACH</option>
              <option value="Wire">Wire Transfer</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Card">Card</option>
              <option value="Check">Check</option>
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="input-label">Notes</label>
            <Input placeholder="Optional notes…" value={form.notes} onChange={set('notes')} />
          </div>
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(BLANK_PAY); }}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={!form.party.trim() || !form.amount || !form.date}>
            Schedule
          </Button>
        </div>
      </Modal>
    </div>
  );
}
