import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../components/ui';

const mockEntities = [
  { id: 'ENT-001', name: 'ATC Capital HQ', type: 'Corporation', country: 'US', currency: 'USD', taxId: '12-3456789', status: 'Active' },
  { id: 'ENT-002', name: 'ATC Capital UK Ltd', type: 'Limited Company', country: 'GB', currency: 'GBP', taxId: 'GB123456789', status: 'Active' },
  { id: 'ENT-003', name: 'ATC Capital SG Pte', type: 'Private Limited', country: 'SG', currency: 'SGD', taxId: '202300001N', status: 'Active' },
];

const TYPE_OPTIONS = ['Corporation', 'LLC', 'Limited Company', 'Private Limited', 'Partnership', 'Branch Office'];
const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP', 'SGD', 'AED', 'CAD', 'AUD', 'JPY'];

const COUNTRY_FLAGS = { US: '🇺🇸', GB: '🇬🇧', SG: '🇸🇬', AE: '🇦🇪', CA: '🇨🇦', DE: '🇩🇪', FR: '🇫🇷', AU: '🇦🇺' };

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: '#374151',
  marginBottom: 6,
  letterSpacing: '0.2px',
};

const inputStyle = {
  width: '100%',
  height: 40,
  boxSizing: 'border-box',
};

const selectStyle = {
  width: '100%',
  height: 40,
  padding: '0 12px',
  fontSize: 13,
  border: '1px solid var(--border-color-default)',
  borderRadius: 6,
  background: 'var(--color-white)',
  color: 'var(--color-midnight)',
  boxSizing: 'border-box',
  cursor: 'pointer',
};

export default function EntityManagement() {
  const [entities, setEntities] = useState(mockEntities);
  const [showModal, setShowModal] = useState(false);
  const [editEntity, setEditEntity] = useState(null);
  const [form, setForm] = useState({ name: '', type: 'Corporation', country: 'US', currency: 'USD', taxId: '' });

  const openNew = () => {
    setEditEntity(null);
    setForm({ name: '', type: 'Corporation', country: 'US', currency: 'USD', taxId: '' });
    setShowModal(true);
  };

  const openEdit = (row) => {
    setEditEntity(row);
    setForm({ name: row.name, type: row.type, country: row.country, currency: row.currency, taxId: row.taxId });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editEntity) {
      setEntities(prev => prev.map(e => e.id === editEntity.id ? { ...e, ...form } : e));
    } else {
      const newId = `ENT-${String(entities.length + 1).padStart(3, '0')}`;
      setEntities(prev => [...prev, { id: newId, ...form, status: 'Active' }]);
    }
    setShowModal(false);
  };

  const toggleStatus = (id) => {
    setEntities(prev => prev.map(e => e.id === id ? { ...e, status: e.status === 'Active' ? 'Inactive' : 'Active' } : e));
  };

  const columns = [
    { key: 'id', label: 'Entity ID', width: '10%' },
    { key: 'name', label: 'Entity Name', width: '22%' },
    { key: 'type', label: 'Type', width: '16%' },
    {
      key: 'country', label: 'Country', width: '10%',
      render: (v) => <span>{COUNTRY_FLAGS[v] || '🌐'} {v}</span>
    },
    { key: 'currency', label: 'Currency', width: '10%' },
    { key: 'taxId', label: 'Tax ID', width: '14%' },
    {
      key: 'status', label: 'Status', width: '10%',
      render: (v) => (
        <span className="status-badge" style={{ background: v === 'Active' ? 'var(--color-success)' : 'var(--color-silver-dark)' }}>{v}</span>
      )
    },
  ];

  return (
    <div className="module-page">
      <PageHeader
        title="Entity Management"
        subtitle="Manage legal entities, subsidiaries and branch offices"
        actions={<Button variant="primary" onClick={openNew}>+ Add Entity</Button>}
      />

      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-label">Total Entities</div>
          <div className="stat-value">{entities.length}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Active</div>
          <div className="stat-value">{entities.filter(e => e.status === 'Active').length}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Jurisdictions</div>
          <div className="stat-value">{new Set(entities.map(e => e.country)).size}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Currencies</div>
          <div className="stat-value">{new Set(entities.map(e => e.currency)).size}</div>
        </Card>
      </div>

      <Card header="Legal Entities">
        <Table
          columns={columns}
          data={entities}
          onRowClick={openEdit}
          actions={(row) => (
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }}>Edit</Button>
              <Button variant="secondary" size="small" onClick={(e) => { e.stopPropagation(); toggleStatus(row.id); }}>
                {row.status === 'Active' ? 'Deactivate' : 'Activate'}
              </Button>
            </div>
          )}
        />
      </Card>

      {showModal && (
        <Modal
          title={editEntity ? 'Edit Entity' : 'Add New Entity'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleSave}>{editEntity ? 'Save Changes' : 'Create Entity'}</Button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Entity Name — full width */}
            <div>
              <label style={labelStyle}>Entity Name <span style={{ color: '#ef4444' }}>*</span></label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Legal entity name"
                style={inputStyle}
              />
            </div>
            {/* Type + Currency — side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Entity Type</label>
                <select style={selectStyle} value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Functional Currency</label>
                <select style={selectStyle} value={form.currency} onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                  {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {/* Country + Tax ID — side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16 }}>
              <div>
                <label style={labelStyle}>Country Code</label>
                <Input
                  value={form.country}
                  onChange={e => setForm(f => ({ ...f, country: e.target.value.toUpperCase().slice(0, 2) }))}
                  placeholder="US"
                  maxLength={2}
                  style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: 2 }}
                />
              </div>
              <div>
                <label style={labelStyle}>Tax ID / Registration No.</label>
                <Input
                  value={form.taxId}
                  onChange={e => setForm(f => ({ ...f, taxId: e.target.value }))}
                  placeholder="e.g. 12-3456789"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
