import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Button, Card, PageHeader, Table, Modal, Input } from '../../components/ui';
import { taskRequestsAPI } from '../../services/api';
import { useEnterprise } from '../../context/EnterpriseContext';

const BASE_PATH = '/app/overview/tasks';
const PRIORITY_COLOR = { urgent: '#7f1d1d', high: '#ef4444', normal: '#f59e0b', low: '#6b7280' };
const STATUS_COLOR = { queued: '#1d4ed8', processing: '#c2410c', completed: '#15803d', failed: '#ef4444' };
const BLANK = { title: '', task_type: 'custom', priority: 'normal', due_date: '', description: '', organization: '', entity: '' };

export default function Tasks() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const { organizations, entities, currentOrganization } = useEnterprise();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await taskRequestsAPI.getAll();
      setTasks(res.data.results || res.data);
      setError('');
    } catch (e) {
      console.error('Failed to load tasks', e);
      setError('Failed to load tasks');
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (currentOrganization) setForm(p => ({ ...p, organization: currentOrganization.id }));
  }, [currentOrganization]);

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
      setForm({ ...BLANK, organization: currentOrganization?.id || '' });
      setError('');
      setShowModal(true);
    }
  }, [currentOrganization?.id, location.pathname]);

  useEffect(() => {
    if (!id || !tasks.length) return;
    const match = tasks.find((task) => String(task.id) === String(id));
    if (!match) return;

    setEditItem(match);
    setViewOnly(location.pathname.includes('/view/'));
    setForm({
      title: match.payload?.title || '',
      task_type: match.task_type || 'custom',
      priority: match.priority || 'normal',
      due_date: match.payload?.due_date || '',
      description: match.payload?.description || '',
      organization: match.organization || '',
      entity: match.entity || '',
    });
    setError('');
    setShowModal(true);
  }, [id, location.pathname, tasks]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setViewOnly(false);
    setEditItem(null);
    setForm({ ...BLANK, organization: currentOrganization?.id || '' });
    setError('');
    if (location.pathname !== BASE_PATH) {
      navigate(BASE_PATH, { replace: true });
    }
  }, [currentOrganization?.id, location.pathname, navigate]);

  const filtered = filterStatus === 'all' ? tasks : tasks.filter(t => t.status === filterStatus);

  const handleSave = async () => {
    if (!form.title.trim()) { setError('Title is required.'); return; }
    if (!form.organization) { setError('Organization is required.'); return; }
    setSaving(true); setError('');
    try {
      const payload = {
        organization: form.organization,
        entity: form.entity || null,
        task_type: form.task_type,
        priority: form.priority,
        payload: {
          title: form.title,
          description: form.description,
          due_date: form.due_date,
        },
      };
      if (!payload.entity) delete payload.entity;
      let response;
      if (editItem) response = await taskRequestsAPI.update(editItem.id, payload);
      else response = await taskRequestsAPI.create(payload);
      await load();
      navigate(`${BASE_PATH}/view/${response.data.id}`, { replace: true });
    } catch (e) {
      console.error('Failed to save task', e);
      const d = e.response?.data;
      setError(d ? Object.entries(d).map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`).join(' | ') : 'Failed to save');
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskRequestsAPI.delete(id);
      await load();
      if (String(editItem?.id) === String(id)) {
        closeModal();
      }
    } catch (e) {
      console.error('Failed to delete task', e);
      setError(e.response?.data?.detail || e.message || 'Failed to delete task');
    }
  };

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const columns = [
    { key: 'title', label: 'Task', render: (v, row) => <span style={{ fontWeight: 500 }}>{row.payload?.title || row.task_type}</span> },
    { key: 'task_type', label: 'Type', render: v => <span style={{ fontSize: 12 }}>{v}</span> },
    { key: 'priority', label: 'Priority', render: v => <span style={{ fontWeight: 700, fontSize: 12, color: PRIORITY_COLOR[v] || '#6b7280' }}>{v}</span> },
    { key: 'status', label: 'Status', render: v => <span style={{ fontWeight: 700, fontSize: 12, color: STATUS_COLOR[v] || '#6b7280' }}>{v}</span> },
    { key: 'due_date', label: 'Due Date', render: (v, row) => <span style={{ fontSize: 12, color: 'var(--color-silver-dark)' }}>{row.payload?.due_date || '—'}</span> },
  ];

  const stats = [
    { label: 'Queued', value: tasks.filter(t => t.status === 'queued').length, accent: '#1d4ed8' },
    { label: 'Processing', value: tasks.filter(t => t.status === 'processing').length, accent: '#c2410c' },
    { label: 'Completed', value: tasks.filter(t => t.status === 'completed').length, accent: '#15803d' },
  ];

  return (
    <div className="tasks-page">
      <PageHeader title="Tasks" subtitle="Manage workflow tasks and requests" actions={<Button variant="primary" onClick={() => navigate(`${BASE_PATH}/create`)}>+ New Task</Button>} />
      {error && <div className="error-banner" style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 16px', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>{error}</div>}
      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map(s => (
          <div key={s.label} className="stat-card" style={{ background: 'var(--color-white)', border: '1px solid var(--border-color-default)', borderTop: `3px solid ${s.accent}`, borderRadius: 8, padding: '16px 20px' }}>
            <div style={{ fontSize: 12, color: 'var(--color-silver-dark)', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: s.accent }}>{s.value}</div>
          </div>
        ))}
      </div>
      <Card>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['all', 'queued', 'processing', 'completed', 'failed'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, border: '1px solid var(--border-color-default)', cursor: 'pointer', background: filterStatus === s ? 'var(--color-midnight)' : 'var(--color-white)', color: filterStatus === s ? '#fff' : 'var(--color-midnight)', borderRadius: 6, textTransform: 'capitalize' }}>{s}</button>
          ))}
        </div>
        {loading ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-silver-dark)' }}>Loading tasks...</div> : filtered.length === 0 ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-silver-dark)' }}>No tasks found.</div> : (
          <Table columns={columns} data={filtered} actions={row => (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => navigate(`${BASE_PATH}/view/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', cursor: 'pointer', background: 'transparent' }}>View</button>
              <button onClick={() => navigate(`${BASE_PATH}/edit/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', cursor: 'pointer', background: 'transparent' }}>Edit</button>
              <button onClick={() => handleDelete(row.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid #fca5a5', cursor: 'pointer', background: 'transparent', color: '#dc2626' }}>Delete</button>
            </div>
          )} />
        )}
      </Card>
      <Modal isOpen={showModal} onClose={closeModal} title={viewOnly ? 'Task Details' : editItem ? 'Edit Task' : 'New Task'}
        footer={viewOnly ? <Button variant="secondary" onClick={closeModal}>Close</Button> : <><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Task'}</Button></>}>
        {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '8px 12px', borderRadius: 6, marginBottom: 12, color: '#dc2626', fontSize: 12 }}>{error}</div>}
        <Input label="Title *" value={form.title} onChange={set('title')} placeholder="Task title" disabled={viewOnly} />
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Task Type</label>
          <select disabled={viewOnly} value={form.task_type} onChange={set('task_type')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            {['custom', 'generate_statement', 'run_tax_calculation', 'import_bank_feed', 'process_payroll'].map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Priority</label>
          <select disabled={viewOnly} value={form.priority} onChange={set('priority')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            <option value="urgent">Urgent</option><option value="high">High</option><option value="normal">Normal</option><option value="low">Low</option>
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Organization *</label>
          <select disabled={viewOnly} value={form.organization} onChange={set('organization')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            <option value="">— Select Organization —</option>
            {(organizations || []).map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Entity (optional)</label>
          <select disabled={viewOnly} value={form.entity} onChange={set('entity')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }}>
            <option value="">— All Entities —</option>
            {(entities || []).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Due Date</label>
          <input disabled={viewOnly} type="date" value={form.due_date} onChange={set('due_date')} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Description</label>
          <textarea disabled={viewOnly} value={form.description} onChange={set('description')} rows={3} style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--border-color-default)', borderRadius: 6, fontSize: 13 }} placeholder="Optional description..." />
        </div>
      </Modal>
    </div>
  );
}
