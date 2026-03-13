import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../components/ui';

const integrations = [
  { id: 'INT-001', name: 'Chase Bank (Direct Feed)', type: 'Banking', method: 'Plaid API', lastSync: '2025-01-31 06:02', status: 'Connected' },
  { id: 'INT-002', name: 'Stripe Payments', type: 'Payment Processor', method: 'Stripe API', lastSync: '2025-01-31 09:15', status: 'Connected' },
  { id: 'INT-003', name: 'ADP Payroll', type: 'Payroll', method: 'ADP API', lastSync: '2025-01-30 18:00', status: 'Connected' },
  { id: 'INT-004', name: 'Salesforce CRM', type: 'CRM', method: 'OAuth 2.0', lastSync: '—', status: 'Disconnected' },
];

const STATUS_COLORS = { Connected: 'var(--color-success)', Disconnected: 'var(--color-silver-dark)', Error: 'var(--color-error)' };

const columns = [
  { key: 'name', header: 'Integration' },
  { key: 'type', header: 'Type' },
  { key: 'method', header: 'Auth Method' },
  { key: 'lastSync', header: 'Last Sync' },
  { key: 'status', header: 'Status', render: (row) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

      <span className="status-badge" style={{ background: STATUS_COLORS[row.status] }}>{row.status}</span>
    </div>
  )},
];

const BLANK_INT = { name: '', type: '', apiKey: '', apiSecret: '', webhookUrl: '' };

export default function IntegrationsList() {
  const [showModal, setShowModal] = useState(false);
  const [intList, setIntList] = useState(integrations);
  const [form, setForm] = useState(BLANK_INT);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleCreate = () => {
    if (!form.name.trim()) return;
    const id = `INT-${String(intList.length + 1).padStart(3, '0')}`;
    setIntList(prev => [...prev, { id, name: form.name, type: form.type || '—', method: 'API Key', lastSync: '—', status: 'Connected' }]);
    setForm(BLANK_INT);
    setShowModal(false);
  };

  return (
    <div className="module-page">
      <PageHeader
        title="Integrations"
        subtitle="Connect your accounting platform with banks, payment processors, and third-party tools"
        actions={
          <Button variant="primary" size="small" onClick={() => setShowModal(true)}>Add Integration
          </Button>
        }
      />

      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-label">Connected</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>3</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Disconnected</div>
          <div className="stat-value" style={{ color: 'var(--color-silver-dark)' }}>1</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Sync Errors</div>
          <div className="stat-value" style={{ color: 'var(--color-error)' }}>0</div>
        </Card>
      </div>

      <Card>
        <Table columns={columns} data={intList} />
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(BLANK_INT); }} title="Add Integration" size="medium">
        <div className="form-grid">
          <Input label="Integration Name" required placeholder="e.g. Chase Bank" value={form.name} onChange={set('name')} />
          <Input label="Integration Type" placeholder="Banking, Payroll, CRM, Payment..." value={form.type} onChange={set('type')} />
          <Input label="API Key / Client ID" value={form.apiKey} onChange={set('apiKey')} />
          <Input label="API Secret / Client Secret" type="password" value={form.apiSecret} onChange={set('apiSecret')} />
          <Input label="Webhook URL (if applicable)" value={form.webhookUrl} onChange={set('webhookUrl')} />
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(BLANK_INT); }}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={!form.name.trim()}>Connect</Button>
        </div>
      </Modal>
    </div>
  );
}
