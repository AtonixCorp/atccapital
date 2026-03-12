import React, { useState } from 'react';
import { Button, Card, PageHeader, Table } from '../../../components/ui';

const MOCK_ACCOUNTS = [
  { id: 1, account: 'Chase Business - USD', ledger_balance: '$24,582.45', bank_balance: '$24,582.45', reconciled: '$24,582.45', variance: '$0.00', status: 'Reconciled', last_update: '2024-11-28' },
  { id: 2, account: 'HSBC Business - EUR', ledger_balance: '€18,650.92', bank_balance: '€18,620.15', reconciled: '€18,620.15', variance: '€30.77', status: 'Variance', last_update: '2024-11-27' },
  { id: 3, account: 'Wells Fargo - CAD', ledger_balance: 'CAD 31,240.00', bank_balance: 'CAD 31,240.00', reconciled: 'CAD 31,240.00', variance: '$0.00', status: 'Reconciled', last_update: '2024-11-28' },
  { id: 4, account: 'DBS Singapore - SGD', ledger_balance: 'SGD 42,155.60', bank_balance: 'SGD 41,920.35', reconciled: 'SGD 41,920.35', variance: 'SGD 235.25', status: 'Pending', last_update: '2024-11-26' },
  { id: 5, account: 'Revolut - Multi-Currency', ledger_balance: '$8,420.12', bank_balance: '$8,420.12', reconciled: 'N/A', variance: 'N/A', status: 'Not Started', last_update: '—' },
];

const STATUS_COLOR = { Reconciled: '#15803d', Variance: '#f59e0b', Pending: '#3b82f6', 'Not Started': '#6b7280' };

const Reconciliation = () => {
  const [accounts] = useState(MOCK_ACCOUNTS);
  const [selected, setSelected] = useState(null);

  const reconciled_count = accounts.filter(a => a.status === 'Reconciled').length;
  const variance_count = accounts.filter(a => a.status === 'Variance').length;
  const pending_count = accounts.filter(a => a.status === 'Pending').length;
  const not_started_count = accounts.filter(a => a.status === 'Not Started').length;

  const columns = [
    { key: 'account', label: 'Account', width: '25%', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'ledger_balance', label: 'Ledger Balance', width: '18%', render: v => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
    { key: 'bank_balance', label: 'Bank Balance', width: '18%', render: v => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span> },
    { key: 'variance', label: 'Variance', width: '12%', render: v => <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: v === '$0.00' || v === 'N/A' ? '#15803d' : '#ef4444' }}>{v}</span> },
    {
      key: 'status', label: 'Status', width: '15%',
      render: v => <span style={{ fontWeight: 700, fontSize: 12, color: STATUS_COLOR[v] || '#6b7280' }}>{v}</span>,
    },
    { key: 'last_update', label: 'Last Update', width: '12%', render: v => <span style={{ color: 'var(--color-silver-dark)', fontSize: 12 }}>{v}</span> },
  ];

  return (
    <div className="reconciliation-page">
      <PageHeader
        title="Reconciliation"
        subtitle="Bank and account matching"
        actions={
          <>
            <Button variant="secondary">Sync Banks</Button>
            <Button variant="primary">Start New Reconciliation</Button>
          </>
        }
      />

      <div className="stats-row">
        {[
          { label: 'Reconciled', value: reconciled_count, accent: '#15803d' },
          { label: 'Variance', value: variance_count, accent: '#f59e0b' },
          { label: 'Pending', value: pending_count, accent: '#3b82f6' },
          { label: 'Not Started', value: not_started_count, accent: '#6b7280' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.accent}` }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.accent }}>{s.value}</div>
          </div>
        ))}
      </div>

      <Card header="Account Status">
        <Table columns={columns} data={accounts} onRowClick={row => setSelected(row)} />
      </Card>

      {selected && (
        <Card header={`Reconciliation Details — ${selected.account}`} style={{ marginTop: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-silver-dark)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>Ledger Balance</div>
              <div style={{ fontWeight: 700, fontSize: 18, fontFamily: 'monospace' }}>{selected.ledger_balance}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-silver-dark)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>Bank Balance</div>
              <div style={{ fontWeight: 700, fontSize: 18, fontFamily: 'monospace' }}>{selected.bank_balance}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--color-silver-dark)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>Difference</div>
              <div style={{ fontWeight: 700, fontSize: 18, fontFamily: 'monospace', color: selected.variance === '$0.00' || selected.variance === 'N/A' ? '#15803d' : '#ef4444' }}>{selected.variance}</div>
            </div>
          </div>
          {selected.status === 'Variance' && (
            <div style={{ background: '#fef3c7', border: '1px solid #fcd34d', borderRadius: 8, padding: 12, fontSize: 13, color: '#78350f' }}>
              <span style={{ fontWeight: 700 }}>⚠ Variance detected.</span> Review outstanding transactions and deposits not yet cleared by the bank.
            </div>
          )}
          {selected.status === 'Not Started' && (
            <Button variant="primary" onClick={() => setSelected(null)}>Begin Reconciliation</Button>
          )}
        </Card>
      )}
    </div>
  );
};

export default Reconciliation;
