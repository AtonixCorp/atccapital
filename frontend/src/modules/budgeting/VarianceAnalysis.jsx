import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Modal } from '../../components/ui';

const PERIOD_DATA = {
  'Jan 2025': [
    { account: 'Service Revenue', budget: 280000, actual: 284000, type: 'Favorable' },
    { account: 'Product Revenue', budget: 70000,  actual: 62000,  type: 'Unfavorable' },
    { account: 'Salaries & Wages', budget: 80000, actual: 85000,  type: 'Unfavorable' },
    { account: 'Rent & Utilities', budget: 13000, actual: 12800,  type: 'Favorable' },
    { account: 'Technology & SaaS', budget: 8000, actual: 8200,   type: 'Unfavorable' },
    { account: 'Marketing',         budget: 15000, actual: 12500, type: 'Favorable' },
  ],
  'Dec 2024': [
    { account: 'Service Revenue', budget: 270000, actual: 278000, type: 'Favorable' },
    { account: 'Product Revenue', budget: 65000,  actual: 68000,  type: 'Favorable' },
    { account: 'Salaries & Wages', budget: 80000, actual: 82000,  type: 'Unfavorable' },
    { account: 'Rent & Utilities', budget: 13000, actual: 13000,  type: 'Favorable' },
    { account: 'Technology & SaaS', budget: 8000, actual: 7800,   type: 'Favorable' },
    { account: 'Marketing',         budget: 15000, actual: 16000, type: 'Unfavorable' },
  ],
  'Nov 2024': [
    { account: 'Service Revenue', budget: 260000, actual: 255000, type: 'Unfavorable' },
    { account: 'Product Revenue', budget: 62000,  actual: 65000,  type: 'Favorable' },
    { account: 'Salaries & Wages', budget: 78000, actual: 80000,  type: 'Unfavorable' },
    { account: 'Rent & Utilities', budget: 13000, actual: 12900,  type: 'Favorable' },
    { account: 'Technology & SaaS', budget: 7500, actual: 7500,   type: 'Favorable' },
    { account: 'Marketing',         budget: 14000, actual: 13200, type: 'Favorable' },
  ],
};

const PERIODS = Object.keys(PERIOD_DATA);
const VARIANCE_COLORS = { Favorable: 'var(--color-success)', Unfavorable: 'var(--color-error)' };

const fmtVar = (n) => (n >= 0 ? `+$${Math.abs(n).toLocaleString()}` : `-$${Math.abs(n).toLocaleString()}`);
const fmtPct = (b, a) => {
  const pct = ((a - b) / b) * 100;
  return (pct >= 0 ? '+' : '') + pct.toFixed(1) + '%';
};

export default function VarianceAnalysis() {
  const [period, setPeriod] = useState('Jan 2025');
  const [detail, setDetail] = useState(null);

  const rows = PERIOD_DATA[period].map(r => ({
    ...r,
    budgetFmt:  `$${r.budget.toLocaleString()}`,
    actualFmt:  `$${r.actual.toLocaleString()}`,
    variance:   r.actual - r.budget,
    varianceFmt: fmtVar(r.actual - r.budget),
    pct:        fmtPct(r.budget, r.actual),
  }));

  const netRow = (() => {
    const bSum = rows.reduce((s, r) => r.account.includes('Revenue') ? s + r.budget : s - r.budget, 0);
    const aSum = rows.reduce((s, r) => r.account.includes('Revenue') ? s + r.actual : s - r.actual, 0);
    return { account: 'Net Income', bSum, aSum, variance: aSum - bSum, type: aSum >= bSum ? 'Favorable' : 'Unfavorable' };
  })();

  const revenueVar = rows.filter(r => r.account.includes('Revenue')).reduce((s, r) => s + r.variance, 0);
  const expenseVar = rows.filter(r => !r.account.includes('Revenue')).reduce((s, r) => s + r.variance, 0);
  const favorableCount = rows.filter(r => r.type === 'Favorable').length;

  const maxBudget = Math.max(...rows.map(r => Math.max(r.budget, r.actual)));

  const columns = [
    { key: 'account', header: 'Account' },
    { key: 'budgetFmt', header: 'Budget' },
    { key: 'actualFmt', header: 'Actual' },
    { key: 'varianceFmt', header: 'Variance ($)', render: (row) => (
      <span style={{ color: VARIANCE_COLORS[row.type], fontWeight: 600 }}>{row.varianceFmt}</span>
    )},
    { key: 'pct', header: 'Variance (%)', render: (row) => (
      <span style={{ color: VARIANCE_COLORS[row.type], fontWeight: 600 }}>{row.pct}</span>
    )},
    { key: 'type', header: 'Type', render: (row) => (
      <span className="status-badge" style={{ background: VARIANCE_COLORS[row.type] }}>{row.type}</span>
    )},
    { key: '_actions', header: '', render: (_, row) => (
      <Button variant="secondary" size="small" onClick={() => setDetail(row)}>Detail</Button>
    )},
  ];

  return (
    <div className="module-page">
      <PageHeader
        title="Variance Analysis"
        subtitle="Budget vs actual performance by account and cost center"
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              className="filter-select"
              value={period}
              onChange={e => setPeriod(e.target.value)}
              style={{ height: 32, fontSize: 13 }}
            >
              {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <Button variant="secondary" size="small">Export Analysis</Button>
          </div>
        }
      />

      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-label">Revenue Variance</div>
          <div className="stat-value" style={{ color: revenueVar >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
            {fmtVar(revenueVar)}
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Expense Variance</div>
          <div className="stat-value" style={{ color: expenseVar <= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
            {fmtVar(expenseVar)}
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Net Income Variance</div>
          <div className="stat-value" style={{ color: netRow.variance >= 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
            {fmtVar(netRow.variance)}
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Favorable Accounts</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{favorableCount} / {rows.length}</div>
        </Card>
      </div>

      {/* Inline Bar Chart */}
      <Card title={`Budget vs Actual — ${period}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {rows.map(row => (
            <div key={row.account} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 160, fontSize: 12, color: 'var(--color-midnight)', fontWeight: 500, flexShrink: 0, textAlign: 'right' }}>
                {row.account}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: `${(row.budget / maxBudget) * 100}%`, height: 10, background: 'var(--color-silver-dark)', borderRadius: 2, minWidth: 4 }} />
                  <span style={{ fontSize: 11, color: 'var(--color-silver-dark)' }}>${(row.budget / 1000).toFixed(0)}k</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: `${(row.actual / maxBudget) * 100}%`, height: 10, background: VARIANCE_COLORS[row.type], borderRadius: 2, minWidth: 4 }} />
                  <span style={{ fontSize: 11, color: VARIANCE_COLORS[row.type], fontWeight: 600 }}>${(row.actual / 1000).toFixed(0)}k</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 20, fontSize: 11 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 14, height: 4, background: 'var(--color-silver-dark)', borderRadius: 2 }} /> Budget
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 14, height: 4, background: 'var(--color-cyan)', borderRadius: 2 }} /> Actual (Favorable)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 14, height: 4, background: 'var(--color-error)', borderRadius: 2 }} /> Actual (Unfavorable)
          </div>
        </div>
      </Card>

      <Card title={`Account Detail — ${period}`}>
        <Table columns={columns} data={rows} />
      </Card>

      {/* Detail modal */}
      <Modal isOpen={!!detail} onClose={() => setDetail(null)} title={detail ? `Variance Detail — ${detail.account}` : ''}>
        {detail && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { label: 'Budget',   value: detail.budgetFmt },
                { label: 'Actual',   value: detail.actualFmt },
                { label: 'Variance ($)', value: detail.varianceFmt, color: VARIANCE_COLORS[detail.type] },
                { label: 'Variance (%)', value: detail.pct,         color: VARIANCE_COLORS[detail.type] },
              ].map(item => (
                <div key={item.label} style={{ padding: '12px 16px', border: '1px solid var(--border-color-default)', borderRadius: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-silver-dark)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: item.color || 'var(--color-midnight)' }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ padding: '12px 16px', background: 'var(--color-silver-very-light)', borderRadius: 6, fontSize: 13, color: 'var(--color-midnight)' }}>
              <strong>Status:</strong>{' '}
              <span style={{ color: VARIANCE_COLORS[detail.type], fontWeight: 600 }}>{detail.type}</span>
              {' '}— {detail.type === 'Favorable' ? 'Actual performance exceeded budget targets.' : 'Actual performance fell short of budget targets.'}
            </div>
            <div className="modal-footer">
              <Button variant="secondary" onClick={() => setDetail(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
