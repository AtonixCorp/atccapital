import React, { useState, useCallback } from 'react';
import { PageHeader, Card, Button } from '../../components/ui';
import { useFilters } from '../../context/FilterContext';

const STATEMENTS = [
  { id: 'income',   title: 'Income Statement',          subtitle: 'P&L for the period' },
  { id: 'balance',  title: 'Balance Sheet',              subtitle: 'Assets, liabilities, equity' },
  { id: 'cashflow', title: 'Cash Flow Statement',        subtitle: 'Operating, investing, financing' },
];

/* ── Mock data ── */
const mockPL = [
  { category: 'Revenue',    account: 'Service Revenue',     current:  284000, ytd:  1420000 },
  { category: 'Revenue',    account: 'Product Revenue',     current:   62000, ytd:   310000 },
  { category: 'COGS',       account: 'Cost of Services',    current:  -88000, ytd:  -440000 },
  { category: 'Expenses',   account: 'Salaries & Wages',    current:  -85000, ytd:  -425000 },
  { category: 'Expenses',   account: 'Rent & Utilities',    current:  -12800, ytd:   -64000 },
  { category: 'Expenses',   account: 'Technology & SaaS',   current:   -8200, ytd:   -41000 },
  { category: 'Net Income', account: 'Net Income',          current:  152000, ytd:   760000, isBold: true },
];

const mockBS = [
  { category: 'Current Assets',       account: 'Cash & Equivalents',      current:  480000 },
  { category: 'Current Assets',       account: 'Accounts Receivable',     current:  126000 },
  { category: 'Current Assets',       account: 'Prepaid Expenses',        current:   18400 },
  { category: 'Non-Current Assets',   account: 'Property & Equipment',    current:  240000 },
  { category: 'Non-Current Assets',   account: 'Intangible Assets',       current:   55000 },
  { category: 'Total Assets',         account: 'Total Assets',            current:  919400, isBold: true },
  { category: 'Current Liabilities',  account: 'Accounts Payable',        current:  -62000 },
  { category: 'Current Liabilities',  account: 'Accrued Liabilities',     current:  -28500 },
  { category: 'Non-Current Liabilities', account: 'Long-Term Debt',       current: -180000 },
  { category: 'Equity',               account: "Owners' Equity",          current:  -450000 },
  { category: 'Equity',               account: 'Retained Earnings',       current:  -198900 },
  { category: 'Total Liabilities & Equity', account: 'Total L&E',         current:  -919400, isBold: true },
];

const mockCF = [
  { category: 'Operating Activities',  account: 'Net Income',                     current:  152000 },
  { category: 'Operating Activities',  account: 'Depreciation & Amortisation',    current:   18000 },
  { category: 'Operating Activities',  account: 'Change in Accounts Receivable',  current:  -14000 },
  { category: 'Operating Activities',  account: 'Change in Accounts Payable',     current:    9000 },
  { category: 'Investing Activities',  account: 'Purchase of Equipment',          current:  -45000 },
  { category: 'Investing Activities',  account: 'Software Development Costs',     current:  -22000 },
  { category: 'Financing Activities',  account: 'Loan Repayments',                current:  -30000 },
  { category: 'Net Cash Flow',         account: 'Net Increase in Cash',           current:   68000, isBold: true },
];

const fmtFull = (n) => {
  if (n === undefined || n === null) return '—';
  const abs = Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 0 });
  return n < 0 ? `($${abs})` : `$${abs}`;
};

/* ── CSV export helper ── */
const exportCSV = (rows, filename) => {
  const header = 'Category,Account,Current Period,YTD\n';
  const body = rows
    .map((r) => [
      `"${r.category}"`,
      `"${r.account}"`,
      `"${fmtFull(r.current)}"`,
      r.ytd !== undefined ? `"${fmtFull(r.ytd)}"` : '""',
    ].join(','))
    .join('\n');
  const blob = new Blob([header + body], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/* ── Statement table sub-component ── */
const StatementTable = ({ data, categories, colHeaders }) => (
  <div className="stmt-table-wrap">
    <div className="stmt-header-row">
      <span className="stmt-col-account">Account</span>
      {colHeaders.map((h) => (
        <span key={h} className="stmt-col-num">{h}</span>
      ))}
    </div>
    {categories.map((cat) => {
      const rows = data.filter((r) => r.category === cat);
      if (!rows.length) return null;
      return (
        <div key={cat} className="stmt-section">
          <div className="stmt-category">{cat}</div>
          {rows.map((r, i) => (
            <div key={i} className={`stmt-row${r.isBold ? ' bold' : ''}`}>
              <span className="stmt-col-account">{r.account}</span>
              <span className="stmt-col-num">{fmtFull(r.current)}</span>
              {r.ytd !== undefined && (
                <span className="stmt-col-num">{fmtFull(r.ytd)}</span>
              )}
            </div>
          ))}
        </div>
      );
    })}
  </div>
);

export default function Statements() {
  const [selected, setSelected] = useState('income');
  const { filters } = useFilters();

  const periodLabel = `${filters.dateFrom} — ${filters.dateTo}`;
  const entityLabel = filters.entity === 'all' ? 'All Entities' : `Entity ${filters.entity}`;

  const handleExportCSV = useCallback(() => {
    const dataMap = { income: mockPL, balance: mockBS, cashflow: mockCF };
    const nameMap = { income: 'income-statement.csv', balance: 'balance-sheet.csv', cashflow: 'cash-flow.csv' };
    exportCSV(dataMap[selected], nameMap[selected]);
  }, [selected]);

  return (
    <div className="module-page">
      <PageHeader
        title="Financial Statements"
        subtitle={`GAAP-compliant reports · ${entityLabel} · ${filters.currency}`}
        actions={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="secondary" size="small" onClick={handleExportCSV}>Export CSV</Button>
            <Button variant="secondary" size="small">Export PDF</Button>
          </div>
        }
      />

      {/* Filter context strip */}
      <div className="stmt-filter-strip">
        <span>Period: <strong>{periodLabel}</strong></span>
        <span>Entity: <strong>{entityLabel}</strong></span>
        <span>Currency: <strong>{filters.currency}</strong></span>
      </div>

      {/* Statement type tabs */}
      <div className="statement-tabs">
        {STATEMENTS.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`stmt-tab${selected === s.id ? ' active' : ''}`}
            onClick={() => setSelected(s.id)}
          >
            {s.title}
          </button>
        ))}
      </div>

      {/* Income Statement */}
      {selected === 'income' && (
        <Card>
          <StatementTable
            data={mockPL}
            categories={['Revenue', 'COGS', 'Expenses', 'Net Income']}
            colHeaders={['Current Period', 'YTD']}
          />
        </Card>
      )}

      {/* Balance Sheet */}
      {selected === 'balance' && (
        <Card>
          <StatementTable
            data={mockBS}
            categories={[
              'Current Assets', 'Non-Current Assets', 'Total Assets',
              'Current Liabilities', 'Non-Current Liabilities', 'Equity',
              'Total Liabilities & Equity',
            ]}
            colHeaders={['Balance']}
          />
        </Card>
      )}

      {/* Cash Flow */}
      {selected === 'cashflow' && (
        <Card>
          <StatementTable
            data={mockCF}
            categories={['Operating Activities', 'Investing Activities', 'Financing Activities', 'Net Cash Flow']}
            colHeaders={['Amount']}
          />
        </Card>
      )}
    </div>
  );
}
