import React from 'react';
import { act } from 'react';
import ReactDOM from 'react-dom/client';

import Expenses from './Expenses';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock('../../context/FinanceContext', () => {
  const React = require('react');

  const manualExpenses = [
    {
      id: 'manual-1',
      description: 'Office lunch',
      amount: 60,
      category: 'Meals',
      date: '2026-03-05',
      sourceType: 'manual',
      sourceLabel: 'Manual',
      canDelete: true,
    },
  ];

  const importedExpenses = [
    {
      id: 'bank-1',
      description: 'AWS Subscription',
      amount: 150,
      category: 'Software',
      date: '2026-03-06',
      sourceType: 'bank_feed',
      sourceLabel: 'Bank Feed',
      canDelete: false,
    },
  ];

  const filterExpenses = (items, sourceFilter) => {
    if (sourceFilter === 'all') {
      return items;
    }

    return items.filter((item) => {
      const normalizedSource = item.sourceType === 'bank_feed' ? 'imported' : 'manual';
      return normalizedSource === sourceFilter;
    });
  };

  const calculationEngine = {
    calculateTotalExpenses: (items = []) => items.reduce((sum, item) => sum + Number(item.amount || 0), 0),
  };

  return {
    useFinance: () => {
      const [expenseSourceFilter, setExpenseSourceFilter] = React.useState('all');
      const allExpenses = [...manualExpenses, ...importedExpenses];
      const expenses = filterExpenses(allExpenses, expenseSourceFilter);

      return {
        expenses,
        addExpense: jest.fn(),
        deleteExpense: jest.fn(),
        bankFeedExpenses: importedExpenses,
        calculationEngine,
        monthlySummary: null,
        financialSummary: {
          expenses: {
            total: calculationEngine.calculateTotalExpenses(expenses),
          },
        },
        validationResults: {
          warnings: [],
          warningDetails: [],
        },
        budgets: [],
        expenseSourceFilter,
        setExpenseSourceFilter,
      };
    },
  };
});

describe('Expenses source filter', () => {
  let container;
  let root;

  const clickButton = (label) => {
    const button = Array.from(container.querySelectorAll('button')).find(
      (item) => item.textContent === label
    );
    if (!button) {
      throw new Error(`Button not found: ${label}`);
    }

    act(() => {
      button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    });
  };

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = ReactDOM.createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    container = null;
  });

  it('switches between all, manual-only, and imported-only transactions', () => {
    act(() => {
      root.render(<Expenses />);
    });

    expect(container.textContent).toContain('Total Expenses: $210.00');
    expect(container.textContent).toContain('Office lunch');
    expect(container.textContent).toContain('AWS Subscription');

    clickButton('Manual Only');
    expect(container.textContent).toContain('Total Expenses: $60.00');
    expect(container.textContent).toContain('Office lunch');
    expect(container.textContent).not.toContain('AWS Subscription');

    clickButton('Imported Only');
    expect(container.textContent).toContain('Total Expenses: $150.00');
    expect(container.textContent).toContain('AWS Subscription');
    expect(container.textContent).not.toContain('Office lunch');
    expect(container.textContent).toContain('Managed by bank feed');

    clickButton('All Sources');
    expect(container.textContent).toContain('Total Expenses: $210.00');
    expect(container.textContent).toContain('Office lunch');
    expect(container.textContent).toContain('AWS Subscription');
  });
});