import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, PageHeader, Table, Modal, Input } from '../../components/ui';
import { billsAPI, vendorsAPI, entitiesAPI } from '../../services/api';

const STATUS_COLOR = { draft: '#6b7280', posted: '#3b82f6', partially_paid: '#f59e0b', paid: '#10b981', overdue: '#ef4444', cancelled: '#9ca3af' };
const BLANK = { bill_number: '', vendor: '', bill_date: '', due_date: '', subtotal: '', tax_amount: '0', total_amount: '', currency: 'USD', status: 'draft', description: '', notes: '', entity: '' };

export default function Bills() {
  const [list, setList] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, vRes, eRes] = await Promise.all([billsAPI.getAll(), vendorsAPI.getAll(), entitiesAPI.getAll()]);
      setList(bRes.data.results || bRes.data);
      setVendors(vRes.data.results || vRes.data);
      setEntities(eRes.data.results || eRes.data);
    } catch (e) { setError('Failed to load bills'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.bill_number.trim()) { setError('Bill number is required.'); return; }
    if (!form.entity) { setError('Entity is required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form };
      if (!payload.vendor) { setError('Vendor is required.'); setSaving(false); return; }
      if (!payload.total_amount && payload.subtotal) {
        payload.total_amount = String((parseFloat(payload.subtotal || 0) + parseFloat(payload.tax_amount || 0)).toFixed(2));
      }
      if (editItem) await billsAPI.update(editItem.id, payload);
      else await billsAPI.create(payload);
      setShowModal(false); load();
    } catch (e) {
      const d = e.response?.data;
      setError(d ? Object.entries(d).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | ') : 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bill?')) return;
    try { await billsAPI.delete(id); load(); } catch (e) { alert(e.response?.data?.detail || e.message); }
  };

  const openNew = () => { setEditItem(null); setForm(BLANK); setError(''); setShowModal(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ bill_number: item.bill_number || '', vendor: item.vendor || '', bill_date: item.bill_date || '', due_date: item.due_date || '', subtotal: item.subtotal || '', tax_amount: item.tax_amount || '0', total_amount: item.total_amount || '', currency: item.currency || 'USD', status: item.status || 'draft', description: item.description || '', notes: item.notes || '', entity: item.entity || '' }); setError(''); setShowModal(true); };
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const columns = [
    { key: 'bill_number', label: 'Bill #', render: v => <code style={{ fontSize: 12 }}>{v}</code> },
    { key: 'vendor_name', label: 'Vendor', render: (v, row) => row.vendor_name || '—' },
    { key: 'bill_date', label: 'Bill Date' },
    { key: 'due_date', label: 'Due Date' },
    { key: 'total_amount', label: 'Total', render: v => <span style={{ fontFamily: 'monospace' }}>${parseFloat(v||0).toLocaleString('en-US',{minimumFractionDigits:2})}</span> },
    { key: 'status', label: 'Status', render: v => <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLOR[v]||'#6b7280', padding: '2px 8px', background: (STATUS_COLOR[v]||'#6b7280')+'22', borderRadius: 4, textTransform: 'capitalize' }}>{v}</span> },
  ];

  return (
    <div className="bills-page">
      <PageHeader title="Bills" subtitle="Track and pay supplier bills" actions={<Button variant="primary" onClick={openNew}>+ New Bill</Button>} />
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 16px', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>{error}</div>}
      <Card>
        {loading ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-silver-dark)' }}>Loading...</div>
        : list.length === 0 ? <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-silver-dark)' }}><p style={{ fontSize: 15, fontWeight: 500 }}>No bills yet.</p></div>
        : <Table columns={columns} data={list} actions={row => (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(row)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', cursor: 'pointer', background: 'transparent' }}>Edit</button>
              <button onClick={() => handleDelete(row.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid #fca5a5', cursor: 'pointer', background: 'transparent', color: '#dc2626' }}>Delete</button>
            </div>
          )} />}
      </Card>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Bill' : 'New Bill'}
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Bill'}</Button></>}>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: 6, marginBottom: 12, color: '#dc2626', fontSize: 12 }}>{error}</div>}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Entity *</label>
          <select value={form.entity} onChange={set('entity')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            <option value="">— Select Entity —</option>
            {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Vendor</label>
          <select value={form.vendor} onChange={set('vendor')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            <option value="">— Select Vendor —</option>
            {vendors.map(v => <option key={v.id} value={v.id}>{v.vendor_name}</option>)}
          </select>
        </div>
        <Input label="Bill Number *" value={form.bill_number} onChange={set('bill_number')} placeholder="BILL-0001" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Bill Date</label>
            <input type="date" value={form.bill_date} onChange={set('bill_date')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Due Date</label>
            <input type="date" value={form.due_date} onChange={set('due_date')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Input label="Subtotal" type="number" step="0.01" value={form.subtotal} onChange={set('subtotal')} placeholder="0.00" />
          <Input label="Tax" type="number" step="0.01" value={form.tax_amount} onChange={set('tax_amount')} placeholder="0.00" />
          <Input label="Total Amount" type="number" step="0.01" value={form.total_amount} onChange={set('total_amount')} placeholder="0.00" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Currency" value={form.currency} onChange={set('currency')} placeholder="USD" />
          <Input label="Description" value={form.description} onChange={set('description')} placeholder="Bill description" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Status</label>
          <select value={form.status} onChange={set('status')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            {['draft','posted','partially_paid','paid','overdue','cancelled'].map(s => <option key={s} value={s} style={{ textTransform: 'capitalize' }}>{s}</option>)}
          </select>
        </div>
      </Modal>
    </div>
  );
}
