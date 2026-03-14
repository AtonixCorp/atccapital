import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, PageHeader, Table, Modal, Input } from '../../components/ui';
import { invoicesAPI, customersAPI, entitiesAPI } from '../../services/api';

const BASE_PATH = '/app/billing/invoices';
const STATUS_COLOR = { draft: '#6b7280', posted: '#3b82f6', partially_paid: '#f59e0b', paid: '#10b981', overdue: '#ef4444', cancelled: '#9ca3af' };
const BLANK = { invoice_number: '', customer: '', invoice_date: '', due_date: '', subtotal: '', tax_amount: '0', total_amount: '', currency: 'USD', status: 'draft', description: '', notes: '', entity: '' };

export default function Invoices() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [list, setList] = useState([]);
  const [customers, setCustomers] = useState([]);
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
      const [iRes, cRes, eRes] = await Promise.all([invoicesAPI.getAll(), customersAPI.getAll(), entitiesAPI.getAll()]);
      setList(iRes.data.results || iRes.data);
      setCustomers(cRes.data.results || cRes.data);
      setEntities(eRes.data.results || eRes.data);
      setError('');
    } catch (e) {
      console.error('Failed to load invoices', e);
      setError('Failed to load invoices');
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
    if (!id || !list.length) return;
    const match = list.find((item) => String(item.id) === String(id));
    if (!match) return;

    setEditItem(match);
    setViewOnly(location.pathname.includes('/view/'));
    setForm({ invoice_number: match.invoice_number || '', customer: match.customer || '', invoice_date: match.invoice_date || '', due_date: match.due_date || '', subtotal: match.subtotal || '', tax_amount: match.tax_amount || '0', total_amount: match.total_amount || '', currency: match.currency || 'USD', status: match.status || 'draft', description: match.description || '', notes: match.notes || '', entity: match.entity || '' });
    setError('');
    setShowModal(true);
  }, [id, list, location.pathname]);

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
    if (!form.invoice_number.trim()) { setError('Invoice number is required.'); return; }
    if (!form.entity) { setError('Entity is required.'); return; }
    if (!form.customer) { setError('Customer is required.'); return; }
    if (!form.invoice_date) { setError('Invoice date is required.'); return; }
    if (!form.due_date) { setError('Due date is required.'); return; }
    if (!form.subtotal) { setError('Subtotal is required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (!payload.total_amount && payload.subtotal) {
        payload.total_amount = String((parseFloat(payload.subtotal || 0) + parseFloat(payload.tax_amount || 0)).toFixed(2));
      }
      let response;
      if (editItem) response = await invoicesAPI.update(editItem.id, payload);
      else response = await invoicesAPI.create(payload);
      await load();
      navigate(`${BASE_PATH}/view/${response.data.id}`, { replace: true });
    } catch (e) {
      console.error('Failed to save invoice', e);
      const d = e.response?.data;
      setError(d ? Object.entries(d).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | ') : 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await invoicesAPI.delete(id);
      await load();
      if (String(editItem?.id) === String(id)) {
        closeModal();
      }
    } catch (e) {
      console.error('Failed to delete invoice', e);
      setError(e.response?.data?.detail || e.message || 'Failed to delete invoice');
    }
  };

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const columns = [
    { key: 'invoice_number', label: 'Invoice #', render: v => <code style={{ fontSize: 12 }}>{v}</code> },
    { key: 'customer_name', label: 'Customer', render: (v, row) => row.customer_name || '—' },
    { key: 'invoice_date', label: 'Issue Date' },
    { key: 'due_date', label: 'Due Date' },
    { key: 'total_amount', label: 'Total', render: v => <span style={{ fontFamily: 'monospace' }}>${parseFloat(v||0).toLocaleString('en-US',{minimumFractionDigits:2})}</span> },
    { key: 'status', label: 'Status', render: v => <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLOR[v]||'#6b7280', textTransform: 'capitalize', padding: '2px 8px', background: (STATUS_COLOR[v]||'#6b7280')+'22', borderRadius: 4 }}>{v}</span> },
  ];

  return (
    <div className="invoices-page">
      <PageHeader title="Invoices" subtitle="Create and manage customer invoices" actions={<Button variant="primary" onClick={() => navigate(`${BASE_PATH}/create`)}>+ New Invoice</Button>} />
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 16px', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>{error}</div>}
      <Card>
        {loading ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-silver-dark)' }}>Loading...</div>
        : list.length === 0 ? <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-silver-dark)' }}><p style={{ fontSize: 15, fontWeight: 500 }}>No invoices yet.</p><p style={{ fontSize: 13 }}>Click "New Invoice" to create your first invoice.</p></div>
        : <Table columns={columns} data={list} actions={row => (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => navigate(`${BASE_PATH}/view/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', cursor: 'pointer', background: 'transparent' }}>View</button>
              <button onClick={() => navigate(`${BASE_PATH}/edit/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', cursor: 'pointer', background: 'transparent' }}>Edit</button>
              <button onClick={() => handleDelete(row.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid #fca5a5', cursor: 'pointer', background: 'transparent', color: '#dc2626' }}>Delete</button>
            </div>
          )} />}
      </Card>
      <Modal isOpen={showModal} onClose={closeModal} title={viewOnly ? 'Invoice Details' : editItem ? 'Edit Invoice' : 'New Invoice'}
        footer={viewOnly ? <Button variant="secondary" onClick={closeModal}>Close</Button> : <><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Invoice'}</Button></>}>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: 6, marginBottom: 12, color: '#dc2626', fontSize: 12 }}>{error}</div>}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Entity *</label>
          <select disabled={viewOnly} value={form.entity} onChange={set('entity')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            <option value="">— Select Entity —</option>
            {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Customer</label>
          <select disabled={viewOnly} value={form.customer} onChange={set('customer')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            <option value="">— Select Customer —</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.customer_name}</option>)}
          </select>
        </div>
        <Input label="Invoice Number *" value={form.invoice_number} onChange={set('invoice_number')} placeholder="INV-0001" disabled={viewOnly} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Invoice Date *</label>
            <input disabled={viewOnly} type="date" value={form.invoice_date} onChange={set('invoice_date')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Due Date</label>
            <input disabled={viewOnly} type="date" value={form.due_date} onChange={set('due_date')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Input label="Subtotal" type="number" step="0.01" value={form.subtotal} onChange={set('subtotal')} placeholder="0.00" disabled={viewOnly} />
          <Input label="Tax Amount" type="number" step="0.01" value={form.tax_amount} onChange={set('tax_amount')} placeholder="0.00" disabled={viewOnly} />
          <Input label="Total Amount" type="number" step="0.01" value={form.total_amount} onChange={set('total_amount')} placeholder="0.00" disabled={viewOnly} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Currency" value={form.currency} onChange={set('currency')} placeholder="USD" disabled={viewOnly} />
          <Input label="Description" value={form.description} onChange={set('description')} placeholder="Invoice description" disabled={viewOnly} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Status</label>
          <select disabled={viewOnly} value={form.status} onChange={set('status')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            {['draft','posted','partially_paid','paid','overdue','cancelled'].map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Notes</label>
          <textarea disabled={viewOnly} value={form.notes} onChange={set('notes')} rows={2} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }} />
        </div>
      </Modal>
    </div>
  );
}
