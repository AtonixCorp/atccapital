import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, PageHeader, Table, Modal, Input } from '../../../components/ui';
import { bankReconciliationsAPI, bankAccountsAPI, entitiesAPI } from '../../../services/api';

const BASE_PATH = '/app/accounting/reconciliation';
const STATUS_COLOR = { draft: '#6b7280', in_progress: '#f59e0b', completed: '#10b981', reviewed: '#3b82f6' };
const BLANK = { bank_account: '', reconciliation_date: '', bank_statement_balance: '', book_balance: '0.00', notes: '', entity: '' };

export default function Reconciliation() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [recs, setRecs] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, bRes, eRes] = await Promise.all([bankReconciliationsAPI.getAll(), bankAccountsAPI.getAll(), entitiesAPI.getAll()]);
      setRecs(rRes.data.results || rRes.data);
      setBankAccounts(bRes.data.results || bRes.data);
      setEntities(eRes.data.results || eRes.data);
      setError('');
    } catch (e) {
      console.error('Failed to load reconciliations', e);
      setError('Failed to load reconciliations');
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
    if (!id || !recs.length) return;
    const match = recs.find((record) => String(record.id) === String(id));
    if (!match) return;

    setEditItem(match);
    setViewOnly(location.pathname.includes('/view/'));
    setForm({ bank_account: match.bank_account || '', reconciliation_date: match.reconciliation_date || '', bank_statement_balance: match.bank_statement_balance || '', book_balance: match.book_balance || '0.00', notes: match.notes || '', entity: match.entity || '' });
    setError('');
    setShowModal(true);
  }, [id, location.pathname, recs]);

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

  const handleSave = async () => {
    if (!form.bank_account) { setError('Bank account is required.'); return; }
    if (!form.reconciliation_date) { setError('Reconciliation date is required.'); return; }
    if (!form.entity) { setError('Entity is required.'); return; }
    setSaving(true); setError('');
    try {
      let response;
      if (editItem) response = await bankReconciliationsAPI.update(editItem.id, form);
      else response = await bankReconciliationsAPI.create(form);
      await load();
      navigate(`${BASE_PATH}/view/${response.data.id}`, { replace: true });
    } catch (e) {
      console.error('Failed to save reconciliation', e);
      const d = e.response?.data;
      setError(d ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ') : 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reconciliation?')) return;
    try {
      await bankReconciliationsAPI.delete(id);
      await load();
      if (String(editItem?.id) === String(id)) {
        closeModal();
      }
    } catch (e) {
      console.error('Failed to delete reconciliation', e);
      setError(e.response?.data?.detail || e.message || 'Failed to delete reconciliation');
    }
  };

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const columns = [
    { key: 'reconciliation_date', label: 'Reconciliation Date' },
    { key: 'bank_statement_balance', label: 'Stmt Balance', render: v => <span style={{ fontFamily: 'monospace' }}>${parseFloat(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
    { key: 'book_balance', label: 'Book Balance', render: v => <span style={{ fontFamily: 'monospace' }}>${parseFloat(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
    { key: 'variance', label: 'Variance', render: v => <span style={{ fontFamily: 'monospace' }}>${parseFloat(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span> },
    { key: 'status', label: 'Status', render: v => <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLOR[v] || '#6b7280', textTransform: 'capitalize' }}>{(v || '').replace(/_/g, ' ')}</span> },
  ];

  return (
    <div className="recon-page">
      <PageHeader title="Bank Reconciliation" subtitle="Reconcile bank statements with book records" actions={<Button variant="primary" onClick={() => navigate(`${BASE_PATH}/create`)}>+ New Reconciliation</Button>} />
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 16px', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>{error}</div>}
      <Card>
        {loading ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-silver-dark)' }}>Loading...</div>
        : recs.length === 0 ? <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-silver-dark)' }}><p>No reconciliations found.</p></div>
        : <Table columns={columns} data={recs} actions={row => (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => navigate(`${BASE_PATH}/view/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', cursor: 'pointer', background: 'transparent' }}>View</button>
              <button onClick={() => navigate(`${BASE_PATH}/edit/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', cursor: 'pointer', background: 'transparent' }}>Edit</button>
              <button onClick={() => handleDelete(row.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid #fca5a5', cursor: 'pointer', background: 'transparent', color: '#dc2626' }}>Delete</button>
            </div>
          )} />}
      </Card>
      <Modal isOpen={showModal} onClose={closeModal} title={viewOnly ? 'Reconciliation Details' : editItem ? 'Edit Reconciliation' : 'New Reconciliation'}
        footer={viewOnly ? <Button variant="secondary" onClick={closeModal}>Close</Button> : <><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button></>}>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: 6, marginBottom: 12, color: '#dc2626', fontSize: 12 }}>{error}</div>}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Entity *</label>
          <select disabled={viewOnly} value={form.entity} onChange={set('entity')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            <option value="">— Select Entity —</option>
            {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Bank Account *</label>
          <select disabled={viewOnly} value={form.bank_account} onChange={set('bank_account')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            <option value="">— Select Bank Account —</option>
            {bankAccounts.map(b => <option key={b.id} value={b.id}>{b.account_name} — {b.bank_name}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Reconciliation Date *</label>
          <input disabled={viewOnly} type="date" value={form.reconciliation_date} onChange={set('reconciliation_date')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Statement Balance *" type="number" step="0.01" value={form.bank_statement_balance} onChange={set('bank_statement_balance')} placeholder="0.00" disabled={viewOnly} />
          <Input label="Book Balance" type="number" step="0.01" value={form.book_balance} onChange={set('book_balance')} placeholder="0.00" disabled={viewOnly} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Notes</label>
          <textarea disabled={viewOnly} value={form.notes} onChange={set('notes')} rows={2} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }} />
        </div>
      </Modal>
    </div>
  );
}
