import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../../components/ui';
import { bankAccountsAPI, entitiesAPI } from '../../../services/api';

const BASE_PATH = '/app/subledgers/cash-bank';
const EMPTY_FORM = {
  entity: '',
  account_name: '',
  bank_name: '',
  account_number: '',
  account_type: 'checking',
  currency: 'USD',
  iban: '',
  swift_code: '',
  routing_number: '',
  balance: '0',
  available_balance: '0',
  notes: '',
  is_active: 'true',
};

const parseList = (response) => response.data.results || response.data;
const formatMoney = (value) => `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const formatError = (error, fallback) => {
  const data = error.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  return Object.entries(data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(' | ');
};

export default function CashBank() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [accounts, setAccounts] = useState([]);
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
      const [accountRes, entityRes] = await Promise.all([bankAccountsAPI.getAll(), entitiesAPI.getAll()]);
      setAccounts(parseList(accountRes));
      setEntities(parseList(entityRes));
      setError('');
    } catch (requestError) {
      setError(formatError(requestError, 'Failed to load bank accounts.'));
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
    if (!id || !accounts.length) return;
    const match = accounts.find((account) => String(account.id) === String(id));
    if (!match) return;
    setEditItem(match);
    setViewOnly(location.pathname.includes('/view/'));
    setForm({
      entity: match.entity || '',
      account_name: match.account_name || '',
      bank_name: match.bank_name || '',
      account_number: match.account_number || '',
      account_type: match.account_type || 'checking',
      currency: match.currency || 'USD',
      iban: match.iban || '',
      swift_code: match.swift_code || '',
      routing_number: match.routing_number || '',
      balance: match.balance || '0',
      available_balance: match.available_balance || '0',
      notes: match.notes || '',
      is_active: String(match.is_active ?? true),
    });
    setShowModal(true);
  }, [accounts, id, location.pathname]);

  const setField = (field) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.entity) {
      setError('Entity is required.');
      return;
    }
    if (!form.account_name.trim() || !form.bank_name.trim() || !form.account_number.trim()) {
      setError('Account name, bank name, and account number are required.');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        is_active: form.is_active === 'true',
      };
      if (editItem) {
        await bankAccountsAPI.update(editItem.id, payload);
      } else {
        await bankAccountsAPI.create(payload);
      }
      await load();
      closeModal();
    } catch (requestError) {
      setError(formatError(requestError, 'Failed to save bank account.'));
    }
    setSaving(false);
  };

  const handleDelete = async (recordId) => {
    if (!window.confirm('Delete this bank account?')) return;
    try {
      await bankAccountsAPI.delete(recordId);
      await load();
    } catch (requestError) {
      setError(formatError(requestError, 'Failed to delete bank account.'));
    }
  };

  const totalBalance = accounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const activeAccounts = accounts.filter((account) => account.is_active).length;
  const inactiveAccounts = accounts.length - activeAccounts;

  const columns = [
    { key: 'account_name', label: 'Account' },
    { key: 'bank_name', label: 'Bank' },
    { key: 'account_type', label: 'Type', render: (value) => String(value || '').replace(/_/g, ' ') },
    { key: 'balance', label: 'Balance', render: (value) => <span style={{ fontFamily: 'monospace' }}>{formatMoney(value)}</span> },
    { key: 'available_balance', label: 'Available', render: (value) => <span style={{ fontFamily: 'monospace' }}>{formatMoney(value)}</span> },
    { key: 'currency', label: 'Currency' },
    { key: 'is_active', label: 'Status', render: (value) => <span style={{ color: value ? '#059669' : '#dc2626', fontWeight: 700 }}>{value ? 'Active' : 'Inactive'}</span> },
  ];

  return (
    <div className="module-page">
      <PageHeader
        title="Cash & Bank"
        subtitle="Manage bank accounts and cash positions"
        actions={<Button variant="primary" size="small" onClick={() => navigate(`${BASE_PATH}/create`)}>Add Account</Button>}
      />

      {error && <div className="error-banner" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Card className="stat-card"><div className="stat-label">Total Cash Position</div><div className="stat-value">{formatMoney(totalBalance)}</div></Card>
        <Card className="stat-card"><div className="stat-label">Active Accounts</div><div className="stat-value" style={{ color: '#059669' }}>{activeAccounts}</div></Card>
        <Card className="stat-card"><div className="stat-label">Inactive Accounts</div><div className="stat-value" style={{ color: '#dc2626' }}>{inactiveAccounts}</div></Card>
      </div>

      <Card title="Bank Accounts">
        {loading ? <div style={{ padding: 32, textAlign: 'center' }}>Loading bank accounts...</div> : (
          <Table
            columns={columns}
            data={accounts}
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
        title={viewOnly ? 'Bank Account Details' : editItem ? 'Edit Bank Account' : 'Add Bank Account'}
        footer={viewOnly ? <Button variant="secondary" onClick={closeModal}>Close</Button> : <><Button variant="secondary" onClick={closeModal}>Cancel</Button><Button variant="primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save Account'}</Button></>}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Entity *</label>
            <select disabled={viewOnly} value={form.entity} onChange={setField('entity')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
              <option value="">Select entity</option>
              {entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Account Name *" value={form.account_name} onChange={setField('account_name')} disabled={viewOnly} />
            <Input label="Bank Name *" value={form.bank_name} onChange={setField('bank_name')} disabled={viewOnly} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Account Number *" value={form.account_number} onChange={setField('account_number')} disabled={viewOnly} />
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Account Type</label>
              <select disabled={viewOnly} value={form.account_type} onChange={setField('account_type')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
                {['checking', 'savings', 'business', 'investment'].map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Input label="Currency" value={form.currency} onChange={setField('currency')} disabled={viewOnly} />
            <Input label="Balance" type="number" step="0.01" value={form.balance} onChange={setField('balance')} disabled={viewOnly} />
            <Input label="Available Balance" type="number" step="0.01" value={form.available_balance} onChange={setField('available_balance')} disabled={viewOnly} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Input label="IBAN" value={form.iban} onChange={setField('iban')} disabled={viewOnly} />
            <Input label="SWIFT Code" value={form.swift_code} onChange={setField('swift_code')} disabled={viewOnly} />
            <Input label="Routing Number" value={form.routing_number} onChange={setField('routing_number')} disabled={viewOnly} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Status</label>
            <select disabled={viewOnly} value={form.is_active} onChange={setField('is_active')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
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
