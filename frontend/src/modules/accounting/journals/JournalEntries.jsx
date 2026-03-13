import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, PageHeader, Table, Modal, Input } from '../../../components/ui';
import { journalEntriesAPI, entitiesAPI } from '../../../services/api';

const STATUS_COLOR = { draft: '#6b7280', pending: '#f59e0b', posted: '#10b981', reversed: '#ef4444' };
const BLANK = { reference_number: '', description: '', posting_date: '', entry_type: 'manual', memo: '', entity: '' };

export default function JournalEntries() {
  const [entries, setEntries] = useState([]);
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
      const [eRes, entRes] = await Promise.all([journalEntriesAPI.getAll(), entitiesAPI.getAll()]);
      setEntries(eRes.data.results || eRes.data);
      setEntities(entRes.data.results || entRes.data);
    } catch (e) { setError('Failed to load journal entries'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!form.reference_number.trim()) { setError('Reference number is required.'); return; }
    if (!form.posting_date) { setError('Posting date is required.'); return; }
    if (!form.entity) { setError('Entity is required.'); return; }
    setSaving(true); setError('');
    try {
      if (editItem) await journalEntriesAPI.update(editItem.id, form);
      else await journalEntriesAPI.create(form);
      setShowModal(false);
      load();
    } catch (e) {
      const d = e.response?.data;
      setError(d ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ') : 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this journal entry?')) return;
    try { await journalEntriesAPI.delete(id); load(); } catch (e) { alert(e.response?.data?.detail || e.message); }
  };

  const openNew = () => { setEditItem(null); setForm(BLANK); setError(''); setShowModal(true); };
  const openEdit = (item) => { setEditItem(item); setForm({ reference_number: item.reference_number || '', description: item.description || '', posting_date: item.posting_date || '', entry_type: item.entry_type || 'manual', memo: item.memo || '', entity: item.entity || '' }); setError(''); setShowModal(true); };
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const columns = [
    { key: 'reference_number', label: 'Reference', render: v => <code style={{ fontSize: 12, background: 'var(--color-bg-subtle)', padding: '2px 6px', borderRadius: 4 }}>{v}</code> },
    { key: 'description', label: 'Description', render: v => <span style={{ fontSize: 13 }}>{v}</span> },
    { key: 'posting_date', label: 'Date' },
    { key: 'entry_type', label: 'Type', render: v => <span style={{ fontSize: 12, textTransform: 'capitalize' }}>{v}</span> },
    { key: 'status', label: 'Status', render: v => <span style={{ fontSize: 12, fontWeight: 700, color: STATUS_COLOR[v] || '#6b7280', textTransform: 'capitalize' }}>{v || 'draft'}</span> },
  ];

  return (
    <div className="journals-page">
      <PageHeader title="Journal Entries" subtitle="Record and manage double-entry journal entries" actions={<Button variant="primary" onClick={openNew}>+ New Journal Entry</Button>} />
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 16px', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>{error}</div>}
      <Card>
        {loading ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-silver-dark)' }}>Loading...</div>
        : entries.length === 0 ? <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-silver-dark)' }}><p style={{ fontSize: 15, fontWeight: 500 }}>No journal entries yet.</p><p style={{ fontSize: 13 }}>Click "New Journal Entry" to create your first entry.</p></div>
        : <Table columns={columns} data={entries} actions={row => (
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(row)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', cursor: 'pointer', background: 'transparent' }}>Edit</button>
              <button onClick={() => handleDelete(row.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid #fca5a5', cursor: 'pointer', background: 'transparent', color: '#dc2626' }}>Delete</button>
            </div>
          )} />}
      </Card>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit Journal Entry' : 'New Journal Entry'}
        footer={<><Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button><Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Entry'}</Button></>}>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: 6, marginBottom: 12, color: '#dc2626', fontSize: 12 }}>{error}</div>}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Entity *</label>
          <select value={form.entity} onChange={set('entity')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            <option value="">— Select Entity —</option>
            {entities.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <Input label="Reference Number *" value={form.reference_number} onChange={set('reference_number')} placeholder="e.g. JE-2024-001" />
        <Input label="Description" value={form.description} onChange={set('description')} placeholder="Brief description" />
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Posting Date *</label>
          <input type="date" value={form.posting_date} onChange={set('posting_date')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Entry Type</label>
          <select value={form.entry_type} onChange={set('entry_type')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            {['manual', 'adjusting', 'closing', 'reversing', 'recurring'].map(t => <option key={t} value={t} style={{ textTransform: 'capitalize' }}>{t}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Memo</label>
          <textarea value={form.memo} onChange={set('memo')} rows={2} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }} placeholder="Internal note..." />
        </div>
      </Modal>
    </div>
  );
}
