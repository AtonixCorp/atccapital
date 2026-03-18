import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../components/ui';
import { complianceDeadlinesAPI, entitiesAPI, organizationsAPI, taxProfilesAPI } from '../../services/api';

const BASE_PATH = '/app/compliance/tax-center';
const EMPTY_FORM = { organization: '', entity: '', title: '', deadline_type: 'tax_filing', deadline_date: '', status: 'upcoming', description: '' };

const parseList = (response) => response.data.results || response.data;
const formatError = (error, fallback) => {
  const data = error.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  return Object.entries(data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(' | ');
};
const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '—';

export default function TaxCenter() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [deadlines, setDeadlines] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [entities, setEntities] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [selectedDeadline, setSelectedDeadline] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [deadlineResponse, profileResponse, entityResponse, organizationResponse] = await Promise.all([
        complianceDeadlinesAPI.getAll(),
        taxProfilesAPI.getAll(),
        entitiesAPI.getAll(),
        organizationsAPI.getAll(),
      ]);
      const organizationList = parseList(organizationResponse);
      setDeadlines(parseList(deadlineResponse));
      setProfiles(parseList(profileResponse));
      setEntities(parseList(entityResponse));
      setOrganizations(organizationList);
      setForm((current) => ({ ...current, organization: current.organization || String(organizationList[0]?.id || '') }));
      setError('');
    } catch (requestError) {
      setError(formatError(requestError, 'Failed to load tax center data.'));
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setSelectedDeadline(null);
    setViewOnly(false);
    setForm({ ...EMPTY_FORM, organization: String(organizations[0]?.id || '') });
    if (location.pathname !== BASE_PATH) navigate(BASE_PATH, { replace: true });
  }, [location.pathname, navigate, organizations]);

  useEffect(() => {
    if (location.pathname === `${BASE_PATH}/create`) {
      setSelectedDeadline(null);
      setViewOnly(false);
      setForm({ ...EMPTY_FORM, organization: String(organizations[0]?.id || '') });
      setShowModal(true);
    }
  }, [location.pathname, organizations]);

  useEffect(() => {
    if (!id || !deadlines.length) return;
    const match = deadlines.find((deadline) => String(deadline.id) === String(id));
    if (!match) return;
    setSelectedDeadline(match);
    setViewOnly(location.pathname.includes('/view/'));
    setForm({ organization: String(match.organization || organizations[0]?.id || ''), entity: String(match.entity || ''), title: match.title || '', deadline_type: match.deadline_type || 'tax_filing', deadline_date: match.deadline_date || '', status: match.status || 'upcoming', description: match.description || '' });
    setShowModal(true);
  }, [deadlines, id, location.pathname, organizations]);

  const setField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSave = async () => {
    if (!form.organization || !form.entity || !form.title.trim() || !form.deadline_date) {
      setError('Organization, entity, title, and deadline date are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let response;
      if (selectedDeadline) response = await complianceDeadlinesAPI.update(selectedDeadline.id, form);
      else response = await complianceDeadlinesAPI.create(form);
      await load();
      navigate(`${BASE_PATH}/view/${response.data.id}`, { replace: true });
    } catch (requestError) {
      setError(formatError(requestError, 'Failed to save compliance deadline.'));
    }
    setSaving(false);
  };

  const handleDelete = async (deadlineId) => {
    if (!window.confirm('Delete this tax deadline?')) return;
    try {
      await complianceDeadlinesAPI.delete(deadlineId);
      await load();
      if (String(selectedDeadline?.id) === String(deadlineId)) {
        closeModal();
      }
    } catch (requestError) {
      setError(formatError(requestError, 'Failed to delete deadline.'));
    }
  };

  const upcomingCount = useMemo(() => deadlines.filter((deadline) => deadline.status === 'upcoming').length, [deadlines]);
  const overdueCount = useMemo(() => deadlines.filter((deadline) => deadline.status === 'overdue').length, [deadlines]);
  const filedCount = useMemo(() => deadlines.filter((deadline) => deadline.status === 'completed').length, [deadlines]);
  const deadlineColumns = [
    { key: 'title', label: 'Obligation', render: (value) => <span style={{ fontWeight: 600 }}>{value}</span> },
    { key: 'entity_name', label: 'Entity', render: (value) => value || '—' },
    { key: 'deadline_type', label: 'Type' },
    { key: 'deadline_date', label: 'Due Date', render: (value) => formatDate(value) },
    { key: 'status', label: 'Status', render: (value) => <span className="status-badge" style={{ background: value === 'completed' ? 'var(--color-success)' : value === 'overdue' ? 'var(--color-error)' : 'var(--color-warning)' }}>{value}</span> },
  ];
  const profileColumns = [
    { key: 'entity_name', label: 'Entity' },
    { key: 'country', label: 'Country' },
    { key: 'status', label: 'Status' },
    { key: 'compliance_score', label: 'Compliance Score', render: (value) => value ?? '—' },
    { key: 'last_rule_update', label: 'Last Rule Update', render: (value) => formatDate(value) },
  ];

  return (
    <div className="module-page">
      <PageHeader title="Tax Center" subtitle="Track filing deadlines and tax profile readiness across entities" actions={<Button variant="primary" size="small" onClick={() => navigate(`${BASE_PATH}/create`)}>New Deadline</Button>} />

      {error ? <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div> : null}

      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Card className="stat-card"><div className="stat-label">Filed / Completed</div><div className="stat-value">{filedCount}</div></Card>
        <Card className="stat-card"><div className="stat-label">Upcoming</div><div className="stat-value" style={{ color: 'var(--color-warning)' }}>{upcomingCount}</div></Card>
        <Card className="stat-card"><div className="stat-label">Overdue</div><div className="stat-value" style={{ color: overdueCount ? '#dc2626' : 'var(--color-success)' }}>{overdueCount}</div></Card>
        <Card className="stat-card"><div className="stat-label">Tax Profiles</div><div className="stat-value">{profiles.length}</div></Card>
      </div>

      <Card title="Compliance Deadlines" style={{ marginBottom: 24 }}>
        {loading ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-silver-dark)' }}>Loading tax deadlines...</div> : <Table columns={deadlineColumns} data={deadlines} actions={(row) => <div style={{ display: 'flex', gap: 6 }}><button type="button" onClick={() => navigate(`${BASE_PATH}/view/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', background: 'transparent', cursor: 'pointer' }}>View</button><button type="button" onClick={() => navigate(`${BASE_PATH}/edit/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', background: 'transparent', cursor: 'pointer' }}>Edit</button><button type="button" onClick={() => handleDelete(row.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid #fca5a5', background: 'transparent', color: '#dc2626', cursor: 'pointer' }}>Delete</button></div>} />}
      </Card>

      <Card title="Entity Tax Profiles">
        <Table columns={profileColumns} data={profiles} />
      </Card>

      <Modal isOpen={showModal} onClose={closeModal} title={viewOnly ? 'Tax Deadline Details' : selectedDeadline ? 'Edit Tax Deadline' : 'New Tax Deadline'} footer={viewOnly ? <Button variant="secondary" onClick={closeModal}>Close</Button> : <><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Deadline'}</Button></>}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
          </div>
          <Input label="Deadline Title *" value={form.title} onChange={setField('title')} disabled={viewOnly} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Deadline Type</label>
              <select disabled={viewOnly} value={form.deadline_type} onChange={setField('deadline_type')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
                {['tax_filing', 'vat_filing', 'payroll', 'audit', 'renewal', 'other'].map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <Input label="Due Date *" type="date" value={form.deadline_date} onChange={setField('deadline_date')} disabled={viewOnly} />
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Status</label>
              <select disabled={viewOnly} value={form.status} onChange={setField('status')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
                {['upcoming', 'due_soon', 'overdue', 'completed'].map((status) => <option key={status} value={status}>{status}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Description</label>
            <textarea disabled={viewOnly} rows={4} value={form.description} onChange={setField('description')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)', resize: 'vertical' }} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
