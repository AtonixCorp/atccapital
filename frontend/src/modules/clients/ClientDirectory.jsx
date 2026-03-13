import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../components/ui';

const mockClients = [
  { id: 'CLI-001', name: 'Acme Corporation', industry: 'Manufacturing', entities: 3, engagement: 'Full Service', contact: 'John Smith', email: 'jsmith@acme.com', status: 'Active' },
  { id: 'CLI-002', name: 'Globex Holdings', industry: 'Finance', entities: 7, engagement: 'Tax Only', contact: 'Jane Doe', email: 'jdoe@globex.com', status: 'Active' },
  { id: 'CLI-003', name: 'Initech Group', industry: 'Technology', entities: 2, engagement: 'Bookkeeping', contact: 'Bob Jones', email: 'bjones@initech.com', status: 'Inactive' },
];

const columns = [
  { key: 'id', header: 'Client ID' },
  { key: 'name', header: 'Client Name' },
  { key: 'industry', header: 'Industry' },
  { key: 'entities', header: 'Entities' },
  { key: 'engagement', header: 'Engagement Type' },
  { key: 'contact', header: 'Primary Contact' },
  { key: 'email', header: 'Email' },
  { key: 'status', header: 'Status', render: (row) => (
    <span className="status-badge" style={{ background: row.status === 'Active' ? 'var(--color-success)' : 'var(--color-silver-dark)' }}>{row.status}</span>
  )},
];

const BLANK_CLIENT = { name: '', industry: '', engagement: '', contactName: '', email: '', phone: '', address: '', taxId: '' };

export default function ClientDirectory() {
  const [showModal, setShowModal] = useState(false);
  const [clientList, setClientList] = useState(mockClients);
  const [form, setForm] = useState(BLANK_CLIENT);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleCreate = () => {
    if (!form.name.trim()) return;
    const id = `CLI-${String(clientList.length + 1).padStart(3, '0')}`;
    setClientList(prev => [...prev, { id, name: form.name, industry: form.industry || '—', entities: 0, engagement: form.engagement || '—', contact: form.contactName || '—', email: form.email || '—', status: 'Active' }]);
    setForm(BLANK_CLIENT);
    setShowModal(false);
  };

  return (
    <div className="module-page">
      <PageHeader
        title="Client Directory"
        subtitle="Manage client accounts, engagement types, and contact information"
        actions={
          <Button variant="primary" size="small" onClick={() => setShowModal(true)}>Add Client
          </Button>
        }
      />

      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-label">Total Clients</div>
          <div className="stat-value">3</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>2</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Total Entities Managed</div>
          <div className="stat-value">12</div>
        </Card>
      </div>

      <Card>
        <Table columns={columns} data={clientList} />
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(BLANK_CLIENT); }} title="Add Client" size="medium">
        <div className="form-grid">
          <Input label="Client Name" required value={form.name} onChange={set('name')} />
          <Input label="Industry" value={form.industry} onChange={set('industry')} />
          <Input label="Engagement Type" placeholder="Full Service, Tax Only, Bookkeeping..." value={form.engagement} onChange={set('engagement')} />
          <Input label="Primary Contact Name" required value={form.contactName} onChange={set('contactName')} />
          <Input label="Primary Contact Email" type="email" required value={form.email} onChange={set('email')} />
          <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} />
          <Input label="Address" value={form.address} onChange={set('address')} />
          <Input label="Tax ID" value={form.taxId} onChange={set('taxId')} />
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(BLANK_CLIENT); }}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={!form.name.trim()}>Add Client</Button>
        </div>
      </Modal>
    </div>
  );
}
