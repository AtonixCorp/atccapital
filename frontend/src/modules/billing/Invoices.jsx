import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../components/ui';

const STATUS_COLORS = {
  paid: 'var(--color-success)',
  pending: 'var(--color-warning)',
  overdue: 'var(--color-error)',
  draft: 'var(--color-silver-dark)',
};

const mockInvoices = [
  { id: 'INV-0001', customer: 'Acme Corp', amount: '$12,500.00', due: '2025-02-15', issued: '2025-01-15', status: 'pending' },
  { id: 'INV-0002', customer: 'Globex Inc', amount: '$4,200.00', due: '2025-01-30', issued: '2025-01-01', status: 'overdue' },
  { id: 'INV-0003', customer: 'Initech LLC', amount: '$8,750.00', due: '2025-02-28', issued: '2025-01-28', status: 'draft' },
  { id: 'INV-0004', customer: 'Umbrella Co', amount: '$31,000.00', due: '2025-01-20', issued: '2024-12-20', status: 'paid' },
];

const columns = [
  { key: 'id', header: 'Invoice #' },
  { key: 'customer', header: 'Customer' },
  { key: 'issued', header: 'Issue Date' },
  { key: 'due', header: 'Due Date' },
  { key: 'amount', header: 'Amount' },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <span className="status-badge" style={{ background: STATUS_COLORS[row.status] }}>
        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
      </span>
    ),
  },
];

const BLANK_INVOICE = { customer: '', invoiceDate: '', dueDate: '', reference: '' };

export default function Invoices() {
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all');
  const [invoiceList, setInvoiceList] = useState(mockInvoices);
  const [form, setForm] = useState(BLANK_INVOICE);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleCreate = () => {
    if (!form.customer.trim()) return;
    const id = `INV-${String(invoiceList.length + 1).padStart(4, '0')}`;
    setInvoiceList(prev => [...prev, { id, customer: form.customer, issued: form.invoiceDate || '—', due: form.dueDate || '—', amount: '$0.00', status: 'draft' }]);
    setForm(BLANK_INVOICE);
    setShowModal(false);
  };

  const filtered = filter === 'all' ? invoiceList : invoiceList.filter((i) => i.status === filter);
  const totalOutstanding = '$16,700.00';
  const totalOverdue = '$4,200.00';
  const totalDraft = '$8,750.00';

  return (
    <div className="module-page">
      <PageHeader
        title="Invoices"
        subtitle="Create and manage customer invoices"
        actions={
          <>
            <Button variant="secondary" size="small">Export</Button>
            <Button variant="primary" size="small" onClick={() => setShowModal(true)}>New Invoice
            </Button>
          </>
        }
      />

      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-label">Outstanding</div>
          <div className="stat-value">{totalOutstanding}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Overdue</div>
          <div className="stat-value overdue">{totalOverdue}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Draft</div>
          <div className="stat-value muted">{totalDraft}</div>
        </Card>
      </div>

      <Card>
        <div className="filter-bar">

          {['all', 'paid', 'pending', 'overdue', 'draft'].map((f) => (
            <button
              key={f}
              className={`filter-btn${filter === f ? ' active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <Table columns={columns} data={filtered} />
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(BLANK_INVOICE); }} title="Create Invoice" size="medium">
        <div className="form-grid">
          <Input label="Customer" required placeholder="Select customer..." value={form.customer} onChange={set('customer')} />
          <Input label="Invoice Date" type="date" required value={form.invoiceDate} onChange={set('invoiceDate')} />
          <Input label="Due Date" type="date" required value={form.dueDate} onChange={set('dueDate')} />
          <Input label="Reference" placeholder="PO number or reference..." value={form.reference} onChange={set('reference')} />
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(BLANK_INVOICE); }}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={!form.customer.trim()}>Create Invoice</Button>
        </div>
      </Modal>
    </div>
  );
}
