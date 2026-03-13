import React from 'react';
import { Button, Card, PageHeader, Input, Modal, Table } from '../../../components/ui';

const BLANK_ACCOUNT = { code: '', name: '', type: '' };

const ChartOfAccounts = () => {
  const [showModal, setShowModal] = React.useState(false);
  const [data, setData] = React.useState([]);
  const [form, setForm] = React.useState(BLANK_ACCOUNT);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleCreate = () => {
    if (!form.code.trim() || !form.name.trim()) return;
    setData(prev => [...prev, { ...form, balance: '$0.00', status: 'Active' }]);
    setForm(BLANK_ACCOUNT);
    setShowModal(false);
  };

  const columns = [
    { key: 'code', label: 'Account Code', width: '20%' },
    { key: 'name', label: 'Account Name', width: '35%' },
    { key: 'type', label: 'Type', width: '15%' },
    { key: 'balance', label: 'Balance', width: '15%' },
    { key: 'status', label: 'Status', width: '15%' },
  ];

  return (
    <div className="coa-page">
      <PageHeader
        title="Chart of Accounts"
        subtitle="Manage your account structure"
        actions={
          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
          >New Account
          </Button>
        }
      />

      <Card>
        {data.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-silver-dark)', padding: '32px 0' }}>No accounts yet. Create your first account to get started.
          </p>
        ) : (
          <Table columns={columns} data={data} />
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setForm(BLANK_ACCOUNT); }}
        title="Create Account"
        size="large"
      >
        <Input label="Account Code" required value={form.code} onChange={set('code')} />
        <Input label="Account Name" required value={form.name} onChange={set('name')} />
        <Input label="Account Type" required value={form.type} onChange={set('type')} />

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(BLANK_ACCOUNT); }}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={!form.code.trim() || !form.name.trim()}>Create Account</Button>
        </div>
      </Modal>
    </div>
  );
};

export default ChartOfAccounts;
