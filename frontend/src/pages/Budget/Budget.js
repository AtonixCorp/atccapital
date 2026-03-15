import React, { useMemo, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';

const Budget = () => {
  const { t, language } = useLanguage();
  const {
    budgets,
    addBudget,
    deleteBudget,
    expenses,
    manualExpenses,
    bankFeedExpenses,
    financialSummary,
    calculationEngine,
    validationResults,
    expenseSourceFilter,
    setExpenseSourceFilter,
  } = useFinance();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    limit: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.category && formData.limit) {
      await addBudget({
        category: formData.category,
        limit: parseFloat(formData.limit)
      });
      setFormData({
        category: '',
        limit: ''
      });
      setShowForm(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Calculate spent amount per category from expenses using calculation engine
  const calculateSpent = (category) => {
    const categoryExpenses = expenses.filter(exp => exp.category === category);
    return calculationEngine.calculateTotalExpenses(categoryExpenses);
  };

  const getStatusColor = (percentage) => {
    if (percentage >= 90) return 'var(--color-error)';
    if (percentage >= 70) return 'var(--color-warning)';
    return 'var(--color-success)';
  };

  const spendingBreakdown = useMemo(() => {
    const manualTotal = calculationEngine.calculateTotalExpenses(Array.isArray(manualExpenses) ? manualExpenses : []);
    const importedTotal = calculationEngine.calculateTotalExpenses(Array.isArray(bankFeedExpenses) ? bankFeedExpenses : []);
    const combinedTotal = calculationEngine.calculateTotalExpenses(Array.isArray(expenses) ? expenses : []);
    return {
      manualTotal,
      importedTotal,
      combinedTotal,
      manualCount: Array.isArray(manualExpenses) ? manualExpenses.length : 0,
      importedCount: Array.isArray(bankFeedExpenses) ? bankFeedExpenses.length : 0,
    };
  }, [bankFeedExpenses, calculationEngine, expenses, manualExpenses]);

  const categorySourceBreakdown = useMemo(() => {
    return budgets.map((budget) => {
      const manualSpent = calculationEngine.calculateTotalExpenses(
        (Array.isArray(manualExpenses) ? manualExpenses : []).filter((expense) => expense.category === budget.category)
      );
      const importedSpent = calculationEngine.calculateTotalExpenses(
        (Array.isArray(bankFeedExpenses) ? bankFeedExpenses : []).filter((expense) => expense.category === budget.category)
      );
      return {
        category: budget.category,
        manualSpent,
        importedSpent,
      };
    });
  }, [bankFeedExpenses, budgets, calculationEngine, manualExpenses]);

  return (
    <div className="page-container" key={language}>
      <div className="page-header">
        <h1 className="page-title">Budget Management</h1>
        <div className="header-actions">
          <div className="view-toggle">
            <button
              className={`toggle-btn ${expenseSourceFilter === 'all' ? 'active' : ''}`}
              onClick={() => setExpenseSourceFilter('all')}
            >All Sources
            </button>
            <button
              className={`toggle-btn ${expenseSourceFilter === 'manual' ? 'active' : ''}`}
              onClick={() => setExpenseSourceFilter('manual')}
            >Manual Only
            </button>
            <button
              className={`toggle-btn ${expenseSourceFilter === 'imported' ? 'active' : ''}`}
              onClick={() => setExpenseSourceFilter('imported')}
            >Imported Only
            </button>
          </div>
          <button className="btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Budget'}
          </button>
        </div>
      </div>

      {Array.isArray(validationResults?.warningDetails) && validationResults.warningDetails.length > 0 && (
        <div className="card budget-summary-card" style={{ marginBottom: 24 }}>
          <h2>Budget Alerts by Source</h2>
          <div className="validation-warnings">
            {validationResults.warningDetails.slice(0, 4).map((warning) => (
              <div key={warning.category} className="warning-message">
                {warning.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="card form-card">
          <h2>Create New Budget</h2>
          <form onSubmit={handleSubmit} className="budget-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  placeholder="e.g., Food, Transportation"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="limit">Budget Limit ($)</label>
                <input
                  type="number"
                  id="limit"
                  name="limit"
                  value={formData.limit}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
            </div>

            <button type="submit" className="btn-primary">Create Budget</button>
          </form>
        </div>
      )}

      {/* Budget Summary from Calculation Engine */}
      {financialSummary && (
        <div className="card budget-summary-card">
          <h2>Budget Overview</h2>
          <div className="summary-stats">
            <div className="stat-box">
              <label>Total Budget</label>
              <span className="stat-value">${financialSummary.budget.total.toFixed(2)}</span>
            </div>
            <div className="stat-box">
              <label>Total Spent</label>
              <span className="stat-value spent">${financialSummary.expenses.total.toFixed(2)}</span>
            </div>
            <div className="stat-box">
              <label>Available</label>
              <span className="stat-value remaining">
                ${calculationEngine.subtract(financialSummary.budget.total, financialSummary.expenses.total).toFixed(2)}
              </span>
            </div>
          </div>
          <div className="summary-stats" style={{ marginTop: 16 }}>
            <div className="stat-box">
              <label>Manual Spend</label>
              <span className="stat-value">${spendingBreakdown.manualTotal.toFixed(2)}</span>
            </div>
            <div className="stat-box">
              <label>Imported Bank Feed Spend</label>
              <span className="stat-value spent">${spendingBreakdown.importedTotal.toFixed(2)}</span>
            </div>
            <div className="stat-box">
              <label>Imported Transactions</label>
              <span className="stat-value">{spendingBreakdown.importedCount}</span>
            </div>
          </div>
        </div>
      )}

      {budgets.length > 0 && (
        <div className="card budget-summary-card" style={{ marginBottom: 24 }}>
          <h2>Imported vs Manual by Budget Category</h2>
          <div className="summary-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {categorySourceBreakdown.map((item) => (
              <div key={item.category} className="stat-box" style={{ textAlign: 'left' }}>
                <label>{item.category}</label>
                <div style={{ marginTop: 8, fontSize: 14 }}>
                  <div>Manual: ${item.manualSpent.toFixed(2)}</div>
                  <div>Imported: ${item.importedSpent.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="budgets-grid">
        {budgets.length > 0 ? (
          budgets.map((budget) => {
            // Use calculation engine for accurate spent calculation
            const spent = calculateSpent(budget.category);
            const budgetLimit = budget.limit || budget.amount;
            const utilization = calculationEngine.calculateBudgetUtilization(budgetLimit, spent);
            const percentage = utilization.percentageUsed;
            const statusColor = getStatusColor(percentage);
            const remaining = utilization.remaining;
            const sourceBreakdown = categorySourceBreakdown.find((item) => item.category === budget.category) || {
              manualSpent: 0,
              importedSpent: 0,
            };
            const sourceAlert = Array.isArray(validationResults?.warningDetails)
              ? validationResults.warningDetails.find((warning) => warning.category === budget.category)
              : null;

            return (
              <div key={budget.id} className="card budget-card">
                <div className="budget-header">
                  <h3>{budget.category}</h3>
                  <button
                    className="btn-danger btn-small"
                    onClick={() => deleteBudget(budget.id)}
                  >Delete
                  </button>
                </div>

                <div className="budget-amounts">
                  <div className="budget-stat">
                    <span className="stat-label">Spent</span>
                    <span className="stat-value spent">${utilization.spent.toFixed(2)}</span>
                  </div>
                  <div className="budget-stat">
                    <span className="stat-label">Budget</span>
                    <span className="stat-value">${utilization.budgeted.toFixed(2)}</span>
                  </div>
                  <div className="budget-stat">
                    <span className="stat-label">Remaining</span>
                    <span className={`stat-value ${utilization.isOverBudget ? 'over-budget' : 'remaining'}`}>
                      ${Math.abs(remaining).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="budget-amounts" style={{ marginTop: 8 }}>
                  <div className="budget-stat">
                    <span className="stat-label">Manual</span>
                    <span className="stat-value">${sourceBreakdown.manualSpent.toFixed(2)}</span>
                  </div>
                  <div className="budget-stat">
                    <span className="stat-label">Imported</span>
                    <span className="stat-value spent">${sourceBreakdown.importedSpent.toFixed(2)}</span>
                  </div>
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: statusColor
                    }}
                  >
                    {percentage > 10 && (
                      <span className="progress-text">{percentage.toFixed(0)}%</span>
                    )}
                  </div>
                </div>

                {utilization.isOverBudget && (
                  <div className="budget-warning">
                     {t('labels.overBudget')} ${Math.abs(remaining).toFixed(2)}! {sourceAlert?.dominantSource ? `${sourceAlert.dominantSource.label} are driving most of the overage.` : ''}
                  </div>
                )}
                {!utilization.isOverBudget && percentage >= 90 && (
                  <div className="budget-warning">
                     {t('labels.approachingLimit')}! {sourceAlert?.dominantSource ? `${sourceAlert.dominantSource.label} are the main contributor.` : ''}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="card empty-state">
            <p>No budgets created yet. Start by adding a new budget!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Budget;
