import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../../components/ui';

const mockAccounts = [
  { account: 'Operating - Chase 4521', type: 'Checking', balance: '$142,300.00', lastReconciled: '2025-01-31', transactions: 48, status: 'Reconciled' },
  { account: 'Payroll - Chase 7832', type: 'Checking', balance: '$38,500.00', lastReconciled: '2025-01-31', transactions: 12, status: 'Reconciled' },
  { account: 'Savings - BofA 9901', type: 'Savings', balance: '$500,000.00', lastReconciled: '2025-01-15', transactions: 4, status: 'Pending' },
  { account: 'Money Market - Fidelity', type: 'Investment', balance: '$1,200,000.00', lastReconciled: '2025-01-31', transactions: 2, status: 'Reconciled' },
];

const STATUS_COLORS = { Reconciled: 'var(--color-success)', Pending: 'var(--color-warning)', Unreconciled: 'var(--color-error)' };

const columns = [
  { key: 'account', header: 'Account' },
  { key: 'type', header: 'Type' },
  { key: 'balance', header: 'Balance' },
  { key: 'lastReconciled', header: 'Last Reconciled' },
  { key: 'transactions', header: 'Transactions' },
  { key: 'status', header: 'Status', render: (row) => (
    <span className="status-badge" style={{ background: STATUS_COLORS[row.status] }}>{row.status}</span>
  )},
];

const BLANK_ACCOUNT = { accountName: '', bankName: '', accountNumber: '', accountType: '', currency: 'USD', glAccount: '' };

export default function CashBank() {
  const [showModal, setShowModal] = useState(false);
  const [accountList, setAccountList] = useState(mockAccounts);
  const [form, setForm] = useState(BLANK_ACCOUNT);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleCreate = () => {
    if (!form.accountName.trim() || !form.bankName.trim()) return;
    setAccountList(prev => [...prev, {
      account: `${form.accountName} - ${form.bankName} ${form.accountNumber}`,
      type: form.accountType || 'Checking',
      balance: '$0.00',
      lastReconciled: '—',
      transactions: 0,
      status: 'Pending',
    }]);
    setForm(BLANK_ACCOUNT);
    setShowModal(false);
  };

  return (
    <div className="module-page">
      <PageHeader
        title="Cash & Bank"
        subtitle="Monitor bank accounts, cash positions, and reconciliation status"
        actions={
          <>
            <Button variant="secondary" size="small">Sync Transactions</Button>
            <Button variant="primary" size="small" onClick={() => setShowModal(true)}>Add Account
            </Button>
          </>
        }
      />

      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-label">Total Cash Position</div>
          <div className="stat-value">$1,880,800.00</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Accounts Reconciled</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>3 / 4</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Unreconciled Txns</div>
          <div className="stat-value" style={{ color: 'var(--color-warning)' }}>4</div>
        </Card>
      </div>

      <Card title="Bank Accounts">
        <Table columns={columns} data={accountList} />
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(BLANK_ACCOUNT); }} title="Add Bank Account" size="medium">
        <div className="form-grid">
          <Input label="Account Name" required value={form.accountName} onChange={set('accountName')} />
          <Input label="Bank Name" required value={form.bankName} onChange={set('bankName')} />
          <Input label="Account Number (last 4)" required value={form.accountNumber} onChange={set('accountNumber')} />
          <Input label="Account Type" placeholder="Checking / Savings / Investment" value={form.accountType} onChange={set('accountType')} />
          <Input label="Currency" placeholder="USD" value={form.currency} onChange={set('currency')} />
          <Input label="GL Account Code" value={form.glAccount} onChange={set('glAccount')} />
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(BLANK_ACCOUNT); }}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={!form.accountName.trim() || !form.bankName.trim()}>Add Account</Button>
        </div>
      </Modal>
    </div>
  );
}
