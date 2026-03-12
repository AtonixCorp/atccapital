import React, { useState } from 'react';
import { Button, Card, PageHeader, Table, Input } from '../../../components/ui';

const MOCK_ENTRIES = [
  { id: 1, date: '2024-11-28', account: '1000 | Cash - USD', description: 'Wire transfer received from client invoice INV-2024-1847', debit: '$15,000.00', credit: '', balance: '$45,628.92' },
  { id: 2, date: '2024-11-28', account: '1200 | Accounts Receivable', description: 'Invoice INV-2024-1847 collected', debit: '', credit: '$15,000.00', balance: '$128,450.35' },
  { id: 3, date: '2024-11-27', account: '4100 | Service Revenue', description: 'Monthly retainer - ABC Corp (November)', debit: '', credit: '$8,500.00', balance: '$456,230.80' },
  { id: 4, date: '2024-11-27', account: '1000 | Cash - USD', description: 'ACH payment for vendor bills', debit: '', credit: '$6,250.00', balance: '$30,628.92' },
  { id: 5, date: '2024-11-26', account: '5100 | Office Rent', description: 'November 2024 rent payment - HQ office', debit: '$12,000.00', credit: '', balance: '$36,878.92' },
  { id: 6, date: '2024-11-26', account: '1000 | Cash - USD', description: 'Rent payment', debit: '', credit: '$12,000.00', balance: '$36,878.92' },
  { id: 7, date: '2024-11-25', account: '5200 | Utilities', description: 'Electricity and water - November', debit: '$2,145.63', credit: '', balance: '$48,878.92' },
  { id: 8, date: '2024-11-25', account: '1000 | Cash - USD', description: 'Utility payment', debit: '', credit: '$2,145.63', balance: '$48,878.92' },
  { id: 9, date: '2024-11-24', account: '5300 | Supplies', description: 'Office supplies - stationery, toner, etc', debit: '$540.92', credit: '', balance: '$51,024.55' },
  { id: 10, date: '2024-11-24', account: '2000 | Accounts Payable', description: 'Supplies purchased on account', debit: '', credit: '$540.92', balance: '$89,650.12' },
];

const GeneralLedger = () => {
  const [entries] = useState(MOCK_ENTRIES);
  const [filters, setFilters] = useState({ fromDate: '', toDate: '', account: '' });

  const filtered = entries.filter(e => {
    const matchDate = (
      (!filters.fromDate || e.date >= filters.fromDate) &&
      (!filters.toDate || e.date <= filters.toDate)
    );
    const matchAccount = !filters.account || e.account.toLowerCase().includes(filters.account.toLowerCase());
    return matchDate && matchAccount;
  });

  const columns = [
    { key: 'date', label: 'Date', width: '11%', render: v => <span style={{ fontWeight: 600 }}>{v}</span> },
    { key: 'account', label: 'Account', width: '22%', render: v => <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 500 }}>{v}</span> },
    { key: 'description', label: 'Description', width: '28%', render: v => <span style={{ fontSize: 13 }}>{v}</span> },
    { key: 'debit', label: 'Debit', width: '11%', render: v => <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: v ? '#15803d' : '#9ca3af' }}>{v || '—'}</span> },
    { key: 'credit', label: 'Credit', width: '11%', render: v => <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: v ? '#ef4444' : '#9ca3af' }}>{v || '—'}</span> },
    { key: 'balance', label: 'Running Balance', width: '17%', render: v => <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 700, color: 'var(--color-midnight)' }}>{v}</span> },
  ];

  return (
    <div className="gl-page">
      <PageHeader
        title="General Ledger"
        subtitle="View all posted transactions"
        actions={
          <>
            <Button variant="secondary">Print</Button>
            <Button variant="secondary">Export CSV</Button>
          </>
        }
      />

      <Card header="Ledger Filters">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
          <div>
            <div className="input-label" style={{ fontSize: 12, marginBottom: 6 }}>From Date</div>
            <Input type="date" value={filters.fromDate} onChange={e => setFilters(f => ({ ...f, fromDate: e.target.value }))} />
          </div>
          <div>
            <div className="input-label" style={{ fontSize: 12, marginBottom: 6 }}>To Date</div>
            <Input type="date" value={filters.toDate} onChange={e => setFilters(f => ({ ...f, toDate: e.target.value }))} />
          </div>
          <div>
            <div className="input-label" style={{ fontSize: 12, marginBottom: 6 }}>Account Filter</div>
            <Input placeholder="Search by account number or name" value={filters.account} onChange={e => setFilters(f => ({ ...f, account: e.target.value }))} />
          </div>
        </div>
        {(filters.fromDate || filters.toDate || filters.account) && (
          <Button variant="secondary" size="small" onClick={() => setFilters({ fromDate: '', toDate: '', account: '' })} style={{ marginTop: 12 }}>Clear Filters</Button>
        )}
      </Card>

      <Card header={`${filtered.length} transaction${filtered.length !== 1 ? 's' : ''}`}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-silver-dark)', padding: '32px 0' }}>No transactions match your filters</p>
        ) : (
          <Table columns={columns} data={filtered} />
        )}
      </Card>
    </div>
  );
};

export default GeneralLedger;
