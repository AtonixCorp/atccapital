import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../../components/ui';
import { taskRequestsAPI, organizationsAPI, entitiesAPI } from '../../../services/api';

const BASE_PATH = '/app/subledgers/payroll';
const EMPTY_FORM = {
  organization: '',
  entity: '',
  priority: 'normal',
  payroll_period: '',
  payroll_date: '',
  employee_count: '',
  notes: '',
};

const parseList = (response) => response.data.results || response.data;
const formatError = (error, fallback) => {
  const data = error.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  return Object.entries(data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(' | ');
};

export default function Payroll() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [tasks, setTasks] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [taskRes, orgRes, entityRes] = await Promise.all([
        taskRequestsAPI.getAll({ task_type: 'process_payroll' }),
        organizationsAPI.getAll(),
        entitiesAPI.getAll(),
      ]);
      const allTasks = parseList(taskRes).filter((task) => task.task_type === 'process_payroll');
      setTasks(allTasks);
      setOrganizations(parseList(orgRes));
      setEntities(parseList(entityRes));
      setError('');
    } catch (requestError) {
      setError(formatError(requestError, 'Failed to load payroll tasks.'));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setViewOnly(false);
    setEditItem(null);
    setForm(EMPTY_FORM);
    if (location.pathname !== BASE_PATH) {
      navigate(BASE_PATH, { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (location.pathname === `${BASE_PATH}/create`) {
      setViewOnly(false);
      setEditItem(null);
      setForm(EMPTY_FORM);
      setShowModal(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!id || !tasks.length) return;
    const match = tasks.find((task) => String(task.id) === String(id));
    if (!match) return;
    setEditItem(match);
    setViewOnly(location.pathname.includes('/view/'));
    setForm({
      organization: match.organization || '',
      entity: match.entity || '',
      priority: match.priority || 'normal',
      payroll_period: match.payload?.payroll_period || '',
      payroll_date: match.payload?.payroll_date || '',
      employee_count: String(match.payload?.employee_count || ''),
      notes: match.payload?.notes || '',
    });
    setShowModal(true);
  }, [id, location.pathname, tasks]);

  const setField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSave = async () => {
    if (!form.organization || !form.entity || !form.payroll_period || !form.payroll_date) {
      setError('Organization, entity, payroll period, and payroll date are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        organization: form.organization,
        entity: form.entity,
        task_type: 'process_payroll',
        priority: form.priority,
        payload: {
          payroll_period: form.payroll_period,
          payroll_date: form.payroll_date,
          employee_count: form.employee_count,
          notes: form.notes,
        },
      };
      let response;
      if (editItem) {
        response = await taskRequestsAPI.update(editItem.id, payload);
      } else {
        response = await taskRequestsAPI.create(payload);
      }
      await load();
      navigate(`${BASE_PATH}/view/${response.data.id}`, { replace: true });
    } catch (requestError) {
      setError(formatError(requestError, 'Failed to save payroll task.'));
    }
    setSaving(false);
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this payroll task?')) return;
    try {
      await taskRequestsAPI.delete(taskId);
      await load();
      if (String(editItem?.id) === String(taskId)) {
        closeModal();
      }
    } catch (requestError) {
      setError(formatError(requestError, 'Failed to delete payroll task.'));
    }
  };

  const queuedCount = tasks.filter((task) => task.status === 'queued').length;
  const processingCount = tasks.filter((task) => task.status === 'processing').length;
  const completedCount = tasks.filter((task) => task.status === 'completed').length;

  const columns = [
    { key: 'entity_name', label: 'Entity', render: (value) => value || '—' },
    { key: 'priority', label: 'Priority' },
    { key: 'status', label: 'Status' },
    { key: 'payroll_period', label: 'Period', render: (_value, row) => row.payload?.payroll_period || '—' },
    { key: 'payroll_date', label: 'Payroll Date', render: (_value, row) => row.payload?.payroll_date || '—' },
    { key: 'employee_count', label: 'Employees', render: (_value, row) => row.payload?.employee_count || '—' },
  ];

  return (
    <div className="module-page">
      <PageHeader title="Payroll Subledger" subtitle="Queue and track payroll processing runs" actions={<Button variant="primary" size="small" onClick={() => navigate(`${BASE_PATH}/create`)}>Schedule Payroll Run</Button>} />

      {error && <div className="error-banner" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Card className="stat-card"><div className="stat-label">Queued</div><div className="stat-value">{queuedCount}</div></Card>
        <Card className="stat-card"><div className="stat-label">Processing</div><div className="stat-value">{processingCount}</div></Card>
        <Card className="stat-card"><div className="stat-label">Completed</div><div className="stat-value" style={{ color: '#059669' }}>{completedCount}</div></Card>
      </div>

      <Card title="Payroll Tasks">
        {loading ? <div style={{ padding: 32, textAlign: 'center' }}>Loading payroll tasks...</div> : <Table columns={columns} data={tasks} actions={(row) => <div style={{ display: 'flex', gap: 6 }}><button type="button" onClick={() => navigate(`${BASE_PATH}/view/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', background: 'transparent', cursor: 'pointer' }}>View</button><button type="button" onClick={() => navigate(`${BASE_PATH}/edit/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', background: 'transparent', cursor: 'pointer' }}>Edit</button><button type="button" onClick={() => handleDelete(row.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid #fca5a5', background: 'transparent', color: '#dc2626', cursor: 'pointer' }}>Delete</button></div>} />}
      </Card>

      <Modal isOpen={showModal} onClose={closeModal} title={viewOnly ? 'Payroll Task Details' : editItem ? 'Edit Payroll Task' : 'Schedule Payroll Run'} footer={viewOnly ? <Button variant="secondary" onClick={closeModal}>Close</Button> : <><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Payroll Run'}</Button></>}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Organization *</label>
            <select disabled={viewOnly} value={form.organization} onChange={setField('organization')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
              <option value="">Select organization</option>
              {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Entity *</label>
            <select disabled={viewOnly} value={form.entity} onChange={setField('entity')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
              <option value="">Select entity</option>
              {entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Payroll Period *" value={form.payroll_period} onChange={setField('payroll_period')} disabled={viewOnly} />
            <Input label="Payroll Date *" type="date" value={form.payroll_date} onChange={setField('payroll_date')} disabled={viewOnly} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Employee Count" type="number" value={form.employee_count} onChange={setField('employee_count')} disabled={viewOnly} />
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Priority</label>
              <select disabled={viewOnly} value={form.priority} onChange={setField('priority')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
                {['low', 'normal', 'high', 'urgent'].map((priority) => <option key={priority} value={priority}>{priority}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Notes</label>
            <textarea disabled={viewOnly} rows={3} value={form.notes} onChange={setField('notes')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
