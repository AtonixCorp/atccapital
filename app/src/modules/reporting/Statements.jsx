import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageHeader, Card, Button } from '../../components/ui';
import { useFilters } from '../../context/FilterContext';
import { entitiesAPI, financialStatementsAPI } from '../../services/api';

const STATEMENTS = [
  { id: 'income', title: 'Income Statement' },
  { id: 'balance', title: 'Balance Sheet' },
  { id: 'cashflow', title: 'Cash Flow Statement' },
];

const parseList = (response) => response.data.results || response.data;
const formatError = (error, fallback) => {
  const data = error.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  return Object.entries(data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(' | ');
};
const formatMoney = (value) => `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const buildCsv = (rows, filename) => {
  const header = 'Section,Line,Amount\n';
  const body = rows.map((row) => [row.section, row.label, row.amount].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([header + body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

function StatementSection({ title, rows }) {
  return (
    <Card title={title} style={{ marginBottom: 16 }}>
      <div style={{ display: 'grid', gap: 10 }}>
        {rows.map((row) => (
          <div key={`${title}-${row.label}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, paddingBottom: 10, borderBottom: '1px solid var(--border-color-default)' }}>
            <span style={{ color: 'var(--color-midnight)' }}>{row.label}</span>
            <span style={{ fontFamily: 'monospace', fontWeight: row.emphasis ? 700 : 500 }}>{formatMoney(row.amount)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default function Statements() {
  const navigate = useNavigate();
  const location = useLocation();
  const { filters } = useFilters();
  const [selected, setSelected] = useState('income');
  const [entities, setEntities] = useState([]);
  const [entityId, setEntityId] = useState('');
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (location.pathname.endsWith('/create')) {
      navigate('/app/reporting/statements', { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    async function loadEntities() {
      try {
        const response = await entitiesAPI.getAll();
        const entityList = parseList(response);
        setEntities(entityList);
        setEntityId(String(filters.entity !== 'all' ? filters.entity : entityList[0]?.id || ''));
      } catch (requestError) {
        setError(formatError(requestError, 'Failed to load entities.'));
      }
    }
    loadEntities();
  }, [filters.entity]);

  const loadStatement = useCallback(async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      let response;
      if (selected === 'income') {
        response = await financialStatementsAPI.incomeStatement({ entity_id: entityId, start_date: filters.dateFrom, end_date: filters.dateTo });
      } else if (selected === 'balance') {
        response = await financialStatementsAPI.balanceSheet({ entity_id: entityId, as_of_date: filters.dateTo });
      } else {
        response = await financialStatementsAPI.cashFlow({ entity_id: entityId, start_date: filters.dateFrom, end_date: filters.dateTo });
      }
      setStatement(response.data);
      setError('');
    } catch (requestError) {
      setStatement(null);
      setError(formatError(requestError, 'Failed to load statement.'));
    }
    setLoading(false);
  }, [entityId, filters.dateFrom, filters.dateTo, selected]);

  useEffect(() => { loadStatement(); }, [loadStatement]);

  const csvRows = useMemo(() => {
    if (!statement) return [];
    if (selected === 'income') {
      return [
        { section: 'Revenue', label: 'Operating Revenue', amount: statement.revenue?.operating_revenue || 0 },
        { section: 'Revenue', label: 'Accrual Revenue', amount: statement.revenue?.accrual_revenue || 0 },
        { section: 'Revenue', label: 'Total Revenue', amount: statement.revenue?.total_revenue || 0 },
        { section: 'Expenses', label: 'Operating Expenses', amount: statement.expenses?.operating_expenses || 0 },
        { section: 'Expenses', label: 'Depreciation', amount: statement.expenses?.depreciation_expense || 0 },
        { section: 'Expenses', label: 'Accrual Expenses', amount: statement.expenses?.accrual_expenses || 0 },
        { section: 'Net Income', label: 'Net Income', amount: statement.net_income || 0 },
      ];
    }
    if (selected === 'balance') {
      const currentAssets = Object.entries(statement.assets?.current_assets || {}).map(([label, amount]) => ({ section: 'Current Assets', label, amount }));
      const fixedAssets = Object.entries(statement.assets?.fixed_assets || {}).map(([label, amount]) => ({ section: 'Fixed Assets', label, amount }));
      return [
        ...currentAssets,
        { section: 'Current Assets', label: 'Total Current Assets', amount: statement.assets?.total_current_assets || 0 },
        ...fixedAssets,
        { section: 'Fixed Assets', label: 'Total Fixed Assets', amount: statement.assets?.total_fixed_assets || 0 },
        { section: 'Balance Sheet', label: 'Total Assets', amount: statement.assets?.total_assets || 0 },
        { section: 'Liabilities', label: 'Total Liabilities', amount: statement.liabilities?.total_liabilities || 0 },
        { section: 'Equity', label: 'Total Equity', amount: statement.equity?.total_equity || 0 },
      ];
    }
    return [
      { section: 'Operating Activities', label: 'Net Cash from Operations', amount: statement.operating_activities?.net_cash_from_operations || 0 },
      { section: 'Investing Activities', label: 'Fixed Asset Purchases', amount: statement.investing_activities?.fixed_asset_purchases || 0 },
      { section: 'Investing Activities', label: 'Net Cash from Investing', amount: statement.investing_activities?.net_cash_from_investing || 0 },
      { section: 'Financing Activities', label: 'Net Cash from Financing', amount: statement.financing_activities?.net_cash_from_financing || 0 },
      { section: 'Cash Flow', label: 'Net Change in Cash', amount: statement.net_change_in_cash || 0 },
    ];
  }, [selected, statement]);

  const entityLabel = entities.find((entity) => String(entity.id) === String(entityId))?.name || 'No entity selected';

  return (
    <div className="module-page">
      <PageHeader title="Financial Statements" subtitle={`Generated from live entity transactions · ${filters.currency}`} actions={<Button variant="secondary" size="small" onClick={() => buildCsv(csvRows, `${selected}-statement.csv`)}>Export CSV</Button>} />

      {error ? <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div> : null}

      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 12, alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Entity</label>
            <select value={entityId} onChange={(event) => setEntityId(event.target.value)} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
              {entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
            </select>
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-silver-dark)' }}>Period: {filters.dateFrom} to {filters.dateTo}</div>
          <div style={{ fontSize: 13, color: 'var(--color-silver-dark)' }}>Entity: {entityLabel}</div>
        </div>
      </Card>

      <div className="statement-tabs">
        {STATEMENTS.map((statementOption) => <button key={statementOption.id} type="button" className={`stmt-tab${selected === statementOption.id ? ' active' : ''}`} onClick={() => setSelected(statementOption.id)}>{statementOption.title}</button>)}
      </div>

      {loading ? <Card><div style={{ textAlign: 'center', padding: 32, color: 'var(--color-silver-dark)' }}>Loading statement...</div></Card> : null}

      {!loading && statement && selected === 'income' ? <><StatementSection title="Revenue" rows={[{ label: 'Operating Revenue', amount: statement.revenue?.operating_revenue || 0 }, { label: 'Accrual Revenue', amount: statement.revenue?.accrual_revenue || 0 }, { label: 'Total Revenue', amount: statement.revenue?.total_revenue || 0, emphasis: true }]} /><StatementSection title="Expenses" rows={[{ label: 'Operating Expenses', amount: statement.expenses?.operating_expenses || 0 }, { label: 'Depreciation Expense', amount: statement.expenses?.depreciation_expense || 0 }, { label: 'Accrual Expenses', amount: statement.expenses?.accrual_expenses || 0 }, { label: 'Total Expenses', amount: statement.expenses?.total_expenses || 0, emphasis: true }]} /><StatementSection title="Net Income" rows={[{ label: 'Net Income', amount: statement.net_income || 0, emphasis: true }]} /></> : null}

      {!loading && statement && selected === 'balance' ? <><StatementSection title="Current Assets" rows={[...Object.entries(statement.assets?.current_assets || {}).map(([label, amount]) => ({ label, amount })), { label: 'Total Current Assets', amount: statement.assets?.total_current_assets || 0, emphasis: true }]} /><StatementSection title="Fixed Assets" rows={[...Object.entries(statement.assets?.fixed_assets || {}).map(([label, amount]) => ({ label, amount })), { label: 'Total Fixed Assets', amount: statement.assets?.total_fixed_assets || 0, emphasis: true }, { label: 'Total Assets', amount: statement.assets?.total_assets || 0, emphasis: true }]} /><StatementSection title="Liabilities & Equity" rows={[{ label: 'Total Liabilities', amount: statement.liabilities?.total_liabilities || 0 }, { label: 'Total Equity', amount: statement.equity?.total_equity || 0, emphasis: true }]} /></> : null}

      {!loading && statement && selected === 'cashflow' ? <><StatementSection title="Operating Activities" rows={[{ label: 'Net Cash from Operations', amount: statement.operating_activities?.net_cash_from_operations || 0, emphasis: true }]} /><StatementSection title="Investing Activities" rows={[{ label: 'Fixed Asset Purchases', amount: statement.investing_activities?.fixed_asset_purchases || 0 }, { label: 'Net Cash from Investing', amount: statement.investing_activities?.net_cash_from_investing || 0, emphasis: true }]} /><StatementSection title="Financing Activities" rows={[{ label: 'Net Cash from Financing', amount: statement.financing_activities?.net_cash_from_financing || 0 }, { label: 'Net Change in Cash', amount: statement.net_change_in_cash || 0, emphasis: true }]} /></> : null}
    </div>
  );
}
