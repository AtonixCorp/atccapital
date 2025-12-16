import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useEnterprise } from '../../context/EnterpriseContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts';
import { FaGlobe, FaArrowLeft, FaChartBar, FaMoneyBillWave, FaHandHoldingUsd, FaWallet } from 'react-icons/fa';
import './EntityDashboard.css';

const EntityDashboard = () => {
  const { entityId } = useParams();
  const navigate = useNavigate();
  const {
    entities,
    fetchEntityExpenses,
    fetchEntityIncome,
    fetchEntityBudgets,
    hasPermission,
    PERMISSIONS
  } = useEnterprise();

  const [entity, setEntity] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [income, setIncome] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const loadEntityData = async () => {
      if (!entityId) return;

      // Find entity
      const foundEntity = entities.find(e => e.id.toString() === entityId);
      if (foundEntity) {
        setEntity(foundEntity);

        // Load entity-specific financial data
        const [entityExpenses, entityIncome, entityBudgets] = await Promise.all([
          fetchEntityExpenses(entityId),
          fetchEntityIncome(entityId),
          fetchEntityBudgets(entityId)
        ]);

        setExpenses(entityExpenses);
        setIncome(entityIncome);
        setBudgets(entityBudgets);
      }

      setLoading(false);
    };

    loadEntityData();
  }, [entityId, entities, fetchEntityExpenses, fetchEntityIncome, fetchEntityBudgets]);

  if (!hasPermission(PERMISSIONS.VIEW_ENTITIES)) {
    return <div className="permission-denied">You don't have permission to view entity dashboards.</div>;
  }

  if (loading) {
    return <div className="loading">Loading entity dashboard...</div>;
  }

  if (!entity) {
    return <div className="error">Entity not found.</div>;
  }

  // Calculate financial metrics
  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  const totalIncome = income.reduce((sum, inc) => sum + parseFloat(inc.amount), 0);
  const netIncome = totalIncome - totalExpenses;

  // Category breakdown for expenses
  const expenseCategories = expenses.reduce((acc, exp) => {
    const existing = acc.find(item => item.category === exp.category);
    if (existing) {
      existing.amount += parseFloat(exp.amount);
    } else {
      acc.push({ category: exp.category, amount: parseFloat(exp.amount) });
    }
    return acc;
  }, []);

  // Budget comparison
  const budgetComparison = budgets.map(budget => {
    const spent = expenses
      .filter(exp => exp.category === budget.category)
      .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    return {
      category: budget.category,
      budget: parseFloat(budget.limit),
      spent: spent,
      remaining: parseFloat(budget.limit) - spent
    };
  });

  const COLORS = ['#e74c3c', '#3498db', '#9b59b6', '#f39c12', '#2ecc71'];

  return (
    <div className="entity-dashboard">
      <div className="dashboard-header">
        <div className="entity-info">
          <h1>{entity.name}</h1>
          <div className="entity-meta">
            <span className="country"><FaGlobe /> {entity.country}</span>
            <span className="type">{entity.entity_type}</span>
            <span className={`status ${entity.status}`}>{entity.status}</span>
          </div>
        </div>
        <button className="btn-back" onClick={() => navigate('/app/enterprise/entities')}>
          ← Back to Entities
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          Expenses ({expenses.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'income' ? 'active' : ''}`}
          onClick={() => setActiveTab('income')}
        >
          Income ({income.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'budgets' ? 'active' : ''}`}
          onClick={() => setActiveTab('budgets')}
        >
          Budgets ({budgets.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          {/* Financial Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card income">
              <h3>Total Income</h3>
              <p className="amount">${totalIncome.toFixed(2)}</p>
              <p className="subtitle">{income.length} transactions</p>
            </div>
            <div className="summary-card expenses">
              <h3>Total Expenses</h3>
              <p className="amount">${totalExpenses.toFixed(2)}</p>
              <p className="subtitle">{expenses.length} transactions</p>
            </div>
            <div className={`summary-card net ${netIncome >= 0 ? 'positive' : 'negative'}`}>
              <h3>Net Income</h3>
              <p className="amount">${netIncome.toFixed(2)}</p>
              <p className="subtitle">{((netIncome / totalIncome) * 100).toFixed(1)}% margin</p>
            </div>
          </div>

          {/* Charts */}
          <div className="charts-grid">
            {/* Expense Categories */}
            <div className="chart-card">
              <h3>Expense Categories</h3>
              {expenseCategories.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={expenseCategories}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ category, percent }) => `${category} ${(percent * 100).toFixed(0)}%`}
                    >
                      {expenseCategories.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="no-data">No expense data available</p>
              )}
            </div>

            {/* Budget vs Actual */}
            <div className="chart-card">
              <h3>Budget vs Actual</h3>
              {budgetComparison.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={budgetComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                    <Legend />
                    <Bar dataKey="budget" fill="#2ecc71" name="Budget" />
                    <Bar dataKey="spent" fill="#e74c3c" name="Spent" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="no-data">No budget data available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <div className="tab-content">
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map(expense => (
                  <tr key={expense.id}>
                    <td>{new Date(expense.date).toLocaleDateString()}</td>
                    <td>{expense.description}</td>
                    <td>{expense.category}</td>
                    <td className="amount negative">${parseFloat(expense.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {expenses.length === 0 && <p className="no-data">No expenses recorded for this entity</p>}
          </div>
        </div>
      )}

      {/* Income Tab */}
      {activeTab === 'income' && (
        <div className="tab-content">
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Source</th>
                  <th>Type</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                {income.map(inc => (
                  <tr key={inc.id}>
                    <td>{new Date(inc.date).toLocaleDateString()}</td>
                    <td>{inc.source}</td>
                    <td>{inc.income_type}</td>
                    <td className="amount positive">${parseFloat(inc.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {income.length === 0 && <p className="no-data">No income recorded for this entity</p>}
          </div>
        </div>
      )}

      {/* Budgets Tab */}
      {activeTab === 'budgets' && (
        <div className="tab-content">
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Budget Limit</th>
                  <th>Spent</th>
                  <th>Remaining</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map(budget => {
                  const spent = expenses
                    .filter(exp => exp.category === budget.category)
                    .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
                  const remaining = parseFloat(budget.limit) - spent;
                  const status = remaining >= 0 ? 'under' : 'over';

                  return (
                    <tr key={budget.id}>
                      <td>{budget.category}</td>
                      <td>${parseFloat(budget.limit).toFixed(2)}</td>
                      <td>${spent.toFixed(2)}</td>
                      <td className={remaining >= 0 ? 'positive' : 'negative'}>
                        ${remaining.toFixed(2)}
                      </td>
                      <td>
                        <span className={`status-badge ${status}`}>
                          {status === 'under' ? '✅ Under' : '⚠️ Over'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {budgets.length === 0 && <p className="no-data">No budgets set for this entity</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default EntityDashboard;