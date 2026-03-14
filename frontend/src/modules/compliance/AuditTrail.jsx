import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Button, Table, Modal, Input } from '../../components/ui';
import { auditLogsAPI, organizationsAPI } from '../../services/api';

const BASE_PATH = '/app/compliance/audit-trail';

const parseList = (response) => response.data.results || response.data;
const formatError = (error, fallback) => {
  const data = error.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  return Object.entries(data)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
    .join(' | ');
};
const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};
const exportCSV = (rows) => {
  const header = 'Timestamp,Organization,User,Action,Model,Object ID,IP Address\n';
  const body = rows
    .map((row) => [
      row.created_at || '',
      row.organization || '',
      row.user_name || 'System',
      row.action || '',
      row.model_name || '',
      row.object_id || '',
      row.ip_address || '',
    ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
    .join('\n');
  const blob = new Blob([header + body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'audit-trail.csv';
  link.click();
  URL.revokeObjectURL(url);
};

export default function AuditTrail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [logs, setLogs] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('all');
  const [organizationFilter, setOrganizationFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [logResponse, organizationResponse] = await Promise.all([
        auditLogsAPI.getAll(),
        organizationsAPI.getAll(),
      ]);
      setLogs(parseList(logResponse));
      setOrganizations(parseList(organizationResponse));
      setError('');
    } catch (requestError) {
      setError(formatError(requestError, 'Failed to load audit logs.'));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (location.pathname === `${BASE_PATH}/create`) {
      setError('Audit logs are system generated and cannot be created or edited.');
      navigate(BASE_PATH, { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (!id || !logs.length) return;
    const match = logs.find((entry) => String(entry.id) === String(id));
    if (!match) return;
    setSelectedLog(match);
    setShowModal(true);
  }, [id, logs]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setSelectedLog(null);
    if (location.pathname !== BASE_PATH) {
      navigate(BASE_PATH, { replace: true });
    }
  }, [location.pathname, navigate]);

  const modelOptions = useMemo(() => Array.from(new Set(logs.map((log) => log.model_name).filter(Boolean))).sort(), [logs]);
  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const haystack = [log.user_name, log.action, log.model_name, log.object_id, log.ip_address].filter(Boolean).join(' ').toLowerCase();
      const matchesSearch = !search || haystack.includes(search.toLowerCase());
      const matchesModel = modelFilter === 'all' || log.model_name === modelFilter;
      const matchesOrganization = organizationFilter === 'all' || String(log.organization) === organizationFilter;
      return matchesSearch && matchesModel && matchesOrganization;
    });
  }, [logs, modelFilter, organizationFilter, search]);

  const securityCount = filtered.filter((log) => String(log.model_name || '').toLowerCase().includes('role') || String(log.action || '').toLowerCase().includes('login')).length;
  const columns = [
    { key: 'created_at', label: 'Timestamp', render: (value) => formatDateTime(value) },
    { key: 'user_name', label: 'User', render: (value) => value || 'System' },
    { key: 'action', label: 'Action', render: (value) => <span style={{ fontWeight: 600 }}>{value || '—'}</span> },
    { key: 'model_name', label: 'Model' },
    { key: 'object_id', label: 'Object ID', render: (value) => value || '—' },
    { key: 'ip_address', label: 'IP Address', render: (value) => value || '—' },
  ];

  return (
    <div className="module-page">
      <PageHeader
        title="Audit Trail"
        subtitle="Review immutable user and system activity across your organizations"
        actions={<Button variant="secondary" size="small" onClick={() => exportCSV(filtered)}>Export Log</Button>}
      />

      {error ? <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div> : null}

      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Card className="stat-card"><div className="stat-label">Filtered Events</div><div className="stat-value">{filtered.length}</div></Card>
        <Card className="stat-card"><div className="stat-label">Organizations</div><div className="stat-value">{organizations.length}</div></Card>
        <Card className="stat-card"><div className="stat-label">Security-Sensitive Events</div><div className="stat-value" style={{ color: securityCount ? '#dc2626' : 'var(--color-success)' }}>{securityCount}</div></Card>
      </div>

      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 12 }}>
          <Input label="Search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="User, action, model, object, or IP" />
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Model</label>
            <select value={modelFilter} onChange={(event) => setModelFilter(event.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
              <option value="all">All models</option>
              {modelOptions.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Organization</label>
            <select value={organizationFilter} onChange={(event) => setOrganizationFilter(event.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
              <option value="all">All organizations</option>
              {organizations.map((organization) => <option key={organization.id} value={String(organization.id)}>{organization.name}</option>)}
            </select>
          </div>
        </div>
      </Card>

      <Card title="Event Log">
        {loading ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-silver-dark)' }}>Loading audit events...</div> : <Table columns={columns} data={filtered} actions={(row) => <button type="button" onClick={() => navigate(`${BASE_PATH}/view/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', background: 'transparent', cursor: 'pointer' }}>View</button>} />}
      </Card>

      <Modal isOpen={showModal} onClose={closeModal} title="Audit Event Details" footer={<Button variant="secondary" onClick={closeModal}>Close</Button>}>
        {selectedLog ? (
          <div style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Card><div style={{ fontSize: 12, color: 'var(--color-silver-dark)' }}>Timestamp</div><div style={{ fontWeight: 700 }}>{formatDateTime(selectedLog.created_at)}</div></Card>
              <Card><div style={{ fontSize: 12, color: 'var(--color-silver-dark)' }}>User</div><div style={{ fontWeight: 700 }}>{selectedLog.user_name || 'System'}</div></Card>
            </div>
            <Card>
              <div style={{ display: 'grid', gap: 8 }}>
                <div><strong>Action:</strong> {selectedLog.action || '—'}</div>
                <div><strong>Model:</strong> {selectedLog.model_name || '—'}</div>
                <div><strong>Object ID:</strong> {selectedLog.object_id || '—'}</div>
                <div><strong>IP Address:</strong> {selectedLog.ip_address || '—'}</div>
              </div>
            </Card>
            <Card title="Changes">
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, color: 'var(--color-midnight)' }}>{JSON.stringify(selectedLog.changes || {}, null, 2)}</pre>
            </Card>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
