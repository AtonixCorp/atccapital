import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, PageHeader, Table } from '../../../components/ui';
import { generalLedgerAPI, entitiesAPI } from '../../../services/api';

export default function GeneralLedger() {
  const [entries, setEntries] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterEntity, setFilterEntity] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterEntity) params.entity_id = filterEntity;
      const [gRes, eRes] = await Promise.all([generalLedgerAPI.getAll(params), entitiesAPI.getAll()]);
      setEntries(gRes.data.results || gRes.data);
      setEntities(eRes.data.results || eRes.data);
    } catch (e) { setError('Failed to load general ledger'); }
    setLoading(false);
  }, [filterEntity]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    { key: 'posting_date', label: 'Date' },
    { key: 'reference_number', label: 'Reference', render: v => <code style={{ fontSize: 12 }}>{v}</code> },
    { key: 'description', label: 'Description', render: v => <span style={{ fontSize: 13 }}>{v}</span> },
    { key: 'debit_amount', label: 'Debit', render: (v, row) => <span style={{ fontFamily: 'monospace', color: '#10b981' }}>${parseFloat(row.debit_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
    { key: 'credit_amount', label: 'Credit', render: (v, row) => <span style={{ fontFamily: 'monospace', color: '#ef4444' }}>${parseFloat(row.credit_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
    { key: 'posting_status', label: 'Status', render: v => <span style={{ fontSize: 12, fontWeight: 700, color: v === 'posted' ? '#10b981' : v === 'reversed' ? '#ef4444' : '#f59e0b', textTransform: 'capitalize' }}>{v}</span> },
  ];

  return (
    <div className="gl-page">
      <PageHeader title="General Ledger" subtitle="Complete record of all financial transactions" actions={<Button variant="secondary" onClick={load}>Refresh</Button>} />
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 16px', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>{error}</div>}
      <Card>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
          <label style={{ fontSize: 12, fontWeight: 600 }}>Filter by Entity:</label>
          <select value={filterEntity} onChange={e => setFilterEntity(e.target.value)} style={{ padding: '6px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            <option value="">All Entities</option>
            {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-silver-dark)' }}>Loading...</div>
        : entries.length === 0 ? <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-silver-dark)' }}><p>No ledger entries found.</p><p style={{ fontSize: 13 }}>Post journal entries to generate ledger records.</p></div>
        : <Table columns={columns} data={entries} />}
      </Card>
    </div>
  );
}
