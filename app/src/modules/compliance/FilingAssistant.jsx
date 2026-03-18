import React, { useMemo, useState } from 'react';

import '../../pages/Enterprise/EnterpriseTaxCompliance.css';
import '../../pages/Enterprise/EnterpriseActionPages.css';

const INITIAL_FILINGS = [
  {
    id: 'us-1120',
    code: 'US Form 1120',
    title: 'Corporate Income Tax Return',
    jurisdiction: 'United States',
    dueDate: '2025-04-15',
    status: 'ready',
    progress: 92,
    requirements: ['General ledger exports', 'Entity income statement', 'Federal payment reference'],
    summary: 'Federal corporate return package with schedules ready for review.',
  },
  {
    id: 'uk-ct600',
    code: 'UK CT600',
    title: 'Corporation Tax Return',
    jurisdiction: 'United Kingdom',
    dueDate: '2025-12-31',
    status: 'in-progress',
    progress: 58,
    requirements: ['Trial balance mapping', 'Directors report', 'HMRC authentication details'],
    summary: 'Return assembly in progress with supporting schedules still under review.',
  },
];

const INITIAL_HISTORY = [
  {
    id: 'q3-2024',
    title: 'Q3 2024 Tax Return',
    detail: 'Filed successfully on October 15, 2024',
    status: 'accepted',
    reference: 'ACK-2024-10-15-4412',
  },
];

const ASSISTANCE_MODULES = [
  {
    id: 'prefill',
    title: 'Form Pre-filling',
    description: 'Auto-populate forms with your data',
    actionLabel: 'Run Pre-fill',
    bullets: ['Maps current entity data into the filing template', 'Flags missing schedules before submission', 'Reduces manual entry for recurring returns'],
  },
  {
    id: 'guidance',
    title: 'Step-by-Step Guidance',
    description: 'Guided filing process with explanations',
    actionLabel: 'Open Guide',
    bullets: ['Provides filing order and sequence by jurisdiction', 'Surfaces rule notes for each submission step', 'Highlights approvals needed before final filing'],
  },
  {
    id: 'export',
    title: 'Export for Accountant',
    description: 'Prepare data packages for your tax professional',
    actionLabel: 'Generate Export',
    bullets: ['Packages returns, schedules, and support evidence', 'Includes filing status summary and due dates', 'Produces a clean handoff for external review'],
  },
];

const GUIDANCE_STEPS = [
  { id: 'collect', label: 'Collect source records', note: 'Pull trial balances, tax calculations, and supporting schedules.' },
  { id: 'validate', label: 'Validate return package', note: 'Check entity metadata, tax IDs, payment references, and attachments.' },
  { id: 'approve', label: 'Approve for submission', note: 'Confirm internal review and capture final sign-off before filing.' },
  { id: 'submit', label: 'Submit and archive', note: 'Send the filing package and store the acknowledgement record.' },
];

const formatDueDate = (value) => new Date(value).toLocaleDateString(undefined, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

const FilingAssistant = () => {
  const [filings, setFilings] = useState(INITIAL_FILINGS);
  const [recentFilings, setRecentFilings] = useState(INITIAL_HISTORY);
  const [selectedFilingId, setSelectedFilingId] = useState(INITIAL_FILINGS[0].id);
  const [activeTool, setActiveTool] = useState('prefill');
  const [completedSteps, setCompletedSteps] = useState(['collect']);
  const [statusMessage, setStatusMessage] = useState('Ready to assemble the next filing package.');

  const selectedFiling = useMemo(
    () => filings.find((filing) => filing.id === selectedFilingId) || filings[0],
    [filings, selectedFilingId]
  );

  const activeModule = useMemo(
    () => ASSISTANCE_MODULES.find((module) => module.id === activeTool) || ASSISTANCE_MODULES[0],
    [activeTool]
  );

  const completionPercent = Math.round((completedSteps.length / GUIDANCE_STEPS.length) * 100);

  const updateFiling = (id, updater) => {
    setFilings((current) => current.map((filing) => (filing.id === id ? updater(filing) : filing)));
  };

  const handlePrepare = (id) => {
    setSelectedFilingId(id);
    updateFiling(id, (filing) => ({
      ...filing,
      status: filing.status === 'ready' ? 'in-progress' : filing.status,
      progress: Math.max(filing.progress, 68),
    }));
    setActiveTool('prefill');
    setStatusMessage('Preparation workspace opened. Core filing data has been staged for review.');
  };

  const handlePrimaryAction = (id) => {
    const filing = filings.find((item) => item.id === id);
    if (!filing) return;

    if (filing.status === 'ready' || filing.status === 'in-progress') {
      updateFiling(id, (current) => ({
        ...current,
        status: 'accepted',
        progress: 100,
      }));
      setRecentFilings((current) => [
        {
          id: `${id}-${Date.now()}`,
          title: `${filing.code} Filing`,
          detail: `Filed successfully on ${new Date().toLocaleDateString()}`,
          status: 'accepted',
          reference: `ACK-${Date.now()}`,
        },
        ...current,
      ]);
      setStatusMessage(`${filing.code} submitted successfully. Acknowledgement stored in recent filings.`);
      return;
    }

    setStatusMessage(`${filing.code} has already been filed and archived.`);
  };

  const handleToolAction = (toolId) => {
    setActiveTool(toolId);
    if (toolId === 'prefill' && selectedFiling) {
      updateFiling(selectedFiling.id, (filing) => ({
        ...filing,
        progress: Math.max(filing.progress, 76),
      }));
      setStatusMessage(`${selectedFiling.code} pre-fill completed. Review highlighted fields before submission.`);
    }
    if (toolId === 'guidance') {
      setStatusMessage('Guided workflow loaded. Complete each step to finalize the submission package.');
    }
    if (toolId === 'export' && selectedFiling) {
      setRecentFilings((current) => [
        {
          id: `export-${selectedFiling.id}-${Date.now()}`,
          title: `${selectedFiling.code} Accountant Export`,
          detail: `Export package generated on ${new Date().toLocaleDateString()}`,
          status: 'exported',
          reference: `PKG-${Date.now()}`,
        },
        ...current,
      ]);
      setStatusMessage(`${selectedFiling.code} export package generated for accountant handoff.`);
    }
  };

  const toggleStep = (stepId) => {
    setCompletedSteps((current) => (
      current.includes(stepId)
        ? current.filter((item) => item !== stepId)
        : [...current, stepId]
    ));
  };

  return (
    <div className="enterprise-action-page filing-assistant-page">
      <section className="action-page-hero">
        <div className="action-page-copy">
          <span className="action-page-kicker">Compliance — Filing</span>
          <h1 className="action-page-title">Filing &amp; Submission Assistance</h1>
          <p className="action-page-subtitle">Guided tax filing and form preparation across all jurisdictions.</p>
        </div>
        <div className="action-page-badge">Filing</div>
      </section>

      <div className="filing-section filing-assistant-layout">
        <div className="filing-assistant-hero">
          <div>
            <span className="filing-kicker">Submission Workspace</span>
            <h2>Operational filing control for every return in flight</h2>
            <p>Prepare forms, complete guided review, and record filing outcomes without leaving the compliance dashboard.</p>
          </div>
          <div className="filing-assistant-status-panel">
            <span className="filing-column-pill accent">Live Status</span>
            <strong>{filings.filter((filing) => filing.status !== 'accepted').length}</strong>
            <span>active filings currently in preparation or ready to submit</span>
          </div>
        </div>

        <div className="filing-summary-grid">
          <div className="filing-summary-card">
            <span className="filing-summary-label">Upcoming Filings</span>
            <strong className="filing-summary-value">{filings.length}</strong>
            <span className="filing-summary-caption">Returns currently tracked in the filing queue</span>
          </div>
          <div className="filing-summary-card accent">
            <span className="filing-summary-label">Ready To File</span>
            <strong className="filing-summary-value">{filings.filter((filing) => filing.status === 'ready').length}</strong>
            <span className="filing-summary-caption">Packages assembled and waiting on submission</span>
          </div>
          <div className="filing-summary-card warning">
            <span className="filing-summary-label">In Progress</span>
            <strong className="filing-summary-value">{filings.filter((filing) => filing.status === 'in-progress').length}</strong>
            <span className="filing-summary-caption">Returns still being reviewed or completed</span>
          </div>
          <div className="filing-summary-card muted">
            <span className="filing-summary-label">Recent Outcomes</span>
            <strong className="filing-summary-value">{recentFilings.length}</strong>
            <span className="filing-summary-caption">Accepted filings and export packages logged here</span>
          </div>
        </div>

        <div className="filing-assistant-grid">
          <section className="filing-column filing-primary-panel">
            <div className="filing-column-header">
              <div>
                <h3>Upcoming Filings</h3>
                <p>Track return readiness, due dates, and the next required action.</p>
              </div>
              <span className="filing-column-pill">Queue</span>
            </div>
            <div className="filings-list filing-timeline">
              {filings.map((filing) => (
                <div key={filing.id} className={`filing-item ${filing.status === 'ready' ? 'warning' : 'normal'} ${selectedFilingId === filing.id ? 'selected' : ''}`}>
                  <div className="filing-icon"></div>
                  <div className="filing-content">
                    <div className="filing-item-top">
                      <h4>{filing.code}</h4>
                      <span className={`filing-chip ${filing.status === 'accepted' ? 'normal' : filing.status === 'ready' ? 'warning' : 'normal'}`}>
                        {filing.status === 'ready' ? 'Ready to File' : filing.status === 'in-progress' ? 'In Progress' : 'Accepted'}
                      </span>
                    </div>
                    <p>{filing.title}</p>
                    <span className="filing-days">Due: {formatDueDate(filing.dueDate)}</span>
                    <div className="filing-progress-row">
                      <div className="filing-progress-track">
                        <div className="filing-progress-fill" style={{ width: `${filing.progress}%` }}></div>
                      </div>
                      <span>{filing.progress}% complete</span>
                    </div>
                  </div>
                  <div className="filing-actions">
                    <button className="btn-secondary" onClick={() => handlePrepare(filing.id)}>
                      {filing.status === 'in-progress' ? 'Continue' : 'Prepare'}
                    </button>
                    <button className="btn-primary" onClick={() => handlePrimaryAction(filing.id)} disabled={filing.status === 'accepted'}>
                      {filing.status === 'accepted' ? 'Archived' : filing.status === 'ready' ? 'File Now' : 'Submit'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="filing-column filing-workspace-panel">
            <div className="filing-column-header">
              <div>
                <h3>Filing Workspace</h3>
                <p>{selectedFiling ? `${selectedFiling.code} • ${selectedFiling.jurisdiction}` : 'Select a filing to begin'}</p>
              </div>
              <span className="filing-column-pill neutral">Focused View</span>
            </div>

            {selectedFiling ? (
              <div className="filing-workspace">
                <div className="filing-workspace-card emphasis">
                  <span className="filing-summary-label">Current Return</span>
                  <h4>{selectedFiling.title}</h4>
                  <p>{selectedFiling.summary}</p>
                </div>

                <div className="filing-workspace-card">
                  <span className="filing-summary-label">Required Inputs</span>
                  <div className="filing-requirements-list">
                    {selectedFiling.requirements.map((requirement) => (
                      <div key={requirement} className="filing-requirement-item">
                        <span className="filing-requirement-dot"></span>
                        <span>{requirement}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="filing-workspace-card">
                  <div className="filing-column-header compact">
                    <div>
                      <h3>Guided Checklist</h3>
                      <p>Complete each step before the submission package is finalized.</p>
                    </div>
                    <span className="filing-column-pill accent">{completionPercent}% done</span>
                  </div>
                  <div className="filing-step-list compact">
                    {GUIDANCE_STEPS.map((step) => (
                      <button key={step.id} type="button" className={`filing-step-card compact ${completedSteps.includes(step.id) ? 'active' : ''}`} onClick={() => toggleStep(step.id)}>
                        <span className="filing-step-index">{completedSteps.includes(step.id) ? 'OK' : 'TO'}</span>
                        <div>
                          <h4>{step.label}</h4>
                          <p>{step.note}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </aside>
        </div>

        <div className="filing-assistant-grid lower">
          <section className="filing-column filing-support-panel">
            <div className="filing-column-header">
              <div>
                <h3>Filing Assistance</h3>
                <p>Working tools for pre-filling, guided review, and accountant handoff.</p>
              </div>
              <span className="filing-column-pill accent">Toolkit</span>
            </div>
            <div className="assistance-grid filing-support-grid">
              {ASSISTANCE_MODULES.map((module) => (
                <div key={module.id} className={`assistance-card ${activeTool === module.id ? 'active' : ''}`}>
                  <h4>{module.title}</h4>
                  <p>{module.description}</p>
                  <div className="filing-support-bullets">
                    {module.bullets.map((bullet) => (
                      <div key={bullet} className="filing-support-bullet">{bullet}</div>
                    ))}
                  </div>
                  <button className="btn-secondary" onClick={() => handleToolAction(module.id)}>{module.actionLabel}</button>
                </div>
              ))}
            </div>
            <div className="filing-tool-status">
              <span className="filing-summary-label">Active Tool</span>
              <strong>{activeModule.title}</strong>
              <p>{statusMessage}</p>
            </div>
          </section>

          <section className="filing-column filing-history-panel">
            <div className="filing-column-header">
              <div>
                <h3>Recent Filings</h3>
                <p>Accepted submissions and generated accountant exports.</p>
              </div>
              <span className="filing-column-pill">Archive</span>
            </div>
            <div className="history-list filing-history-list">
              {recentFilings.map((item) => (
                <div key={item.id} className="history-item filing-history-item">
                  <div className="history-info">
                    <h4>{item.title}</h4>
                    <p>{item.detail}</p>
                    <span className="filing-history-ref">{item.reference}</span>
                  </div>
                  <div className="history-status">
                    <span className={`status-badge ${item.status}`}>{item.status === 'accepted' ? 'Accepted' : 'Exported'}</span>
                  </div>
                  <button className="btn-link" onClick={() => setStatusMessage(`${item.title} opened from archive.`)}>View Details</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default FilingAssistant;
