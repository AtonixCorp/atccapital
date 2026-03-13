import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../components/ui';

const STATUS_COLORS = { paid: 'var(--color-success)', pending: 'var(--color-warning)', overdue: 'var(--color-error)', draft: 'var(--color-silver-dark)' };

const mockBills = [
  { id: 'BILL-0001', vendor: 'AWS Cloud', amount: '$3,200.00', due: '2025-02-10', status: 'pending', category: 'Technology' },
  { id: 'BILL-0002', vendor: 'Office Depot', amount: '$680.00', due: '2025-01-25', status: 'overdue', category: 'Supplies' },
  { id: 'BILL-0003', vendor: 'KPMG Advisory', amount: '$15,000.00', due: '2025-03-01', status: 'draft', category: 'Professional Services' },
  { id: 'BILL-0004', vendor: 'Landlord LLC', amount: '$5,500.00', due: '2025-02-01', status: 'paid', category: 'Rent' },
];

const columns = [
  { key: 'id', header: 'Bill #' },
  { key: 'vendor', header: 'Vendor' },
  { key: 'category', header: 'Category' },
  { key: 'due', header: 'Due Date' },
  { key: 'amount', header: 'Amount' },
  { key: 'status', header: 'Status', render: (row) => (
    <span className="status-badge" style={{ background: STATUS_COLORS[row.status] }}>
      {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
    </span>
  )},
];

const BLANK_BILL = { vendor: '', billDate: '', dueDate: '', amount: '', category: '', reference: '' };

export default function Bills() {
  const [showModal, setShowModal] = useState(false);
  const [billList, setBillList] = useState(mockBills);
  const [form, setForm] = useState(BLANK_BILL);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleCreate = () => {
    if (!form.vendor.trim()) return;
    const id = `BILL-${String(billList.length + 1).padStart(4, '0')}`;
    const amtFmt = form.amount ? `$${parseFloat(form.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00';
    setBillList(prev => [...prev, { id, vendor: form.vendor, category: form.category || '—', due: form.dueDate || '—', amount: amtFmt, status: 'pending' }]);
    setForm(BLANK_BILL);
    setShowModal(false);
  };

  return (
    <div className="module-page">
      <PageHeader
        title="Bills"
        subtitle="Manage vendor bills and payables"
        actions={
          <>
            <Button variant="secondary" size="small">Export</Button>
            <Button variant="primary" size="small" onClick={() => setShowModal(true)}>New Bill
            </Button>
          </>
        }
      />

      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-label">Total Payable</div>
          <div className="stat-value">$18,900.00</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Overdue</div>
          <div className="stat-value overdue">$680.00</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Due This Month</div>
          <div className="stat-value">$8,700.00</div>
        </Card>
      </div>

      <Card>
        <Table columns={columns} data={billList} />
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(BLANK_BILL); }} title="Create Bill" size="medium">
        <div className="form-grid">
          <Input label="Vendor" required placeholder="Select vendor..." value={form.vendor} onChange={set('vendor')} />
          <Input label="Bill Date" type="date" required value={form.billDate} onChange={set('billDate')} />
          <Input label="Due Date" type="date" required value={form.dueDate} onChange={set('dueDate')} />
          <Input label="Amount" type="number" required placeholder="0.00" value={form.amount} onChange={set('amount')} />
          <Input label="Category" placeholder="Expense category..." value={form.category} onChange={set('category')} />
          <Input label="Reference" placeholder="Vendor invoice number..." value={form.reference} onChange={set('reference')} />
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(BLANK_BILL); }}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={!form.vendor.trim()}>Create Bill</Button>
        </div>
      </Modal>
    </div>
  );
}
