import React, { useState } from 'react';
import { PageHeader, Card, Button } from '../../components/ui';

const periods = [
  { period: 'December 2024', closedDate: '2025-01-15', closedBy: 'Sarah Johnson', status: 'Closed' },
  { period: 'November 2024', closedDate: '2024-12-12', closedBy: 'Sarah Johnson', status: 'Closed' },
  { period: 'October 2024',  closedDate: '2024-11-10', closedBy: 'Michael Chen',  status: 'Closed' },
  { period: 'January 2025',  closedDate: '—',          closedBy: '—',             status: 'Open'   },
];

const checklist = [
  { task: 'All bank accounts reconciled',       done: true,  blocking: false },
  { task: 'All journal entries posted',         done: true,  blocking: false },
  { task: 'Accounts receivable aging reviewed', done: true,  blocking: false },
  { task: 'Accounts payable aging reviewed',    done: false, blocking: true  },
  { task: 'Fixed asset depreciation posted',    done: false, blocking: true  },
  { task: 'Payroll entries confirmed',          done: true,  blocking: false },
  { task: 'Trial balance balanced',             done: false, blocking: true  },
  { task: 'Management review completed',        done: false, blocking: false },
];

export default function PeriodClose() {
  const [items, setItems] = useState(checklist);
  const [showConfirm, setShowConfirm] = useState(false);

  const completedCount = items.filter(i => i.done).length;
  const blockingLeft   = items.filter(i => !i.done && i.blocking).length;
  const canClose       = completedCount === items.length;

  const toggle = (idx) => {
    setItems(prev => prev.map((item, i) => i === idx ? { ...item, done: !item.done } : item));
  };

  const handleClose = () => { setShowConfirm(false); };

  return (
    <div className="module-page">
      <PageHeader
        title="Period Close"
        subtitle="Manage month-end and year-end close procedures"
        actions={
          <Button variant={canClose ? 'primary' : 'secondary'} size="small" disabled={!canClose} onClick={() => setShowConfirm(true)}>
            Close Period
          </Button>
        }
      />

      {/* KPI strip */}
      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-label">Tasks Completed</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>{completedCount}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Total Tasks</div>
          <div className="stat-value">{items.length}</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Blocking Items</div>
          <div className="stat-value" style={{ color: blockingLeft > 0 ? 'var(--color-error)' : 'var(--color-success)' }}>
            {blockingLeft}
          </div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Periods Closed (YTD)</div>
          <div className="stat-value">{periods.filter(p => p.status === 'Closed').length}</div>
        </Card>
      </div>

      {/* Progress bar */}
      <Card style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
          <span style={{ fontWeight: 600, color: 'var(--color-midnight)' }}>January 2025 Close Progress</span>
          <span style={{ color: 'var(--color-silver-dark)' }}>{completedCount}/{items.length} tasks</span>
        </div>
        <div style={{ height: 8, background: 'var(--color-silver-very-light)', borderRadius: 4, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(completedCount / items.length) * 100}%`,
            background: canClose ? 'var(--color-success)' : blockingLeft > 0 ? 'var(--color-warning)' : 'var(--color-cyan)',
            borderRadius: 4,
            transition: 'width 0.3s ease',
          }} />
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <Card title="Close Checklist — January 2025">
          {items.map((item, idx) => (
            <div
              key={idx}
              onClick={() => toggle(idx)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 0', borderBottom: '1px solid var(--border-color-default)', cursor: 'pointer',
              }}
            >
              <div style={{
                width: 18, height: 18, borderRadius: 3, flexShrink: 0,
                border: `2px solid ${item.done ? 'var(--color-success)' : item.blocking ? 'var(--color-error)' : 'var(--border-color-default)'}`,
                background: item.done ? 'var(--color-success)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {item.done && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}
              </div>
              <span style={{
                fontSize: 13,
                color: item.done ? 'var(--color-silver-dark)' : 'var(--color-midnight)',
                textDecoration: item.done ? 'line-through' : 'none',
                flex: 1,
              }}>
                {item.task}
              </span>
              {!item.done && item.blocking && (
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-error)', textTransform: 'uppercase' }}>Blocking</span>
              )}
            </div>
          ))}
        </Card>

        <Card title="Period History">
          {periods.map((p, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '12px 0', borderBottom: '1px solid var(--border-color-default)',
            }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-midnight)' }}>{p.period}</div>
                {p.closedDate !== '—' && (
                  <div style={{ fontSize: 12, color: 'var(--color-silver-dark)' }}>Closed {p.closedDate} by {p.closedBy}</div>
                )}
              </div>
              <span className="status-badge" style={{ background: p.status === 'Closed' ? 'var(--color-success)' : 'var(--color-cyan)' }}>
                {p.status}
              </span>
            </div>
          ))}
        </Card>
      </div>

      {/* Close confirmation */}
      {showConfirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
        }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 32, maxWidth: 420, width: '100%', boxShadow: '0 16px 48px rgba(0,0,0,0.2)' }}>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 12, color: 'var(--color-midnight)' }}>
              Close January 2025?
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-silver-dark)', marginBottom: 24, lineHeight: 1.6 }}>
              This will lock the period and prevent further edits to January 2025 entries. This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button variant="secondary" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button variant="primary" onClick={handleClose}>Confirm Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
