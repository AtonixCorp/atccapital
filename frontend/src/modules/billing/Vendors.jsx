import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, PageHeader, Table, Modal, Input } from '../../components/ui';
import { vendorsAPI, entitiesAPI } from '../../services/api';

const BLANK = { vendor_code: '', vendor_name: '', contact_person: '', email: '', phone: '', address: '', city: '', country: '', postal_code: '', tax_id: '', payment_terms: '30', currency: 'USD', status: 'active', entity: '' };

export default function Vendors() {
  const [list, setList] = useState([]);
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
      const [vRes, eRes] = await Promise.all([vendorsAPI.getAll(), entitiesAPI.getAll()]);
      setList(vRes.data.results || vRes.data);
      setEntities(eRes.data.results || eRes.data);
    } catch (e) { setError('Failed to load vendors'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.vendor_code.trim()) { setError('Vendor code is required.'); return; }
    if (!form.vendor_name.trim()) { setError('Vendor name is required.'); return; }
    if (!form.entity) { setError('Entity is required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, payment_terms: parseInt(form.payment_terms, 10) || 30 };
      if (editItem) await vendorsAPI.update(editItem.id, payload);
      else await vendorsAPI.create(payload);
      setShowModal(false); load();
    } catch (e) {
      const d = e.response?.data;
      setError(d ? Object.entries(d).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | ') : 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vendor?')) return;
    try { await vendorsAPI.delete(id); load(); } catch (e) { alert(e.response?.data?.detail || e.message); }
  };

  const openNew = () => { setEditItem(null); setForm(BLANK); setError(''); setShowModal(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ vendor_code: item.vendor_code || '', vendor_name: item.vendor_name || '', contact_person: item.contact_person || '', email: item.email || '', phone: item.phone || '', address: item.address || '', city: item.city || '', country: item.country || '', postal_code: item.postal_code || '', tax_id: item.tax_id || '', payment_terms: String(item.payment_terms || 30), currency: item.currency || 'USD', status: item.status || 'active', entity: item.entity || '' }); setError(''); setShowModal(true); };
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const columns = [
    { key: 'vendor_code', label: 'Code', render: v => <code style={{ fontSize: 12 }}>{v}</code> },
    { key: 'vendor_name', label: 'Vendor', render: v => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'contact_person', label: 'Contact' },
    { key: 'email', label: 'Email', render: v => v ? <a href={`mailto:${v}`} style={{ color: 'var(--color-cyan)' }}>{v}</a> : '—' },
    { key: 'payment_terms', label: 'Terms' },
    { key: 'currency', label: 'Currency' },
  ];

  return (
    <div className="vendors-page">
      <PageHeader title="Vendors" subtitle="Manage supplier and vendor accounts" actions={<Button variant="primary" onClick={openNew}>+ New Vendor</Button>} />
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 16px', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>{error}</div>}
      <Card>
        {loading ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-silver-dark)' }}>Loading...</div>
        : list.length === 0 ? <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-silver-dark)' }}><p style={{ fontSize: 15, fontWeight: 500 }}>No vendors yet.</p></div>
        : <Table columns={columns} data={list} actions={row => (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(row)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', cursor: 'pointer', background: 'transparent' }}>Edit</button>
              <button onClick={() => handleDelete(row.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid #fca5a5', cursor: 'pointer', background: 'transparent', color: '#dc2626' }}>Delete</button>
            </div>
          )} />}
      </Card>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Vendor' : 'New Vendor'}
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Vendor'}</Button></>}>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: 6, marginBottom: 12, color: '#dc2626', fontSize: 12 }}>{error}</div>}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Entity *</label>
          <select value={form.entity} onChange={set('entity')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            <option value="">— Select Entity —</option>
            {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
          <Input label="Vendor Code *" value={form.vendor_code} onChange={set('vendor_code')} />
          <Input label="Vendor Name *" value={form.vendor_name} onChange={set('vendor_name')} />
        </div>
        <Input label="Contact Person" value={form.contact_person} onChange={set('contact_person')} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Email" value={form.email} onChange={set('email')} />
          <Input label="Phone" value={form.phone} onChange={set('phone')} />
        </div>
        <Input label="Address" value={form.address} onChange={set('address')} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Input label="City" value={form.city} onChange={set('city')} />
          <Input label="Country" value={form.country} onChange={set('country')} />
          <Input label="Postal Code" value={form.postal_code} onChange={set('postal_code')} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Input label="Tax ID" value={form.tax_id} onChange={set('tax_id')} />
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Payment Terms</label>
            <select value={form.payment_terms} onChange={set('payment_terms')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
              {[15, 30, 45, 60].map(days => <option key={days} value={String(days)}>Net {days}</option>)}
            </select>
          </div>
          <Input label="Currency" value={form.currency} onChange={set('currency')} placeholder="USD" />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Status</label>
          <select value={form.status} onChange={set('status')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            {['active', 'inactive', 'on_hold'].map(status => <option key={status} value={status}>{status}</option>)}
          </select>
        </div>
      </Modal>
    </div>
  );
}
