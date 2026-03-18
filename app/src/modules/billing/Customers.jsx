import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, PageHeader, Table, Modal, Input } from '../../components/ui';
import { customersAPI, entitiesAPI } from '../../services/api';

const BASE_PATH = '/app/billing/customers';
const BLANK = { customer_code: '', customer_name: '', contact_person: '', email: '', phone: '', address: '', city: '', country: '', postal_code: '', tax_id: '', payment_terms: '30', currency: 'USD', credit_limit: '', status: 'active', entity: '' };

export default function Customers() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [list, setList] = useState([]);
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
      const [cRes, eRes] = await Promise.all([customersAPI.getAll(), entitiesAPI.getAll()]);
      setList(cRes.data.results || cRes.data);
      setEntities(eRes.data.results || eRes.data);
      setError('');
    } catch (e) {
      console.error('Failed to load customers', e);
      setError('Failed to load customers');
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
    setForm({ customer_code: match.customer_code || '', customer_name: match.customer_name || '', contact_person: match.contact_person || '', email: match.email || '', phone: match.phone || '', address: match.address || '', city: match.city || '', country: match.country || '', postal_code: match.postal_code || '', tax_id: match.tax_id || '', payment_terms: String(match.payment_terms || 30), currency: match.currency || 'USD', credit_limit: match.credit_limit || '', status: match.status || 'active', entity: match.entity || '' });
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
    if (!form.customer_code.trim()) { setError('Customer code is required.'); return; }
    if (!form.customer_name.trim()) { setError('Customer name is required.'); return; }
    if (!form.entity) { setError('Entity is required.'); return; }
    if (!form.email.trim()) { setError('Email is required.'); return; }
    if (!form.address.trim()) { setError('Address is required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = { ...form, payment_terms: parseInt(form.payment_terms, 10) || 30 };
      if (!payload.credit_limit) delete payload.credit_limit;
      let response;
      if (editItem) response = await customersAPI.update(editItem.id, payload);
      else response = await customersAPI.create(payload);
      await load();
      navigate(`${BASE_PATH}/view/${response.data.id}`, { replace: true });
    } catch (e) {
      console.error('Failed to save customer', e);
      const d = e.response?.data;
      setError(d ? Object.entries(d).map(([k,v]) => `${k}: ${Array.isArray(v)?v.join(', '):v}`).join(' | ') : 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this customer?')) return;
    try {
      await customersAPI.delete(id);
      await load();
      if (String(editItem?.id) === String(id)) {
        closeModal();
      }
    } catch (e) {
      console.error('Failed to delete customer', e);
      setError(e.response?.data?.detail || e.message || 'Failed to delete customer');
    }
  };

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const columns = [
    { key: 'customer_code', label: 'Code', render: v => <code style={{ fontSize: 12 }}>{v}</code> },
    { key: 'customer_name', label: 'Company', render: v => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'contact_person', label: 'Contact' },
    { key: 'email', label: 'Email', render: v => v ? <a href={`mailto:${v}`} style={{ color: 'var(--color-cyan)' }}>{v}</a> : '—' },
    { key: 'phone', label: 'Phone' },
    { key: 'payment_terms', label: 'Payment Terms' },
    { key: 'currency', label: 'Currency' },
  ];

  return (
    <div className="customers-page">
      <PageHeader title="Customers" subtitle="Manage your customer accounts" actions={<Button variant="primary" onClick={() => navigate(`${BASE_PATH}/create`)}>+ New Customer</Button>} />
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 16px', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>{error}</div>}
      <Card>
        {loading ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-silver-dark)' }}>Loading...</div>
        : list.length === 0 ? <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-silver-dark)' }}><p style={{ fontSize: 15, fontWeight: 500 }}>No customers yet.</p><p style={{ fontSize: 13 }}>Click "New Customer" to add your first customer.</p></div>
        : <Table columns={columns} data={list} actions={row => (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => navigate(`${BASE_PATH}/view/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', cursor: 'pointer', background: 'transparent' }}>View</button>
              <button onClick={() => navigate(`${BASE_PATH}/edit/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', cursor: 'pointer', background: 'transparent' }}>Edit</button>
              <button onClick={() => handleDelete(row.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid #fca5a5', cursor: 'pointer', background: 'transparent', color: '#dc2626' }}>Delete</button>
            </div>
          )} />}
      </Card>
      <Modal isOpen={showModal} onClose={closeModal} title={viewOnly ? 'Customer Details' : editItem ? 'Edit Customer' : 'New Customer'}
        footer={viewOnly ? <Button variant="secondary" onClick={closeModal}>Close</Button> : <><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Customer'}</Button></>}>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: 6, marginBottom: 12, color: '#dc2626', fontSize: 12 }}>{error}</div>}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Entity *</label>
          <select disabled={viewOnly} value={form.entity} onChange={set('entity')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            <option value="">— Select Entity —</option>
            {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
          <Input label="Customer Code *" value={form.customer_code} onChange={set('customer_code')} placeholder="CUST-001" disabled={viewOnly} />
          <Input label="Customer Name *" value={form.customer_name} onChange={set('customer_name')} placeholder="Company name" disabled={viewOnly} />
        </div>
        <Input label="Contact Person" value={form.contact_person} onChange={set('contact_person')} placeholder="Contact person" disabled={viewOnly} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Email *" value={form.email} onChange={set('email')} placeholder="billing@company.com" disabled={viewOnly} />
          <Input label="Phone" value={form.phone} onChange={set('phone')} placeholder="+1 555 000 0000" disabled={viewOnly} />
        </div>
        <Input label="Address *" value={form.address} onChange={set('address')} placeholder="Street address" disabled={viewOnly} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Input label="City" value={form.city} onChange={set('city')} disabled={viewOnly} />
          <Input label="Country" value={form.country} onChange={set('country')} disabled={viewOnly} />
          <Input label="Postal Code" value={form.postal_code} onChange={set('postal_code')} disabled={viewOnly} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <Input label="Tax ID" value={form.tax_id} onChange={set('tax_id')} disabled={viewOnly} />
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Payment Terms</label>
            <select disabled={viewOnly} value={form.payment_terms} onChange={set('payment_terms')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
              {[15, 30, 45, 60].map(days => <option key={days} value={String(days)}>Net {days}</option>)}
            </select>
          </div>
          <Input label="Currency" value={form.currency} onChange={set('currency')} placeholder="USD" disabled={viewOnly} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Input label="Credit Limit" type="number" step="0.01" value={form.credit_limit} onChange={set('credit_limit')} placeholder="0.00" disabled={viewOnly} />
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Status</label>
            <select disabled={viewOnly} value={form.status} onChange={set('status')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
              {['active', 'inactive', 'dormant'].map(status => <option key={status} value={status}>{status}</option>)}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
