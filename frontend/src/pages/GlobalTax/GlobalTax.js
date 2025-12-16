import React, { useEffect, useState } from 'react';
import { taxAPI } from '../../services/api';
import './GlobalTax.css';
import localCountries from '../../data/tax/countries.json';

const GlobalTax = () => {
  const [countries, setCountries] = useState([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(null);
  const [regionFilter, setRegionFilter] = useState('');

  useEffect(() => {
    // Try API first; fall back to local JSON if backend not available
    taxAPI.list()
      .then(res => setCountries(res.data || localCountries))
      .catch(() => setCountries(localCountries));
  }, []);

  const regions = Array.from(new Set(countries.map(c => c.region).filter(Boolean)));

  // Countries sorted by name for dropdown
  const sortedCountries = [...countries].sort((a, b) => a.name.localeCompare(b.name));

  const filtered = countries
    .filter(c => (regionFilter ? c.region === regionFilter : true))
    .filter(c => c.name.toLowerCase().includes(query.toLowerCase()) || c.code.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="global-tax-page">
      <div className="page-header">
        <h1>Global Tax Directory</h1>
        <p>Explore tax authorities, payment portals and summaries for 200+ jurisdictions — no login required</p>
      </div>
      <div className="tax-controls">
        <select
          className="tax-country-select"
          value={selected?.code || ''}
          onChange={(e) => {
            const code = e.target.value;
            const c = countries.find(x => x.code === code);
            if (c) setSelected(c);
          }}
        >
          <option value="">Select a country...</option>
          {sortedCountries.map(c => (
            <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
          ))}
        </select>

        <input
          className="tax-search-input"
          placeholder="Search country or code (e.g., United States, US)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)} className="tax-region-select">
          <option value="">All Regions</option>
          {regions.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="tax-grid">
        <div className="tax-list">
          {filtered.map(c => (
            <div key={c.code} className={`tax-list-item ${selected?.code === c.code ? 'active' : ''}`} onClick={() => setSelected(c)}>
              <div className="country-name">{c.name}</div>
              <div className="country-code">{c.code}</div>
            </div>
          ))}
          {filtered.length === 0 && <div className="empty">No countries found</div>}
        </div>

        <div className="tax-panel">
          {!selected ? (
            <div className="empty-panel">Select a country to view tax details</div>
          ) : (
            <div className="country-details">
              <h2>{selected.name} <span className="code">{selected.code}</span></h2>
              <div className="detail-row"><strong>Region:</strong> <span>{selected.region || '—'}</span></div>
              <div className="detail-row"><strong>Tax Authority:</strong> <a href={selected.tax_authority?.website || '#'} target="_blank" rel="noreferrer">{selected.tax_authority?.name || '—'}</a></div>
              <div className="detail-row"><strong>Payment Portal:</strong> {selected.tax_authority?.payment_portal ? (<a href={selected.tax_authority.payment_portal} target="_blank" rel="noreferrer">Open Portal</a>) : 'Not available'}</div>

              <div className="links">
                <h4>Summaries & Legislation</h4>
                <ul>
                  {selected.links?.corporate_tax_summary && <li><a href={selected.links.corporate_tax_summary} target="_blank" rel="noreferrer">Corporate tax summary</a></li>}
                  {selected.links?.personal_income_tax_summary && <li><a href={selected.links.personal_income_tax_summary} target="_blank" rel="noreferrer">Personal income tax summary</a></li>}
                  {selected.links?.vat_or_indirect_tax_summary && <li><a href={selected.links.vat_or_indirect_tax_summary} target="_blank" rel="noreferrer">VAT / GST / Indirect tax</a></li>}
                </ul>
              </div>

              <div className="tasks">
                <h4>Available Actions</h4>
                <div className="tasks-row">
                  {selected.supported_tasks?.includes('open_tax_payment_portal') && (
                    <a className="task-btn" href={selected.tax_authority?.payment_portal} target="_blank" rel="noreferrer">Pay Tax Online</a>
                  )}
                  {selected.supported_tasks?.includes('basic_tax_estimator') && (
                    <button className="task-btn" onClick={() => alert('Basic estimator coming soon for ' + selected.name)}>Estimate Tax</button>
                  )}
                  {selected.supported_tasks?.includes('country_comparison') && (
                    <button className="task-btn" onClick={() => alert('Compare feature coming soon')}>Compare Countries</button>
                  )}
                  {selected.supported_tasks?.includes('corporate_vs_personal_compare') && (
                    <button className="task-btn" onClick={() => alert('Corporate vs Personal comparison coming soon')}>Corporate vs Personal</button>
                  )}
                </div>
              </div>

              <div className="references">
                <h4>Global References</h4>
                <ul>
                  {selected.links?.global_references?.map((r, i) => (
                    <li key={i}><a href={r.url} target="_blank" rel="noreferrer">{r.label}</a></li>
                  ))}
                </ul>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GlobalTax;
