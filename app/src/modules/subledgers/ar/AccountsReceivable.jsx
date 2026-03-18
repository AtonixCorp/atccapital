import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../../components/ui';
import { invoicesAPI, customersAPI, entitiesAPI } from '../../../services/api';

const BASE_PATH = '/app/subledgers/accounts-receivable';
const EMPTY_FORM = {
  entity: '',
  customer: '',
  invoice_number: '',
  invoice_date: '',
  due_date: '',
  subtotal: '',
  tax_amount: '0',
  total_amount: '',
  currency: 'USD',
  status: 'draft',
  description: '',
  notes: '',
};

const STATUS_COLORS = {
  draft: '#6b7280',
  posted: '#2563eb',
  partially_paid: '#d97706',
  paid: '#059669',
  overdue: '#dc2626',
  cancelled: '#9ca3af',
};

const parseList = (response) => response.data.results || response.data;
const formatMoney = (value) => `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const formatError = (error, fallback) => {
  const data = error.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  return Object.entries(data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(' | ');
};

export default function AccountsReceivable() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [records, setRecords] = useState([]);
  const [customers, setCustomers] = useState([]);
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
      const [invoiceRes, customerRes, entityRes] = await Promise.all([
        invoicesAPI.getAll(),
        customersAPI.getAll(),
        entitiesAPI.getAll(),
      ]);
      setRecords(parseList(invoiceRes));
      setCustomers(parseList(customerRes));
      setEntities(parseList(entityRes));
      setError('');
    } catch (requestError) {
      setError(formatError(requestError, 'Failed to load accounts receivable.'));
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
      setEditItem(null);
      setViewOnly(false);
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
      customer: match.customer || '',
      invoice_number: match.invoice_number || '',
      invoice_date: match.invoice_date || '',
      due_date: match.due_date || '',
      subtotal: match.subtotal || '',
      tax_amount: match.tax_amount || '0',
      total_amount: match.total_amount || '',
      currency: match.currency || 'USD',
      status: match.status || 'draft',
      description: match.description || '',
      notes: match.notes || '',
    });
    setShowModal(true);
  }, [id, location.pathname, records]);

  const setField = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.entity) {
      setError('Entity is required.');
      return;
    }
    if (!form.customer) {
      setError('Customer is required.');
      return;
    }
    if (!form.invoice_number.trim()) {
      setError('Invoice number is required.');
      return;
    }
    if (!form.invoice_date || !form.due_date) {
      setError('Invoice date and due date are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const subtotal = Number(form.subtotal || 0);
      const taxAmount = Number(form.tax_amount || 0);
      const payload = {
        ...form,
        total_amount: form.total_amount || (subtotal + taxAmount).toFixed(2),
      };

      if (editItem) {
        await invoicesAPI.update(editItem.id, payload);
      } else {
        await invoicesAPI.create(payload);
      }
      await load();
      closeModal();
    } catch (requestError) {
      setError(formatError(requestError, 'Failed to save invoice.'));
    }
    setSaving(false);
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('Delete this invoice?')) return;
    try {
      await invoicesAPI.delete(recordId);
      await load();
    } catch (requestError) {
      setError(formatError(requestError, 'Failed to delete invoice.'));
    }
  };

  const totalOutstanding = records.reduce((sum, record) => sum + Number(record.outstanding_amount || 0), 0);
  const overdueCount = records.filter((record) => record.status === 'overdue').length;
  const paidCount = records.filter((record) => record.status === 'paid').length;

  const columns = [
    { key: 'invoice_number', label: 'Invoice #', render: (value) => <code style={{ fontSize: 12 }}>{value}</code> },
    { key: 'customer_name', label: 'Customer', render: (value) => value || '—' },
    { key: 'invoice_date', label: 'Invoice Date' },
    { key: 'due_date', label: 'Due Date' },
    { key: 'total_amount', label: 'Total', render: (value) => <span style={{ fontFamily: 'monospace' }}>{formatMoney(value)}</span> },
    { key: 'outstanding_amount', label: 'Outstanding', render: (value) => <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{formatMoney(value)}</span> },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span style={{ color: STATUS_COLORS[value] || '#6b7280', fontWeight: 700, textTransform: 'capitalize' }}>
          {String(value || '').replace(/_/g, ' ')}
        </span>
      ),
    },
  ];

  return (
    <div className="module-page">
      <PageHeader
        title="Accounts Receivable"
        subtitle="Track open invoices and customer balances"
        actions={
          <>
            <Button variant="secondary" size="small" onClick={() => navigate('/app/billing/customers/create')}>New Customer</Button>
            <Button variant="primary" size="small" onClick={() => navigate(`${BASE_PATH}/create`)}>New Invoice</Button>
          </>
        }
      />

      {error && <div className="error-banner" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Card className="stat-card"><div className="stat-label">Open Invoices</div><div className="stat-value">{records.length}</div></Card>
        <Card className="stat-card"><div className="stat-label">Outstanding</div><div className="stat-value">{formatMoney(totalOutstanding)}</div></Card>
        <Card className="stat-card"><div className="stat-label">Overdue</div><div className="stat-value" style={{ color: '#dc2626' }}>{overdueCount}</div></Card>
        <Card className="stat-card"><div className="stat-label">Paid</div><div className="stat-value" style={{ color: '#059669' }}>{paidCount}</div></Card>
      </div>

      <Card title="Receivables Ledger">
        {loading ? <div style={{ padding: 32, textAlign: 'center' }}>Loading receivables...</div> : (
          <Table
            columns={columns}
            data={records}
            actions={(row) => (
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="button" onClick={() => navigate(`${BASE_PATH}/view/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', background: 'transparent', cursor: 'pointer' }}>View</button>
                <button type="button" onClick={() => navigate(`${BASE_PATH}/edit/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', background: 'transparent', cursor: 'pointer' }}>Edit</button>
                <button type="button" onClick={() => handleDelete(row.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid #fca5a5', background: 'transparent', color: '#dc2626', cursor: 'pointer' }}>Delete</button>
              </div>
            )}
          />
        )}
      </Card>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={viewOnly ? 'Invoice Details' : editItem ? 'Edit Invoice' : 'Create Invoice'}
        footer={viewOnly ? <Button variant="secondary" onClick={closeModal}>Close</Button> : <><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Invoice'}</Button></>}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Entity *</label>
            <select disabled={viewOnly} value={form.entity} onChange={setField('entity')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
              <option value="">Select entity</option>
              {entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Customer *</label>
            <select disabled={viewOnly} value={form.customer} onChange={setField('customer')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
              <option value="">Select customer</option>
              {customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.customer_name}</option>)}
            </select>
          </div>
          <Input label="Invoice Number *" value={form.invoice_number} onChange={setField('invoice_number')} disabled={viewOnly} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Invoice Date *" type="date" value={form.invoice_date} onChange={setField('invoice_date')} disabled={viewOnly} />
            <Input label="Due Date *" type="date" value={form.due_date} onChange={setField('due_date')} disabled={viewOnly} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Input label="Subtotal" type="number" step="0.01" value={form.subtotal} onChange={setField('subtotal')} disabled={viewOnly} />
            <Input label="Tax Amount" type="number" step="0.01" value={form.tax_amount} onChange={setField('tax_amount')} disabled={viewOnly} />
            <Input label="Total Amount" type="number" step="0.01" value={form.total_amount} onChange={setField('total_amount')} disabled={viewOnly} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Currency" value={form.currency} onChange={setField('currency')} disabled={viewOnly} />
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Status</label>
              <select disabled={viewOnly} value={form.status} onChange={setField('status')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
                {['draft', 'posted', 'partially_paid', 'paid', 'overdue', 'cancelled'].map((status) => <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
          </div>
          <Input label="Description" value={form.description} onChange={setField('description')} disabled={viewOnly} />
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Notes</label>
            <textarea disabled={viewOnly} rows={3} value={form.notes} onChange={setField('notes')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
