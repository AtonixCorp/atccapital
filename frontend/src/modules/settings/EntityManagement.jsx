import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Modal, Input } from '../../components/ui';

const mockEntities = [
  {
    id: 'ENT-001',
    name: 'AtonixCorp',
    taxId: '169800656',
    country: 'South Africa',
    type: 'corporation',
    status: 'active',
    currency: 'ZAR',
    filingDate: '1/11/2027',
    parent: null,
  },
];

const TYPE_OPTIONS = ['corporation', 'LLC', 'Limited Company', 'Private Limited', 'Partnership', 'Branch Office'];
const CURRENCY_OPTIONS = ['ZAR', 'USD', 'EUR', 'GBP', 'SGD', 'AED', 'CAD', 'AUD', 'JPY'];
const COUNTRY_OPTIONS = [
  'South Africa', 'United States', 'United Kingdom', 'Germany', 'France',
  'Singapore', 'UAE', 'Canada', 'Australia', 'Japan',
];

const BLANK_FORM = { name: '', taxId: '', country: 'South Africa', type: 'corporation', currency: 'ZAR', filingDate: '', status: 'active' };

const lbl = {
  display: 'block', fontSize: 12, fontWeight: 600,
  color: '#374151', marginBottom: 6, letterSpacing: '0.2px',
};
const inp = { width: '100%', height: 40, boxSizing: 'border-box' };
const sel = {
  width: '100%', height: 40, padding: '0 12px', fontSize: 13,
  border: '1px solid var(--border-color-default)', borderRadius: 6,
  background: 'var(--color-white)', color: 'var(--color-midnight)',
  boxSizing: 'border-box', cursor: 'pointer',
};

export default function EntityManagement() {
  const navigate = useNavigate();
  const [entities, setEntities] = useState(mockEntities);
  const [showModal, setShowModal] = useState(false);
  const [editEntity, setEditEntity] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);

  const openNew = () => { setEditEntity(null); setForm(BLANK_FORM); setShowModal(true); };
  const openEdit = (row) => { setEditEntity(row); setForm({ name: row.name, taxId: row.taxId, country: row.country, type: row.type, currency: row.currency, filingDate: row.filingDate, status: row.status }); setShowModal(true); };
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editEntity) {
      setEntities(prev => prev.map(e => e.id === editEntity.id ? { ...e, ...form } : e));
    } else {
      const newId = `ENT-${String(entities.length + 1).padStart(3, '0')}`;
      setEntities(prev => [...prev, { id: newId, ...form }]);
    }
    setShowModal(false);
  };

  const toggleStatus = (id) => {
    setEntities(prev => prev.map(e => e.id === id ? { ...e, status: e.status === 'active' ? 'inactive' : 'active' } : e));
  };

  const deleteEntity = (id) => {
    setEntities(prev => prev.filter(e => e.id !== id));
  };

  // roots = entities with no parent
  const roots = entities.filter(e => !e.parent);

  return (
    <div style={{ minHeight: '100vh', background: '#f4f6fa' }}>
      {/* Standalone topbar */}
      <div style={{
        height: 60, background: '#003B73', display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)',
            borderRadius: 6, color: '#fff', cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: 13, fontWeight: 500,
          }}
          onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
          onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
        >
          <span style={{ fontSize: 16, lineHeight: 1 }}>&#8592;</span> Back
        </button>
        <div style={{ width: 1, height: 28, background: 'rgba(255,255,255,0.2)' }} />
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, letterSpacing: 0.3 }}>ATC Capital</span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>/</span>
        <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>Entity Management</span>
      </div>

      <div style={{ padding: '32px 36px', maxWidth: 1200, margin: '0 auto' }}>

        {/* Page header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#003B73', margin: 0 }}>Entities &amp; Countries</h1>
            <p style={{ fontSize: 14, color: '#6B7280', margin: '6px 0 0' }}>Manage your legal entities across jurisdictions</p>
          </div>
          <button
            onClick={openNew}
            style={{
              background: '#003B73', color: '#fff', border: 'none', borderRadius: 7,
              padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
            onMouseOver={e => e.currentTarget.style.background = '#004f99'}
            onMouseOut={e => e.currentTarget.style.background = '#003B73'}
          >
            + Add Entity
          </button>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Total Entities', value: entities.length },
            { label: 'Active', value: entities.filter(e => e.status === 'active').length },
            { label: 'Countries', value: new Set(entities.map(e => e.country)).size },
            { label: 'Currencies', value: new Set(entities.map(e => e.currency)).size },
          ].map(k => (
            <div key={k.label} style={{
              background: '#fff', borderRadius: 10, padding: '18px 22px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.07)', display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <span style={{ fontSize: 12, color: '#6B7280', fontWeight: 500 }}>{k.label}</span>
              <span style={{ fontSize: 28, fontWeight: 700, color: '#003B73' }}>{k.value}</span>
            </div>
          ))}
        </div>

        {/* Entity Hierarchy */}
        <div style={{
          background: '#fff', borderRadius: 10, padding: '22px 24px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)', marginBottom: 28,
        }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: '0 0 18px' }}>Entity Hierarchy</h3>
          {roots.length === 0 ? (
            <p style={{ color: '#6B7280', fontSize: 13 }}>No entities yet. Add your first entity above.</p>
          ) : roots.map(root => (
            <div key={root.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Icon */}
              <div style={{
                width: 42, height: 42, borderRadius: 10, background: '#EFF6FF',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, flexShrink: 0,
              }}>
                🏢
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{root.name}</div>
                <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                  {root.country}&nbsp;&bull;&nbsp;{root.type}
                </div>
              </div>
              <div style={{ marginLeft: 12 }}>
                <span style={{
                  background: root.status === 'active' ? '#D1FAE5' : '#F3F4F6',
                  color: root.status === 'active' ? '#065F46' : '#374151',
                  borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600,
                }}>
                  {root.status}
                </span>
              </div>
              {/* Children indented */}
              {entities.filter(e => e.parent === root.id).length > 0 && (
                <div style={{ marginLeft: 54, marginTop: 10, borderLeft: '2px solid #E5E7EB', paddingLeft: 16 }}>
                  {entities.filter(e => e.parent === root.id).map(child => (
                    <div key={child.id} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F3F4F6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🏬</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#111827' }}>{child.name}</div>
                        <div style={{ fontSize: 11, color: '#9CA3AF' }}>{child.country}&nbsp;&bull;&nbsp;{child.type}</div>
                      </div>
                      <span style={{
                        background: child.status === 'active' ? '#D1FAE5' : '#F3F4F6',
                        color: child.status === 'active' ? '#065F46' : '#374151',
                        borderRadius: 20, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                      }}>{child.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* All Entities Table */}
        <div style={{
          background: '#fff', borderRadius: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.07)', overflow: 'hidden',
        }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid #F3F4F6' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>All Entities</h3>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Entity Name', 'Country', 'Type', 'Status', 'Currency', 'Filing Date', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12, whiteSpace: 'nowrap', borderBottom: '1px solid #E5E7EB' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entities.length === 0 ? (
                  <tr><td colSpan={7} style={{ padding: '28px 16px', textAlign: 'center', color: '#9CA3AF' }}>No entities found.</td></tr>
                ) : entities.map((row, i) => (
                  <tr key={row.id} style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 1 ? '#FAFAFA' : '#fff' }}
                    onMouseOver={e => e.currentTarget.style.background = '#EFF6FF'}
                    onMouseOut={e => e.currentTarget.style.background = i % 2 === 1 ? '#FAFAFA' : '#fff'}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, color: '#111827' }}>{row.name}</div>
                      <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{row.taxId}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>{row.country}</td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>{row.type}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        background: row.status === 'active' ? '#D1FAE5' : '#F3F4F6',
                        color: row.status === 'active' ? '#065F46' : '#374151',
                        borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 600,
                      }}>{row.status}</span>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>{row.currency}</td>
                    <td style={{ padding: '12px 16px', color: '#374151' }}>{row.filingDate}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => openEdit(row)} style={{ background: '#F3F4F6', border: 'none', borderRadius: 5, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>Edit</button>
                        <button onClick={() => toggleStatus(row.id)} style={{ background: '#F3F4F6', border: 'none', borderRadius: 5, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>
                          {row.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => deleteEntity(row.id)} style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 5, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <Modal
          isOpen
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
            <div>
              <label style={lbl}>Entity Name <span style={{ color: '#dc2626' }}>*</span></label>
              <Input value={form.name} onChange={set('name')} placeholder="Legal entity name" style={{ ...inp, marginBottom: 0 }} />
            </div>
            <div>
              <label style={lbl}>Tax ID / Registration No.</label>
              <Input value={form.taxId} onChange={set('taxId')} placeholder="e.g. 169800656" style={{ ...inp, marginBottom: 0 }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={lbl}>Country</label>
                <select style={sel} value={form.country} onChange={set('country')}>
                  {COUNTRY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Entity Type</label>
                <select style={sel} value={form.type} onChange={set('type')}>
                  {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={lbl}>Currency</label>
                <select style={sel} value={form.currency} onChange={set('currency')}>
                  {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={lbl}>Next Filing Date</label>
                <Input value={form.filingDate} onChange={set('filingDate')} placeholder="e.g. 1/11/2027" style={{ ...inp, marginBottom: 0 }} />
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
