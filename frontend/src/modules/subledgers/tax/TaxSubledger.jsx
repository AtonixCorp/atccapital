import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../../components/ui';
import { taxCalculationsAPI, entitiesAPI } from '../../../services/api';

const BASE_PATH = '/app/subledgers/tax';
const EMPTY_FORM = {
  entity: '',
  tax_year: String(new Date().getFullYear()),
  calculation_type: 'corporate',
  jurisdiction: '',
  taxable_income: '',
  tax_rate: '',
  deductions: '0',
  credits: '0',
};

const parseList = (response) => response.data.results || response.data;
const formatMoney = (value) => `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const formatError = (error, fallback) => {
  const data = error.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  return Object.entries(data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(' | ');
};

export default function TaxSubledger() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [records, setRecords] = useState([]);
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
      const [calcRes, entityRes] = await Promise.all([taxCalculationsAPI.getAll(), entitiesAPI.getAll()]);
      setRecords(parseList(calcRes));
      setEntities(parseList(entityRes));
      setError('');
    } catch (requestError) {
      setError(formatError(requestError, 'Failed to load tax calculations.'));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const closeModal = useCallback(() => {
    setShowModal(false);
    setEditItem(null);
    setViewOnly(false);
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
    if (!id || !records.length) return;
    const match = records.find((record) => String(record.id) === String(id));
    if (!match) return;
    setEditItem(match);
    setViewOnly(location.pathname.includes('/view/'));
    setForm({
      entity: match.entity || '',
      tax_year: String(match.tax_year || new Date().getFullYear()),
      calculation_type: match.calculation_type || 'corporate',
      jurisdiction: match.jurisdiction || '',
      taxable_income: match.taxable_income || '',
      tax_rate: String(Number(match.tax_rate || 0) * 100),
      deductions: String(match.deductions?.amount || 0),
      credits: String(match.credits?.amount || 0),
    });
    setShowModal(true);
  }, [id, location.pathname, records]);

  const setField = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSave = async () => {
    if (!form.entity || !form.tax_year || !form.jurisdiction || !form.taxable_income || !form.tax_rate) {
      setError('Entity, tax year, jurisdiction, taxable income, and tax rate are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await taxCalculationsAPI.calculate({
        entity: form.entity,
        tax_year: Number(form.tax_year),
        calculation_type: form.calculation_type,
        jurisdiction: form.jurisdiction,
        taxable_income: form.taxable_income,
        tax_rate: form.tax_rate,
        deductions: { amount: form.deductions || 0 },
        credits: { amount: form.credits || 0 },
      });
      await load();
      closeModal();
    } catch (requestError) {
      setError(formatError(requestError, 'Failed to calculate tax.'));
    }
    setSaving(false);
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('Delete this tax calculation?')) return;
    try {
      await taxCalculationsAPI.delete(recordId);
      await load();
    } catch (requestError) {
      setError(formatError(requestError, 'Failed to delete tax calculation.'));
    }
  };

  const totalCalculated = records.reduce((sum, record) => sum + Number(record.calculated_tax || 0), 0);

  const columns = [
    { key: 'tax_year', label: 'Year' },
    { key: 'calculation_type', label: 'Type', render: (value) => String(value || '').replace(/_/g, ' ') },
    { key: 'jurisdiction', label: 'Jurisdiction' },
    { key: 'taxable_income', label: 'Taxable Income', render: (value) => <span style={{ fontFamily: 'monospace' }}>{formatMoney(value)}</span> },
    { key: 'calculated_tax', label: 'Calculated Tax', render: (value) => <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{formatMoney(value)}</span> },
    { key: 'effective_rate', label: 'Effective Rate', render: (value) => `${(Number(value || 0) * 100).toFixed(2)}%` },
  ];

  return (
    <div className="module-page">
      <PageHeader title="Tax Subledger" subtitle="Calculate and track entity tax liabilities by jurisdiction" actions={<Button variant="primary" size="small" onClick={() => navigate(`${BASE_PATH}/create`)}>New Calculation</Button>} />

      {error && <div className="error-banner" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Card className="stat-card"><div className="stat-label">Calculations</div><div className="stat-value">{records.length}</div></Card>
        <Card className="stat-card"><div className="stat-label">Total Calculated Tax</div><div className="stat-value">{formatMoney(totalCalculated)}</div></Card>
      </div>

      <Card title="Tax Ledger">
        {loading ? <div style={{ padding: 32, textAlign: 'center' }}>Loading tax calculations...</div> : <Table columns={columns} data={records} actions={(row) => <div style={{ display: 'flex', gap: 6 }}><button type="button" onClick={() => navigate(`${BASE_PATH}/view/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', background: 'transparent', cursor: 'pointer' }}>View</button><button type="button" onClick={() => navigate(`${BASE_PATH}/edit/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', background: 'transparent', cursor: 'pointer' }}>Edit</button><button type="button" onClick={() => handleDelete(row.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid #fca5a5', background: 'transparent', color: '#dc2626', cursor: 'pointer' }}>Delete</button></div>} />}
      </Card>

      <Modal isOpen={showModal} onClose={closeModal} title={viewOnly ? 'Tax Calculation Details' : editItem ? 'Edit Tax Calculation' : 'New Tax Calculation'} footer={viewOnly ? <Button variant="secondary" onClick={closeModal}>Close</Button> : <><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Calculating...' : 'Save Calculation'}</Button></>}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Entity *</label>
            <select disabled={viewOnly} value={form.entity} onChange={setField('entity')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
              <option value="">Select entity</option>
              {entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Tax Year *" type="number" value={form.tax_year} onChange={setField('tax_year')} disabled={viewOnly} />
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Calculation Type</label>
              <select disabled={viewOnly} value={form.calculation_type} onChange={setField('calculation_type')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
                {['corporate', 'personal', 'vat', 'withholding', 'property'].map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>
          <Input label="Jurisdiction *" value={form.jurisdiction} onChange={setField('jurisdiction')} disabled={viewOnly} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Taxable Income *" type="number" step="0.01" value={form.taxable_income} onChange={setField('taxable_income')} disabled={viewOnly} />
            <Input label="Tax Rate % *" type="number" step="0.01" value={form.tax_rate} onChange={setField('tax_rate')} disabled={viewOnly} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Deductions" type="number" step="0.01" value={form.deductions} onChange={setField('deductions')} disabled={viewOnly} />
            <Input label="Credits" type="number" step="0.01" value={form.credits} onChange={setField('credits')} disabled={viewOnly} />
          </div>
          {viewOnly && editItem ? <Card><div style={{ fontSize: 12, color: 'var(--color-silver-dark)' }}>Calculated Tax</div><div style={{ fontSize: 24, fontWeight: 700 }}>{formatMoney(editItem.calculated_tax)}</div><div style={{ marginTop: 8, fontSize: 12 }}>Effective Rate: {(Number(editItem.effective_rate || 0) * 100).toFixed(2)}%</div></Card> : null}
        </div>
      </Modal>
    </div>
  );
}
