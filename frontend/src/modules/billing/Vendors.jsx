import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../components/ui';

const mockVendors = [
  { id: 'V-001', name: 'AWS Cloud', email: 'billing@aws.com', category: 'Technology', balance: '$3,200.00', status: 'Active' },
  { id: 'V-002', name: 'Office Depot', email: 'corp@officedepot.com', category: 'Supplies', balance: '$680.00', status: 'Active' },
  { id: 'V-003', name: 'KPMG Advisory', email: 'invoices@kpmg.com', category: 'Professional Services', balance: '$15,000.00', status: 'Active' },
  { id: 'V-004', name: 'Landlord LLC', email: 'rent@landlord.com', category: 'Rent', balance: '$0.00', status: 'Active' },
];

const columns = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Vendor Name' },
  { key: 'email', header: 'Email' },
  { key: 'category', header: 'Category' },
  { key: 'balance', header: 'Outstanding' },
  { key: 'status', header: 'Status', render: (row) => (
    <span className="status-badge" style={{ background: 'var(--color-success)' }}>{row.status}</span>
  )},
];

const BLANK_VENDOR = { companyName: '', contactName: '', email: '', phone: '', category: '', taxId: '', paymentTerms: 'Net 30', bankInfo: '' };

export default function Vendors() {
  const [showModal, setShowModal] = useState(false);
  const [vendorList, setVendorList] = useState(mockVendors);
  const [form, setForm] = useState(BLANK_VENDOR);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleCreate = () => {
    if (!form.companyName.trim()) return;
    const id = `V-${String(vendorList.length + 1).padStart(3, '0')}`;
    setVendorList(prev => [...prev, { id, name: form.companyName, email: form.email || '—', category: form.category || '—', balance: '$0.00', status: 'Active' }]);
    setForm(BLANK_VENDOR);
    setShowModal(false);
  };

  return (
    <div className="module-page">
      <PageHeader
        title="Vendors"
        subtitle="Manage your vendor directory and accounts payable contacts"
        actions={
          <Button variant="primary" size="small" onClick={() => setShowModal(true)}>Add Vendor
          </Button>
        }
      />

      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-label">Total Vendors</div>
          <div className="stat-value">4</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value">4</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Total Payable</div>
          <div className="stat-value">$18,880.00</div>
        </Card>
      </div>

      <Card>
        <Table columns={columns} data={vendorList} />
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(BLANK_VENDOR); }} title="Add Vendor" size="medium">
        <div className="form-grid">
          <Input label="Company Name" required value={form.companyName} onChange={set('companyName')} />
          <Input label="Contact Name" value={form.contactName} onChange={set('contactName')} />
          <Input label="Email" type="email" value={form.email} onChange={set('email')} />
          <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} />
          <Input label="Category" placeholder="e.g. Technology, Supplies..." value={form.category} onChange={set('category')} />
          <Input label="Tax ID / W-9" value={form.taxId} onChange={set('taxId')} />
          <Input label="Payment Terms" placeholder="e.g. Net 30" value={form.paymentTerms} onChange={set('paymentTerms')} />
          <Input label="Bank / ACH Info" value={form.bankInfo} onChange={set('bankInfo')} />
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(BLANK_VENDOR); }}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={!form.companyName.trim()}>Save Vendor</Button>
        </div>
      </Modal>
    </div>
  );
}
