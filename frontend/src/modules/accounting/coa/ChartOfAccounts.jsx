import React, { useState, useMemo } from 'react';
import { Button, Card, PageHeader, Input, Modal } from '../../../components/ui';

const ACCOUNT_TYPES = [
  { value: 'Asset',     color: '#059669' },
  { value: 'Liability', color: '#DC2626' },
  { value: 'Equity',    color: '#7C3AED' },
  { value: 'Revenue',   color: '#0284C7' },
  { value: 'Expense',   color: '#D97706' },
];

const STATUS_OPTIONS = ['Active', 'Inactive', 'Archived'];
const CURRENCY_OPTIONS = ['ZAR', 'USD', 'EUR', 'GBP', 'SGD', 'AED'];

const SEED = [
  { id: 1,  code: '1000', name: 'Cash & Cash Equivalents',   type: 'Asset',     currency: 'ZAR', balance: 250000,   costCenter: '',           status: 'Active',   desc: 'Bank and petty cash accounts' },
  { id: 2,  code: '1100', name: 'Accounts Receivable',       type: 'Asset',     currency: 'ZAR', balance: 180000,   costCenter: 'Sales',      status: 'Active',   desc: '' },
  { id: 3,  code: '1200', name: 'Inventory',                 type: 'Asset',     currency: 'ZAR', balance: 95000,    costCenter: 'Ops',        status: 'Active',   desc: '' },
  { id: 4,  code: '1500', name: 'Property & Equipment',      type: 'Asset',     currency: 'ZAR', balance: 420000,   costCenter: '',           status: 'Active',   desc: 'Fixed assets net of depreciation' },
  { id: 5,  code: '2000', name: 'Accounts Payable',          type: 'Liability', currency: 'ZAR', balance: 95000,    costCenter: 'Finance',    status: 'Active',   desc: '' },
  { id: 6,  code: '2100', name: 'Accrued Liabilities',       type: 'Liability', currency: 'ZAR', balance: 32000,    costCenter: '',           status: 'Active',   desc: '' },
  { id: 7,  code: '2500', name: 'Long-term Debt',            type: 'Liability', currency: 'ZAR', balance: 210000,   costCenter: '',           status: 'Active',   desc: '' },
  { id: 8,  code: '3000', name: "Owner's Equity",            type: 'Equity',    currency: 'ZAR', balance: 500000,   costCenter: '',           status: 'Active',   desc: '' },
  { id: 9,  code: '3100', name: 'Retained Earnings',         type: 'Equity',    currency: 'ZAR', balance: 108000,   costCenter: '',           status: 'Active',   desc: '' },
  { id: 10, code: '4000', name: 'Revenue',                   type: 'Revenue',   currency: 'ZAR', balance: 750000,   costCenter: 'Sales',      status: 'Active',   desc: '' },
  { id: 11, code: '4100', name: 'Service Income',            type: 'Revenue',   currency: 'ZAR', balance: 120000,   costCenter: 'Services',   status: 'Active',   desc: '' },
  { id: 12, code: '5000', name: 'Cost of Goods Sold',        type: 'Expense',   currency: 'ZAR', balance: 310000,   costCenter: 'Ops',        status: 'Active',   desc: '' },
  { id: 13, code: '5100', name: 'Salaries & Wages',          type: 'Expense',   currency: 'ZAR', balance: 195000,   costCenter: 'HR',         status: 'Active',   desc: '' },
  { id: 14, code: '5200', name: 'Rent & Utilities',          type: 'Expense',   currency: 'ZAR', balance: 48000,    costCenter: 'Facilities', status: 'Active',   desc: '' },
  { id: 15, code: '5300', name: 'Marketing & Advertising',   type: 'Expense',   currency: 'ZAR', balance: 22000,    costCenter: 'Marketing',  status: 'Inactive', desc: '' },
];

let nextId = SEED.length + 1;

const BLANK = { code: '', name: '', type: 'Asset', currency: 'ZAR', balance: '', costCenter: '', parent: '', desc: '', status: 'Active' };

const fmt = (v) => Number(v || 0).toLocaleString('en-ZA', { minimumFractionDigits: 2 });

const lbl = { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 5 };
const sel = {
  width: '100%', height: 38, padding: '0 10px', fontSize: 13,
  border: '1px solid #D1D5DB', borderRadius: 6, background: '#fff',
  color: '#111827', boxSizing: 'border-box', cursor: 'pointer',
};
const inp2 = {
  width: '100%', height: 38, padding: '0 10px', fontSize: 13,
  border: '1px solid #D1D5DB', borderRadius: 6, background: '#fff',
  color: '#111827', boxSizing: 'border-box',
};

const ChartOfAccounts = () => {
  const [accounts, setAccounts] = useState(SEED);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(BLANK);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [collapsed, setCollapsed] = useState({});

  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const openNew  = () => { setEditing(null); setForm(BLANK); setShowModal(true); };
  const openEdit = (a) => {
    setEditing(a);
    setForm({ code: a.code, name: a.name, type: a.type, currency: a.currency, balance: String(a.balance), costCenter: a.costCenter, parent: a.parent || '', desc: a.desc, status: a.status });
    setShowModal(true);
  };
  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleSave = () => {
    if (!form.code.trim() || !form.name.trim()) return;
    if (editing) {
      setAccounts(prev => prev.map(a => a.id === editing.id ? { ...a, ...form, balance: parseFloat(form.balance) || 0 } : a));
    } else {
      setAccounts(prev => [...prev, { id: nextId++, ...form, balance: parseFloat(form.balance) || 0 }]);
    }
    closeModal();
  };

  const handleDelete = (id) => {
    if (!window.confirm('Delete this account?')) return;
    setAccounts(prev => prev.filter(a => a.id !== id));
  };

  const toggleCollapse = (type) => setCollapsed(p => ({ ...p, [type]: !p[type] }));

  const filtered = useMemo(() => accounts.filter(a => {
    const q = search.toLowerCase();
    const matchQ = !q || a.code.toLowerCase().includes(q) || a.name.toLowerCase().includes(q);
    const matchT = !filterType || a.type === filterType;
    return matchQ && matchT;
  }), [accounts, search, filterType]);

  const grouped = useMemo(() => ACCOUNT_TYPES.reduce((acc, t) => {
    acc[t.value] = filtered.filter(a => a.type === t.value);
    return acc;
  }, {}), [filtered]);

  const stats = ACCOUNT_TYPES.map(t => ({
    ...t,
    count: accounts.filter(a => a.type === t.value).length,
    total: accounts.filter(a => a.type === t.value).reduce((s, a) => s + Number(a.balance), 0),
  }));

  return (
    <div className="module-page">
      <PageHeader
        title="Chart of Accounts"
        subtitle="Manage your account structure across all types"
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" onClick={() => {
              const csv = ['Code,Name,Type,Currency,Balance,Status', ...accounts.map(a => `${a.code},"${a.name}",${a.type},${a.currency},${a.balance},${a.status}`)].join('\n');
              const a = document.createElement('a'); a.href = 'data:text/csv,' + encodeURIComponent(csv); a.download = 'chart-of-accounts.csv'; a.click();
            }}>Export CSV</Button>
            <Button variant="primary" onClick={openNew}>+ New Account</Button>
          </div>
        }
      />

      {/* KPI strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 14, marginBottom: 22 }}>
        {stats.map(s => (
          <Card key={s.value} style={{ padding: '14px 18px', borderTop: `3px solid ${s.color}` }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: s.color, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.value}</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: '4px 0 2px' }}>{s.count}</div>
            <div style={{ fontSize: 11, color: '#6B7280' }}>{s.value === 'Asset' || s.value === 'Revenue' ? '+' : ''}{fmt(s.total)}</div>
          </Card>
        ))}
      </div>

      {/* Search + filter */}
      <Card style={{ padding: '12px 16px', marginBottom: 18, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <Input
            placeholder="Search by code or name…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 0, height: 38 }}
          />
        </div>
        <select style={{ ...sel, width: 180 }} value={filterType} onChange={e => setFilterType(e.target.value)}>
          <option value="">All Types</option>
          {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
        </select>
      </Card>

      {/* Grouped tables */}
      {ACCOUNT_TYPES.map(t => {
        const rows = grouped[t.value];
        if (!rows || rows.length === 0) return null;
        const isOpen = !collapsed[t.value];
        return (
          <Card key={t.value} style={{ marginBottom: 16, overflow: 'hidden', padding: 0 }}>
            {/* Group header */}
            <div
              onClick={() => toggleCollapse(t.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px',
                background: '#F9FAFB', borderBottom: isOpen ? '1px solid #E5E7EB' : 'none',
                cursor: 'pointer', userSelect: 'none',
              }}
            >
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: t.color, flexShrink: 0 }} />
              <span style={{ fontWeight: 700, fontSize: 14, color: '#111827', flex: 1 }}>{t.value}</span>
              <span style={{ fontSize: 12, color: '#6B7280' }}>{rows.length} accounts</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: t.color, minWidth: 110, textAlign: 'right' }}>
                {fmt(rows.reduce((s, a) => s + Number(a.balance), 0))}
              </span>
              <span style={{ fontSize: 16, color: '#9CA3AF', marginLeft: 8 }}>{isOpen ? '▾' : '▸'}</span>
            </div>

            {isOpen && (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#FAFAFA' }}>
                      {['Code', 'Account Name', 'Currency', 'Cost Center', 'Balance', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '9px 16px', textAlign: 'left', fontWeight: 600, color: '#374151', fontSize: 12, borderBottom: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((a, i) => (
                      <tr key={a.id}
                        style={{ borderBottom: '1px solid #F3F4F6', background: i % 2 === 1 ? '#FAFAFA' : '#fff' }}
                        onMouseOver={e => e.currentTarget.style.background = '#EFF6FF'}
                        onMouseOut={e => e.currentTarget.style.background = i % 2 === 1 ? '#FAFAFA' : '#fff'}
                      >
                        <td style={{ padding: '10px 16px', fontFamily: 'monospace', fontWeight: 600, color: '#374151' }}>{a.code}</td>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ fontWeight: 500, color: '#111827' }}>{a.name}</div>
                          {a.desc && <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{a.desc}</div>}
                        </td>
                        <td style={{ padding: '10px 16px', color: '#6B7280' }}>{a.currency}</td>
                        <td style={{ padding: '10px 16px', color: '#6B7280' }}>{a.costCenter || '—'}</td>
                        <td style={{ padding: '10px 16px', fontWeight: 600, color: '#111827', textAlign: 'right' }}>
                          {a.currency} {fmt(a.balance)}
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <span style={{
                            background: a.status === 'Active' ? '#D1FAE5' : a.status === 'Inactive' ? '#F3F4F6' : '#FEF3C7',
                            color: a.status === 'Active' ? '#065F46' : a.status === 'Inactive' ? '#374151' : '#92400E',
                            borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 600,
                          }}>{a.status}</span>
                        </td>
                        <td style={{ padding: '10px 16px' }}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => openEdit(a)} style={{ background: '#F3F4F6', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>Edit</button>
                            <button onClick={() => handleDelete(a.id)} style={{ background: '#FEE2E2', color: '#DC2626', border: 'none', borderRadius: 5, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        );
      })}

      {filtered.length === 0 && (
        <Card style={{ padding: '40px 0', textAlign: 'center', color: '#9CA3AF' }}>
          No accounts match your search.
        </Card>
      )}

      {/* Add / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editing ? 'Edit Account' : 'Add New Account'}
        size="large"
        footer={
          <>
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button variant="primary" onClick={handleSave} disabled={!form.code.trim() || !form.name.trim()}>
              {editing ? 'Save Changes' : 'Create Account'}
            </Button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Code + Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 14 }}>
            <div>
              <label style={lbl}>Account Code <span style={{ color: '#DC2626' }}>*</span></label>
              <input style={inp2} value={form.code} onChange={set('code')} placeholder="e.g. 1000" />
            </div>
            <div>
              <label style={lbl}>Account Name <span style={{ color: '#DC2626' }}>*</span></label>
              <input style={inp2} value={form.name} onChange={set('name')} placeholder="e.g. Cash & Cash Equivalents" />
            </div>
          </div>

          {/* Type + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Account Type <span style={{ color: '#DC2626' }}>*</span></label>
              <select style={sel} value={form.type} onChange={set('type')}>
                {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.value}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Status</label>
              <select style={sel} value={form.status} onChange={set('status')}>
                {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Currency + Opening Balance */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Currency</label>
              <select style={sel} value={form.currency} onChange={set('currency')}>
                {CURRENCY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Opening Balance</label>
              <input style={inp2} type="number" step="0.01" value={form.balance} onChange={set('balance')} placeholder="0.00" />
            </div>
          </div>

          {/* Cost Center + Parent */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Cost Center</label>
              <input style={inp2} value={form.costCenter} onChange={set('costCenter')} placeholder="e.g. Operations" />
            </div>
            <div>
              <label style={lbl}>Parent Account <span style={{ fontSize: 11, color: '#9CA3AF' }}>(optional)</span></label>
              <select style={sel} value={form.parent} onChange={set('parent')}>
                <option value="">— None —</option>
                {accounts.filter(a => a.type === form.type && a.id !== editing?.id).map(a => (
                  <option key={a.id} value={a.id}>{a.code} – {a.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label style={lbl}>Description <span style={{ fontSize: 11, color: '#9CA3AF' }}>(optional)</span></label>
            <textarea
              style={{ ...inp2, height: 72, padding: '8px 10px', resize: 'vertical' }}
              value={form.desc}
              onChange={set('desc')}
              placeholder="Optional description or notes…"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ChartOfAccounts;
