import React from 'react';
import { Button, Card, PageHeader, Input, Modal, Table } from '../../../components/ui';

const BLANK_JE = { date: '', reference: '', description: '', amount: '' };

const JournalEntries = () => {
  const [showModal, setShowModal] = React.useState(false);
  const [data, setData] = React.useState([]);
  const [form, setForm] = React.useState(BLANK_JE);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleCreate = () => {
    if (!form.date.trim() || !form.reference.trim()) return;
    setData(prev => [...prev, { ...form, status: 'Draft', posted: 'No' }]);
    setForm(BLANK_JE);
    setShowModal(false);
  };

  const columns = [
    { key: 'date', label: 'Date', width: '15%' },
    { key: 'reference', label: 'Reference', width: '15%' },
    { key: 'description', label: 'Description', width: '35%' },
    { key: 'amount', label: 'Amount', width: '15%' },
    { key: 'status', label: 'Status', width: '15%' },
    { key: 'posted', label: 'Posted', width: '10%' },
  ];

  return (
    <div className="journals-page">
      <PageHeader
        title="Journal Entries"
        subtitle="Record and manage transactions"
        actions={
          <Button
            variant="primary"
            onClick={() => setShowModal(true)}
          >New Journal Entry
          </Button>
        }
      />

      <Card>
        {data.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-silver-dark)', padding: '32px 0' }}>No journal entries yet
          </p>
        ) : (
          <Table columns={columns} data={data} />
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setForm(BLANK_JE); }}
        title="Create Journal Entry"
        size="large"
      >
        <Input label="Date" type="date" required value={form.date} onChange={set('date')} />
        <Input label="Reference" required value={form.reference} onChange={set('reference')} />
        <Input label="Description" required value={form.description} onChange={set('description')} />
        <Input label="Amount" type="number" value={form.amount} onChange={set('amount')} />

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(BLANK_JE); }}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={!form.date.trim() || !form.reference.trim()}>Create Entry</Button>
        </div>
      </Modal>
    </div>
  );
};

export default JournalEntries;
