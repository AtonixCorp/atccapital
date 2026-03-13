import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../../components/ui';

const mockAP = [
  { bill: 'BILL-0001', vendor: 'AWS Cloud', billDate: '2025-01-10', dueDate: '2025-02-10', original: '$3,200.00', balance: '$3,200.00', aging: '0-30', status: 'Pending' },
  { bill: 'BILL-0002', vendor: 'Office Depot', billDate: '2024-12-25', dueDate: '2025-01-25', original: '$680.00', balance: '$680.00', aging: '31-60', status: 'Overdue' },
  { bill: 'BILL-0004', vendor: 'Landlord LLC', billDate: '2025-01-01', dueDate: '2025-02-01', original: '$5,500.00', balance: '$0.00', aging: 'Paid', status: 'Paid' },
];

const STATUS_COLORS = { Pending: 'var(--color-warning)', Overdue: 'var(--color-error)', Paid: 'var(--color-silver-dark)' };

const columns = [
  { key: 'bill', header: 'Bill #' },
  { key: 'vendor', header: 'Vendor' },
  { key: 'billDate', header: 'Bill Date' },
  { key: 'dueDate', header: 'Due Date' },
  { key: 'original', header: 'Original Amount' },
  { key: 'balance', header: 'Balance' },
  { key: 'aging', header: 'Aging Bucket' },
  { key: 'status', header: 'Status', render: (row) => (
    <span className="status-badge" style={{ background: STATUS_COLORS[row.status] }}>{row.status}</span>
  )},
];

const BLANK_AP = { vendor: '', bill: '', billDate: '', dueDate: '', amount: '', glAccount: '' };

export default function AccountsPayable() {
  const [showModal, setShowModal] = useState(false);
  const [apList, setApList] = useState(mockAP);
  const [form, setForm] = useState(BLANK_AP);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleCreate = () => {
    if (!form.vendor.trim() || !form.bill.trim()) return;
    const amtFmt = form.amount ? `$${parseFloat(form.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00';
    setApList(prev => [...prev, {
      bill: form.bill, vendor: form.vendor,
      billDate: form.billDate || '—', dueDate: form.dueDate || '—',
      original: amtFmt, balance: amtFmt, aging: '0-30', status: 'Pending',
    }]);
    setForm(BLANK_AP);
    setShowModal(false);
  };

  return (
    <div className="module-page">
      <PageHeader
        title="Accounts Payable"
        subtitle="Track all outstanding vendor bills and payable balances"
        actions={
          <>
            <Button variant="secondary" size="small">Aging Report</Button>
            <Button variant="primary" size="small" onClick={() => setShowModal(true)}>Record Bill
            </Button>
          </>
        }
      />

      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-label">Total AP</div>
          <div className="stat-value">$9,380.00</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Due This Month</div>
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>$3,200.00</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Overdue</div>
          <div className="stat-value overdue">$680.00</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Paid (MTD)</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>$5,500.00</div>
        </Card>
      </div>

      <Card title="AP Ledger">
        <Table columns={columns} data={apList} />
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(BLANK_AP); }} title="Record Bill" size="medium">
        <div className="form-grid">
          <Input label="Vendor" required value={form.vendor} onChange={set('vendor')} />
          <Input label="Bill Number" required value={form.bill} onChange={set('bill')} />
          <Input label="Bill Date" type="date" required value={form.billDate} onChange={set('billDate')} />
          <Input label="Due Date" type="date" required value={form.dueDate} onChange={set('dueDate')} />
          <Input label="Amount" type="number" required value={form.amount} onChange={set('amount')} />
          <Input label="GL Account" value={form.glAccount} onChange={set('glAccount')} />
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(BLANK_AP); }}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={!form.vendor.trim() || !form.bill.trim()}>Save</Button>
        </div>
      </Modal>
    </div>
  );
}
