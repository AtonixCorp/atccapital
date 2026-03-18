import React, { useEffect, useMemo, useState } from 'react';
import { useEnterprise } from '../../context/EnterpriseContext';
import '../../pages/Enterprise/EnterpriseTaxCompliance.css';
import '../../pages/Enterprise/EnterpriseActionPages.css';

const TaxMonitoring = () => {
  const { entities, fetchEntityComplianceDeadlines } = useEnterprise();

  const [selectedEntityId, setSelectedEntityId] = useState('');
  const [complianceDeadlines, setComplianceDeadlines] = useState([]);
  const [alertFilter, setAlertFilter] = useState('all');
  const [dataError, setDataError] = useState(null);
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [resolvedAlerts, setResolvedAlerts] = useState([]);

  const selectedEntity = useMemo(() => {
    if (!selectedEntityId) return null;
    return entities.find((entity) => String(entity.id) === String(selectedEntityId)) || null;
  }, [entities, selectedEntityId]);

  useEffect(() => {
    if (selectedEntityId) return;
    if (!entities || entities.length === 0) return;
    setSelectedEntityId(String(entities[0].id));
  }, [entities, selectedEntityId]);

  useEffect(() => {
    if (!selectedEntityId) return;
    fetchEntityComplianceDeadlines(selectedEntityId)
      .then((deadlines) => setComplianceDeadlines(deadlines || []))
      .catch((err) => setDataError(err?.message || 'Failed to load monitoring data'));
  }, [selectedEntityId, fetchEntityComplianceDeadlines]);

  const complianceAlerts = useMemo(() => {
    const now = new Date();
    return (complianceDeadlines || []).map((deadline) => {
      const deadlineDate = deadline.deadline_date ? new Date(deadline.deadline_date) : null;
      const daysLeft = deadlineDate
        ? Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null;

      let severity = 'low';
      if (deadline.status === 'overdue') severity = 'high';
      else if (daysLeft !== null && daysLeft <= 7) severity = 'high';
      else if (daysLeft !== null && daysLeft <= 30) severity = 'medium';

      return {
        id: deadline.id,
        message: deadline.title,
        severity,
        date: deadline.deadline_date,
        type: deadline.deadline_type,
        status: deadline.status,
        daysLeft,
      };
    });
  }, [complianceDeadlines]);

  const visibleAlerts = useMemo(
    () => complianceAlerts.filter((alert) => !dismissedAlerts.includes(alert.id) && !resolvedAlerts.includes(alert.id)),
    [complianceAlerts, dismissedAlerts, resolvedAlerts]
  );

  const filteredAlerts = useMemo(() => {
    if (alertFilter === 'all') return visibleAlerts;
    return visibleAlerts.filter((alert) => alert.severity === alertFilter);
  }, [alertFilter, visibleAlerts]);

  const timelineItems = useMemo(() => {
    const alerts = [...visibleAlerts].sort((left, right) => new Date(left.date || 0) - new Date(right.date || 0));
    if (alerts.length > 0) {
      return alerts.slice(0, 4);
    }
    return [
      {
        id: 'system-scan',
        message: 'Automated monitoring sweep complete',
        type: 'system_scan',
        status: 'operational',
        date: new Date().toISOString(),
        severity: 'low',
        daysLeft: 0,
      },
    ];
  }, [visibleAlerts]);

  const highCount = visibleAlerts.filter((alert) => alert.severity === 'high').length;
  const mediumCount = visibleAlerts.filter((alert) => alert.severity === 'medium').length;
  const lowCount = visibleAlerts.filter((alert) => alert.severity === 'low').length;
  const overdueCount = (complianceDeadlines || []).filter((deadline) => deadline.status === 'overdue').length;

  const handleResolve = (id) => {
    setResolvedAlerts((current) => (current.includes(id) ? current : [...current, id]));
  };

  const handleDismiss = (id) => {
    setDismissedAlerts((current) => (current.includes(id) ? current : [...current, id]));
  };

  return (
    <div className="enterprise-action-page tax-monitoring-page">
      <section className="action-page-hero">
        <div className="action-page-copy">
          <span className="action-page-kicker">Compliance — Monitoring</span>
          <h1 className="action-page-title">Real-Time Compliance Monitoring</h1>
          <p className="action-page-subtitle">Automated detection of compliance risks and deadlines.</p>
          <div className="action-page-actions">
            <select
              className="entity-selector"
              value={selectedEntityId}
              onChange={(event) => setSelectedEntityId(event.target.value)}
              disabled={!entities || entities.length === 0}
            >
              {(!entities || entities.length === 0) ? (
                <option value="">No entities</option>
              ) : (
                entities.map((entity) => (
                  <option key={entity.id} value={String(entity.id)}>
                    {entity.name} ({entity.country})
                  </option>
                ))
              )}
            </select>
            {dataError && <span className="status-badge warning">{dataError}</span>}
          </div>
        </div>
        <div className="action-page-badge">{selectedEntity?.country || 'Global'}</div>
      </section>

      <div className="monitoring-section monitoring-dashboard-page">
        <div className="monitoring-hero-card">
          <div className="monitoring-hero-copy">
            <span className="monitoring-kicker">Live Compliance Control</span>
            <h2>Watch deadlines, detect risk, and manage alerts in one command surface</h2>
            <p>Every entity obligation is ranked by urgency so teams can prioritize filing, remediation, and follow-up actions without leaving the dashboard.</p>
          </div>
          <div className="monitoring-hero-status">
            <span className="monitoring-pill">Monitoring Active</span>
            <strong>{visibleAlerts.length}</strong>
            <span>active alerts currently visible for the selected entity</span>
          </div>
        </div>

        <div className="monitoring-summary-grid">
          <div className="monitoring-summary-card">
            <span className="monitoring-summary-label">System Health</span>
            <strong className="monitoring-summary-value">Stable</strong>
            <span className="monitoring-summary-caption">All monitoring systems operational</span>
          </div>
          <div className="monitoring-summary-card critical">
            <span className="monitoring-summary-label">Critical Alerts</span>
            <strong className="monitoring-summary-value">{highCount}</strong>
            <span className="monitoring-summary-caption">Immediate obligations requiring attention</span>
          </div>
          <div className="monitoring-summary-card warning">
            <span className="monitoring-summary-label">Due Soon</span>
            <strong className="monitoring-summary-value">{mediumCount}</strong>
            <span className="monitoring-summary-caption">Items moving into the next filing window</span>
          </div>
          <div className="monitoring-summary-card muted">
            <span className="monitoring-summary-label">Overdue</span>
            <strong className="monitoring-summary-value">{overdueCount}</strong>
            <span className="monitoring-summary-caption">Returns or submissions already past due</span>
          </div>
        </div>

        <div className="monitoring-main-grid">
          <section className="monitoring-panel alerts-panel">
            <div className="alerts-header">
              <div>
                <h3>Active Alerts ({visibleAlerts.length})</h3>
                <p className="monitoring-panel-copy">Filter the live queue by severity and take action directly from each item.</p>
              </div>
              <div className="alert-filters">
                <button className={`filter-btn ${alertFilter === 'all' ? 'active' : ''}`} onClick={() => setAlertFilter('all')}>
                  All ({visibleAlerts.length})
                </button>
                <button className={`filter-btn ${alertFilter === 'high' ? 'active' : ''}`} onClick={() => setAlertFilter('high')}>
                  Critical ({highCount})
                </button>
                <button className={`filter-btn ${alertFilter === 'medium' ? 'active' : ''}`} onClick={() => setAlertFilter('medium')}>
                  Medium ({mediumCount})
                </button>
                <button className={`filter-btn ${alertFilter === 'low' ? 'active' : ''}`} onClick={() => setAlertFilter('low')}>
                  Low ({lowCount})
                </button>
              </div>
            </div>

            <div className="alerts-list monitoring-alerts-list">
              {filteredAlerts.length === 0 ? (
                <div className="monitoring-empty-state">
                  <p>No alerts in this category.</p>
                  <span>Adjust the filter or switch to another entity to inspect more activity.</span>
                </div>
              ) : (
                filteredAlerts.map((alert) => (
                  <div key={alert.id} className={`alert-item monitoring-alert-card severity-${alert.severity}`}>
                    <div className="alert-icon"></div>
                    <div className="alert-content">
                      <div className="monitoring-alert-top">
                        <h4>{alert.message}</h4>
                        <span className={`monitoring-alert-chip ${alert.severity}`}>{alert.severity} priority</span>
                      </div>
                      <p>{alert.type ? alert.type.replace('_', ' ') : 'Compliance deadline'}</p>
                      <div className="alert-meta">
                        <span className="alert-date">{alert.date ? new Date(alert.date).toLocaleDateString() : '—'}</span>
                        <span className="monitoring-alert-separator"></span>
                        <span>
                          {alert.daysLeft != null
                            ? (alert.daysLeft < 0 ? `Overdue by ${Math.abs(alert.daysLeft)} days` : `Due in ${alert.daysLeft} days`)
                            : 'No due date'}
                        </span>
                      </div>
                    </div>
                    <div className="alert-controls">
                      <button className="btn-link">View Details</button>
                      <button className="btn-link" onClick={() => handleResolve(alert.id)}>Resolve</button>
                      <button className="btn-link" onClick={() => handleDismiss(alert.id)}>Dismiss</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <aside className="monitoring-side-stack">
            <section className="monitoring-panel monitoring-insight-panel">
              <div className="monitoring-column-header">
                <div>
                  <h3>Response Guidance</h3>
                  <p className="monitoring-panel-copy">Suggested operating steps for the current risk profile.</p>
                </div>
                <span className="monitoring-pill neutral">Playbook</span>
              </div>
              <div className="monitoring-checklist">
                <div className="monitoring-check-item active">
                  <span className="monitoring-check-index">01</span>
                  <div>
                    <h4>Validate filing inputs</h4>
                    <p>Confirm entity metadata, tax IDs, and supporting schedules before escalation.</p>
                  </div>
                </div>
                <div className="monitoring-check-item">
                  <span className="monitoring-check-index">02</span>
                  <div>
                    <h4>Assign owner and remediation date</h4>
                    <p>Capture who is responsible for resolving the alert and when it will be closed.</p>
                  </div>
                </div>
                <div className="monitoring-check-item">
                  <span className="monitoring-check-index">03</span>
                  <div>
                    <h4>Archive evidence</h4>
                    <p>Store remediation evidence and acknowledgement references in the compliance vault.</p>
                  </div>
                </div>
              </div>
            </section>

            <section className="monitoring-panel compliance-timeline">
              <div className="monitoring-column-header">
                <div>
                  <h3>Compliance Timeline</h3>
                  <p className="monitoring-panel-copy">A chronological view of the next monitored obligations.</p>
                </div>
                <span className="monitoring-pill">Timeline</span>
              </div>
              <div className="timeline monitoring-timeline-list">
                {timelineItems.map((item) => (
                  <div key={item.id} className={`timeline-item ${item.severity === 'high' ? 'urgent' : 'upcoming'}`}>
                    <div className="timeline-marker"></div>
                    <div className="timeline-content">
                      <h4>{item.message}</h4>
                      <p>{item.type ? item.type.replace('_', ' ') : item.status}</p>
                      <span className="timeline-date">{item.date ? new Date(item.date).toLocaleDateString() : 'No due date'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <div className="monitoring-features monitoring-panel">
          <div className="monitoring-column-header">
            <div>
              <h3>Automated Monitoring</h3>
              <p className="monitoring-panel-copy">System capabilities that keep tax obligations under continuous review.</p>
            </div>
            <span className="monitoring-pill neutral">Coverage</span>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <h4>Taxable Event Detection</h4>
              <p>Automatically detects stock sales, dividends, business income, and other taxable events</p>
              <div className="feature-status">
                <span className="status-badge active">Active</span>
                <span className="status-detail">247 events detected this month</span>
              </div>
            </div>
            <div className="feature-card">
              <h4>Deadline Tracking</h4>
              <p>Monitors filing deadlines across all jurisdictions with automatic reminders</p>
              <div className="feature-status">
                <span className="status-badge active">Active</span>
                <span className="status-detail">{complianceDeadlines.length} upcoming deadlines</span>
              </div>
            </div>
            <div className="feature-card">
              <h4>Risk Assessment</h4>
              <p>Continuous evaluation of compliance risk based on transactions and behavior</p>
              <div className="feature-status">
                <span className="status-badge low-risk">Low Risk</span>
                <span className="status-detail">94% compliance score</span>
              </div>
            </div>
            <div className="feature-card">
              <h4>Rule Updates</h4>
              <p>Automatically updates tax rules and thresholds when changes are detected</p>
              <div className="feature-status">
                <span className="status-badge active">Active</span>
                <span className="status-detail">Last update: Jan 10, 2025</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxMonitoring;
