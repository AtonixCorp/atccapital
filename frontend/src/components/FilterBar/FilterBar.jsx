import React from 'react';
import { useFilters } from '../../context/FilterContext';
import { useEnterprise } from '../../context/EnterpriseContext';
import './FilterBar.css';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'SGD', 'HKD', 'AED'];
const ENVIRONMENTS = ['production', 'staging', 'sandbox'];

export default function FilterBar() {
  const { filters, setFilter, resetFilters } = useFilters();
  const { entities, currentOrganization } = useEnterprise();

  return (
    <div className="filter-bar" role="region" aria-label="Global filters">
      <div className="filter-bar-context">
        <span className="filter-context-env">{filters.environment}</span>
        <span className="filter-context-sep">/</span>
        <span className="filter-context-org">{currentOrganization?.name || 'No Organization'}</span>
      </div>

      <div className="filter-controls">
        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-from">From</label>
          <input
            id="filter-from"
            type="date"
            className="filter-input"
            value={filters.dateFrom}
            onChange={(e) => setFilter('dateFrom', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-to">To</label>
          <input
            id="filter-to"
            type="date"
            className="filter-input"
            value={filters.dateTo}
            onChange={(e) => setFilter('dateTo', e.target.value)}
          />
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-entity">Entity</label>
          <select
            id="filter-entity"
            className="filter-select"
            value={filters.entity}
            onChange={(e) => setFilter('entity', e.target.value)}
          >
            <option value="all">All Entities</option>
            {(entities || []).map((ent) => (
              <option key={ent.id} value={String(ent.id)}>{ent.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-currency">Currency</label>
          <select
            id="filter-currency"
            className="filter-select"
            value={filters.currency}
            onChange={(e) => setFilter('currency', e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-label" htmlFor="filter-env">Environment</label>
          <select
            id="filter-env"
            className="filter-select"
            value={filters.environment}
            onChange={(e) => setFilter('environment', e.target.value)}
          >
            {ENVIRONMENTS.map((env) => (
              <option key={env} value={env}>{env.charAt(0).toUpperCase() + env.slice(1)}</option>
            ))}
          </select>
        </div>

        <button className="filter-reset-btn" onClick={resetFilters} type="button">
          Reset
        </button>
      </div>
    </div>
  );
}
