import React, { useEffect, useMemo, useState } from 'react';
import { PageHeader, Card, Table, Button, Input } from '../../components/ui';
import { chartOfAccountsAPI, entitiesAPI } from '../../services/api';

const parseList = (response) => response.data.results || response.data;
const formatError = (error, fallback) => {
  const data = error.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  return Object.entries(data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(' | ');
};
const formatMoney = (value) => `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const normalDebitTypes = new Set(['asset', 'expense']);

export default function TrialBalance() {
  const [accounts, setAccounts] = useState([]);
  const [entities, setEntities] = useState([]);
  const [entityId, setEntityId] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEntities() {
      try {
        const response = await entitiesAPI.getAll();
        const entityList = parseList(response);
        setEntities(entityList);
        setEntityId(String(entityList[0]?.id || ''));
      } catch (requestError) {
        setError(formatError(requestError, 'Failed to load entities.'));
      }
    }
    loadEntities();
  }, []);

  useEffect(() => {
    async function loadAccounts() {
      if (!entityId) return;
      setLoading(true);
      try {
        const response = await chartOfAccountsAPI.getAll({ entity_id: entityId });
        setAccounts(parseList(response));
        setError('');
      } catch (requestError) {
        setError(formatError(requestError, 'Failed to load chart of accounts.'));
      }
      setLoading(false);
    }
    loadAccounts();
  }, [entityId]);

  const rows = useMemo(() => {
    return accounts
      .map((account) => {
        const type = String(account.account_type || '').toLowerCase();
        const balance = Number(account.current_balance ?? account.opening_balance ?? 0);
        const debit = normalDebitTypes.has(type) ? Math.max(balance, 0) : Math.max(-balance, 0);
        const credit = normalDebitTypes.has(type) ? Math.max(-balance, 0) : Math.max(balance, 0);
        return {
          id: account.id,
          code: account.account_code,
          account: account.account_name,
          type: account.account_type,
          debit,
          credit,
          balance,
        };
      })
      .filter((row) => !search || `${row.code} ${row.account} ${row.type}`.toLowerCase().includes(search.toLowerCase()));
  }, [accounts, search]);

  const totalDebits = rows.reduce((sum, row) => sum + row.debit, 0);
  const totalCredits = rows.reduce((sum, row) => sum + row.credit, 0);
  const difference = totalDebits - totalCredits;
  const columns = [
    { key: 'code', label: 'Code', render: (value) => <code style={{ fontSize: 12 }}>{value}</code> },
    { key: 'account', label: 'Account Name' },
    { key: 'type', label: 'Type' },
    { key: 'debit', label: 'Debit', render: (value) => value ? formatMoney(value) : '—' },
    { key: 'credit', label: 'Credit', render: (value) => value ? formatMoney(value) : '—' },
    { key: 'balance', label: 'Balance', render: (value) => formatMoney(value) },
  ];

  return (
    <div className="module-page">
      <PageHeader title="Trial Balance" subtitle="Verify debit and credit balances from the live chart of accounts" actions={<Button variant="secondary" size="small" onClick={() => {
        const csv = ['Code,Account,Type,Debit,Credit,Balance', ...rows.map((row) => [row.code, row.account, row.type, row.debit, row.credit, row.balance].join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'trial-balance.csv';
        link.click();
        URL.revokeObjectURL(url);
      }}>Export</Button>} />

      {error ? <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div> : null}

      <div className="stats-row">
        <Card className="stat-card"><div className="stat-label">Total Debits</div><div className="stat-value">{formatMoney(totalDebits)}</div></Card>
        <Card className="stat-card"><div className="stat-label">Total Credits</div><div className="stat-value">{formatMoney(totalCredits)}</div></Card>
        <Card className="stat-card"><div className="stat-label">Difference</div><div className="stat-value" style={{ color: Math.abs(difference) > 0.01 ? 'var(--color-error)' : 'var(--color-success)' }}>{formatMoney(difference)}</div></Card>
        <Card className="stat-card"><div className="stat-label">Accounts</div><div className="stat-value">{rows.length}</div></Card>
      </div>

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Entity</label>
            <select value={entityId} onChange={(event) => setEntityId(event.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
              {entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
            </select>
          </div>
          <Input placeholder="Search by account name, code, or type..." value={search} onChange={(event) => setSearch(event.target.value)} />
        </div>
      </Card>

      <Card title="Trial Balance">
        {loading ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-silver-dark)' }}>Loading trial balance...</div> : <Table columns={columns} data={rows} />}
      </Card>
    </div>
  );
}
