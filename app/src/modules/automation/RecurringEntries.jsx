import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../components/ui';

const mockRecurring = [
  { name: 'Monthly Office Rent', type: 'Journal Entry', frequency: 'Monthly', nextRun: '2025-02-01', amount: '$5,500.00', status: 'Active' },
  { name: 'Quarterly Insurance Premium', type: 'Bill', frequency: 'Quarterly', nextRun: '2025-04-01', amount: '$12,000.00', status: 'Active' },
  { name: 'Annual Software Subscription', type: 'Expense', frequency: 'Annual', nextRun: '2025-06-15', amount: '$8,400.00', status: 'Active' },
  { name: 'Bi-Weekly Payroll JE', type: 'Journal Entry', frequency: 'Bi-Weekly', nextRun: '2025-02-07', amount: '$38,000.00', status: 'Paused' },
];

const STATUS_COLORS = { Active: 'var(--color-success)', Paused: 'var(--color-warning)' };

const columns = [
  { key: 'name', header: 'Name' },
  { key: 'type', header: 'Type' },
  { key: 'frequency', header: 'Frequency' },
  { key: 'nextRun', header: 'Next Run' },
  { key: 'amount', header: 'Amount' },
  { key: 'status', header: 'Status', render: (row) => (
    <span className="status-badge" style={{ background: STATUS_COLORS[row.status] }}>{row.status}</span>
  )},
];

const BLANK_ENTRY = { name: '', type: '', frequency: '', startDate: '', amount: '', glAccount: '' };

export default function RecurringEntries() {
  const [showModal, setShowModal] = useState(false);
  const [recurringList, setRecurringList] = useState(mockRecurring);
  const [form, setForm] = useState(BLANK_ENTRY);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleCreate = () => {
    if (!form.name.trim() || !form.frequency.trim()) return;
    const amtNum = parseFloat(form.amount) || 0;
    setRecurringList(prev => [...prev, {
      name: form.name,
      type: form.type || 'Journal Entry',
      frequency: form.frequency,
      nextRun: form.startDate || '—',
      amount: amtNum ? `$${amtNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—',
      status: 'Active',
    }]);
    setForm(BLANK_ENTRY);
    setShowModal(false);
  };

  return (
    <div className="module-page">
      <PageHeader
        title="Recurring Entries"
        subtitle="Configure recurring journal entries, bills, and expenses"
        actions={
          <Button variant="primary" size="small" onClick={() => setShowModal(true)}>New Recurring Entry
          </Button>
        }
      />

      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-label">Active Entries</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>3</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Next 7 Days</div>
          <div className="stat-value">1 entry</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Monthly Recurring Value</div>
          <div className="stat-value">$43,500.00</div>
        </Card>
      </div>

      <Card>
        <Table columns={columns} data={recurringList} />
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(BLANK_ENTRY); }} title="New Recurring Entry" size="medium">
        <div className="form-grid">
          <Input label="Entry Name" required value={form.name} onChange={set('name')} />
          <Input label="Type" placeholder="Journal Entry, Bill, Expense..." value={form.type} onChange={set('type')} />
          <Input label="Frequency" placeholder="Daily / Weekly / Monthly / Annual" required value={form.frequency} onChange={set('frequency')} />
          <Input label="Start Date" type="date" required value={form.startDate} onChange={set('startDate')} />
          <Input label="Amount" type="number" required value={form.amount} onChange={set('amount')} />
          <Input label="GL Account" value={form.glAccount} onChange={set('glAccount')} />
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(BLANK_ENTRY); }}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={!form.name.trim() || !form.frequency.trim()}>Create Entry</Button>
        </div>
      </Modal>
    </div>
  );
}
