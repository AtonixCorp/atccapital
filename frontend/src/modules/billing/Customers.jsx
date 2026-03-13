import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../components/ui';

const mockCustomers = [
  { id: 'C-001', name: 'Acme Corp', email: 'billing@acme.com', phone: '+1 (555) 100-2000', balance: '$12,500.00', status: 'Active' },
  { id: 'C-002', name: 'Globex Inc', email: 'ap@globex.com', phone: '+1 (555) 200-3000', balance: '$4,200.00', status: 'Active' },
  { id: 'C-003', name: 'Initech LLC', email: 'finance@initech.com', phone: '+1 (555) 300-4000', balance: '$0.00', status: 'Inactive' },
  { id: 'C-004', name: 'Umbrella Co', email: 'accounts@umbrella.com', phone: '+1 (555) 400-5000', balance: '$31,000.00', status: 'Active' },
];

const columns = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Customer Name' },
  { key: 'email', header: 'Email', render: (row) => (
    <a href={`mailto:${row.email}`} style={{ color: 'var(--color-cyan)' }}>{row.email}</a>
  )},
  { key: 'phone', header: 'Phone', render: (row) => (
    <span>{row.phone}</span>
  )},
  { key: 'balance', header: 'Balance' },
  { key: 'status', header: 'Status', render: (row) => (
    <span className="status-badge" style={{ background: row.status === 'Active' ? 'var(--color-success)' : 'var(--color-silver-dark)' }}>
      {row.status}
    </span>
  )},
];

const BLANK_CUSTOMER = { companyName: '', contactName: '', email: '', phone: '', address: '', taxId: '', paymentTerms: 'Net 30', currency: 'USD' };

export default function Customers() {
  const [showModal, setShowModal] = useState(false);
  const [customerList, setCustomerList] = useState(mockCustomers);
  const [form, setForm] = useState(BLANK_CUSTOMER);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleCreate = () => {
    if (!form.companyName.trim()) return;
    const id = `C-${String(customerList.length + 1).padStart(3, '0')}`;
    setCustomerList(prev => [...prev, { id, name: form.companyName, email: form.email || '—', phone: form.phone || '—', balance: '$0.00', status: 'Active' }]);
    setForm(BLANK_CUSTOMER);
    setShowModal(false);
  };

  return (
    <div className="module-page">
      <PageHeader
        title="Customers"
        subtitle="Manage your customer directory and accounts receivable contacts"
        actions={
          <Button variant="primary" size="small" onClick={() => setShowModal(true)}>Add Customer
          </Button>
        }
      />

      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-label">Total Customers</div>
          <div className="stat-value">4</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value">3</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Total Receivable</div>
          <div className="stat-value">$47,700.00</div>
        </Card>
      </div>

      <Card>
        <Table columns={columns} data={customerList} />
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(BLANK_CUSTOMER); }} title="Add Customer" size="medium">
        <div className="form-grid">
          <Input label="Company Name" required value={form.companyName} onChange={set('companyName')} />
          <Input label="Contact Name" value={form.contactName} onChange={set('contactName')} />
          <Input label="Email" type="email" required value={form.email} onChange={set('email')} />
          <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} />
          <Input label="Address" value={form.address} onChange={set('address')} />
          <Input label="Tax ID / VAT Number" value={form.taxId} onChange={set('taxId')} />
          <Input label="Payment Terms" placeholder="e.g. Net 30" value={form.paymentTerms} onChange={set('paymentTerms')} />
          <Input label="Currency" placeholder="USD" value={form.currency} onChange={set('currency')} />
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(BLANK_CUSTOMER); }}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={!form.companyName.trim()}>Save Customer</Button>
        </div>
      </Modal>
    </div>
  );
}
