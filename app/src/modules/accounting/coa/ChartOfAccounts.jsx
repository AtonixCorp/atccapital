import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, PageHeader, Table, Modal, Input } from '../../../components/ui';
import { chartOfAccountsAPI, entitiesAPI } from '../../../services/api';

const BASE_PATH = '/app/accounting/chart-of-accounts';
const TYPES = ['asset', 'liability', 'equity', 'revenue', 'expense'];
const TYPE_COLOR = { asset: '#10b981', liability: '#ef4444', equity: '#3b82f6', revenue: '#06b6d4', expense: '#f59e0b' };
const BLANK = { account_code: '', account_name: '', account_type: 'asset', currency: 'USD', opening_balance: '0.00', description: '', status: 'active', entity: '' };

export default function ChartOfAccounts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [accounts, setAccounts] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [filterType, setFilterType] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [aRes, eRes] = await Promise.all([chartOfAccountsAPI.getAll(), entitiesAPI.getAll()]);
      setAccounts(aRes.data.results || aRes.data);
      setEntities(eRes.data.results || eRes.data);
      setError('');
    } catch (e) {
      console.error('Failed to load chart of accounts', e);
      setError('Failed to load accounts');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const isCreatePath = location.pathname === `${BASE_PATH}/create`;
    const isEditPath = location.pathname.includes('/edit/');
    const isViewPath = location.pathname.includes('/view/');

    if (!isCreatePath && !isEditPath && !isViewPath) {
      setShowModal(false);
      setViewOnly(false);
      setEditItem(null);
      return;
    }

    if (isCreatePath) {
      setEditItem(null);
      setViewOnly(false);
      setForm(BLANK);
      setError('');
      setShowModal(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!id || !accounts.length) return;
    const match = accounts.find((account) => String(account.id) === String(id));
    if (!match) return;

    setEditItem(match);
    setViewOnly(location.pathname.includes('/view/'));
    setForm({
      account_code: match.account_code || '',
      account_name: match.account_name || '',
      account_type: match.account_type || 'asset',
      currency: match.currency || 'USD',
      opening_balance: match.opening_balance || '0.00',
      description: match.description || '',
      status: match.status || 'active',
      entity: match.entity || '',
    });
    setError('');
    setShowModal(true);
  }, [accounts, id, location.pathname]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setViewOnly(false);
    setEditItem(null);
    setForm(BLANK);
    setError('');
    if (location.pathname !== BASE_PATH) {
      navigate(BASE_PATH, { replace: true });
    }
  }, [location.pathname, navigate]);

  const filtered = filterType ? accounts.filter(a => a.account_type === filterType) : accounts;

  const handleSave = async () => {
    if (!form.account_code.trim()) { setError('Account code is required.'); return; }
    if (!form.account_name.trim()) { setError('Account name is required.'); return; }
    if (!form.entity) { setError('Entity is required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, entity: parseInt(form.entity) };
      let response;
      if (editItem) response = await chartOfAccountsAPI.update(editItem.id, payload);
      else response = await chartOfAccountsAPI.create(payload);
      await load();
      navigate(`${BASE_PATH}/view/${response.data.id}`, { replace: true });
    } catch (e) {
      console.error('Failed to save account', e);
      const d = e.response?.data;
      setError(d ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ') : 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this account?')) return;
    try {
      await chartOfAccountsAPI.delete(id);
      await load();
      if (String(editItem?.id) === String(id)) {
        closeModal();
      }
    } catch (e) {
      console.error('Failed to delete account', e);
      setError(e.response?.data?.detail || e.message || 'Failed to delete account');
    }
  };

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const columns = [
    { key: 'account_code', label: 'Code', render: v => <code style={{ fontSize: 12, background: 'var(--color-bg-subtle)', padding: '2px 6px', borderRadius: 4 }}>{v}</code> },
    { key: 'account_name', label: 'Account Name', render: v => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'account_type', label: 'Type', render: v => <span style={{ fontSize: 12, fontWeight: 700, color: TYPE_COLOR[v] || '#6b7280', textTransform: 'capitalize' }}>{v}</span> },
    { key: 'currency', label: 'Currency' },
    { key: 'current_balance', label: 'Balance', render: (v, row) => <span style={{ fontFamily: 'monospace' }}>${parseFloat(v || row.opening_balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
    { key: 'status', label: 'Status', render: v => <span style={{ fontSize: 12, fontWeight: 700, color: v === 'active' ? '#10b981' : '#6b7280', textTransform: 'capitalize' }}>{v}</span> },
  ];

  return (
    <div className="coa-page">
      <PageHeader title="Chart of Accounts" subtitle="Account hierarchy — assets, liabilities, equity, revenue, expenses" actions={<Button variant="primary" onClick={() => navigate(`${BASE_PATH}/create`)}>+ New Account</Button>} />
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 16px', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12, marginBottom: 24 }}>
        {TYPES.map(t => (
          <div key={t} onClick={() => setFilterType(filterType === t ? '' : t)} style={{ background: 'var(--color-white)', border: `1px solid ${filterType === t ? TYPE_COLOR[t] : 'var(--border-color-default)'}`, borderTop: `3px solid ${TYPE_COLOR[t]}`, borderRadius: 8, padding: '12px 16px', cursor: 'pointer' }}>
            <div style={{ fontSize: 12, color: TYPE_COLOR[t], fontWeight: 700, textTransform: 'capitalize' }}>{t}</div>
            <div style={{ fontSize: 22, fontWeight: 700 }}>{accounts.filter(a => a.account_type === t).length}</div>
          </div>
        ))}
      </div>
      <Card>
        {loading ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-silver-dark)' }}>Loading...</div>
        : filtered.length === 0 ? <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-silver-dark)' }}><p style={{ fontSize: 15, fontWeight: 500 }}>No accounts {filterType ? `of type "${filterType}"` : ''} yet.</p><p style={{ fontSize: 13 }}>Click "New Account" to create your first account.</p></div>
        : <Table columns={columns} data={filtered} actions={row => (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => navigate(`${BASE_PATH}/view/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', cursor: 'pointer', background: 'transparent' }}>View</button>
              <button onClick={() => navigate(`${BASE_PATH}/edit/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', cursor: 'pointer', background: 'transparent' }}>Edit</button>
              <button onClick={() => handleDelete(row.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid #fca5a5', cursor: 'pointer', background: 'transparent', color: '#dc2626' }}>Delete</button>
            </div>
          )} />}
      </Card>
      <Modal isOpen={showModal} onClose={closeModal} title={viewOnly ? 'Account Details' : editItem ? 'Edit Account' : 'New Account'}
        footer={viewOnly ? <Button variant="secondary" onClick={closeModal}>Close</Button> : <><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Account'}</Button></>}>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: 6, marginBottom: 12, color: '#dc2626', fontSize: 12 }}>{error}</div>}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Entity *</label>
          <select disabled={viewOnly} value={form.entity} onChange={set('entity')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            <option value="">— Select Entity —</option>
            {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <Input label="Account Code *" value={form.account_code} onChange={set('account_code')} placeholder="e.g. 1000" disabled={viewOnly} />
        <Input label="Account Name *" value={form.account_name} onChange={set('account_name')} placeholder="e.g. Cash" disabled={viewOnly} />
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Account Type *</label>
          <select disabled={viewOnly} value={form.account_type} onChange={set('account_type')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            {TYPES.map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Currency" value={form.currency} onChange={set('currency')} placeholder="USD" disabled={viewOnly} />
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Opening Balance</label>
            <input disabled={viewOnly} type="number" step="0.01" value={form.opening_balance} onChange={set('opening_balance')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }} />
          </div>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Status</label>
          <select disabled={viewOnly} value={form.status} onChange={set('status')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            <option value="active">Active</option><option value="inactive">Inactive</option><option value="archived">Archived</option>
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Description</label>
          <textarea disabled={viewOnly} value={form.description} onChange={set('description')} rows={2} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }} />
        </div>
      </Modal>
    </div>
  );
}
