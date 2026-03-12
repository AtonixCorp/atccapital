import React, { useState } from 'react';
import { Button, Card, PageHeader } from '../../components/ui';

const MOCK_NOTIFICATIONS = [
  { id: 1, type: 'alert', title: 'Period Close Pending', message: 'November 2024 period close is due today. All entries must be finalized by 5 PM.', created: '2024-11-30T09:15:00', read: false },
  { id: 2, type: 'success', title: 'Bank Reconciliation Complete', message: 'Chase Business account for USD entity reconciled successfully. Variance: $0.00.', created: '2024-11-29T14:32:00', read: false },
  { id: 3, type: 'info', title: 'New Team Member Added', message: 'Sarah Chen has been invited to Finance team with Accountant role. Invitation expires in 7 days.', created: '2024-11-28T10:20:00', read: true },
  { id: 4, type: 'warning', title: 'Invoice Payment Overdue', message: 'Invoice INV-2024-1847 from TechVendor is now 15 days overdue. Amount due: $5,420.', created: '2024-11-27T08:45:00', read: true },
  { id: 5, type: 'alert', title: 'Tax Filing Deadline Approaching', message: 'Corporate income tax return for Canada entity due in 10 days. Financials must be submitted for review.', created: '2024-11-26T11:30:00', read: true },
  { id: 6, type: 'info', title: 'API Key Generated', message: 'New API key "Production Integration v2" created successfully.', created: '2024-11-25T09:00:00', read: true },
  { id: 7, type: 'success', title: 'Monthly Close Completed', message: 'October 2024 financial statements finalized and locked. All entities closed.', created: '2024-11-01T16:45:00', read: true },
];

const TYPE_CONFIG = {
  alert: { icon: '⚠️', badge: '#ef4444', text: 'Alert' },
  success: { icon: '✓', badge: '#10b981', text: 'Success' },
  warning: { icon: '⚡', badge: '#f59e0b', text: 'Warning' },
  info: { icon: 'ⓘ', badge: '#3b82f6', text: 'Info' },
};

const Notifications = () => {
  const [notifs, setNotifs] = useState(MOCK_NOTIFICATIONS);
  const [filter, setFilter] = useState('All');

  const filtered = filter === 'All' ? notifs : filter === 'Unread' ? notifs.filter(n => !n.read) : notifs.filter(n => n.type === filter);

  const handleMarkAsRead = (id) => {
    setNotifs(notifs.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifs(notifs.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifs.filter(n => !n.read).length;

  return (
    <div className="notifications-page">
      <PageHeader
        title="Notifications"
        subtitle={`You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
        actions={unreadCount > 0 && <Button variant="secondary" size="small" onClick={handleMarkAllRead}>Mark all as read</Button>}
      />

      {/* Filter Tabs */}
      <Card>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['All', 'Unread', 'alert', 'success', 'warning', 'info'].map(f => {
            const label = f === 'All' ? 'All' : f === 'Unread' ? 'Unread' : TYPE_CONFIG[f]?.text || f;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '6px 14px', fontSize: 12, fontWeight: 600, border: '1px solid var(--border-color-default)',
                  cursor: 'pointer', background: filter === f ? 'var(--color-midnight)' : 'var(--color-white)',
                  color: filter === f ? '#fff' : 'var(--color-midnight)', borderRadius: 6,
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* Notification List */}
      <Card header={`${filtered.length} notification${filtered.length !== 1 ? 's' : ''}`}>
        {filtered.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--color-silver-dark)', padding: '32px 0' }}>No notifications</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {filtered.map((n, i) => (
              <div
                key={n.id}
                style={{
                  padding: '14px 16px', borderBottom: i !== filtered.length - 1 ? '1px solid var(--border-color-default)' : 'none',
                  background: n.read ? 'transparent' : 'rgba(59, 130, 246, 0.03)', display: 'flex', gap: 12, alignItems: 'flex-start',
                }}
              >
                <div style={{ fontSize: 18, flexShrink: 0 }}>{TYPE_CONFIG[n.type]?.icon || 'ⓘ'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-midnight)' }}>{n.title}</span>
                    <span style={{ display: 'inline-block', padding: '2px 6px', fontSize: 10, fontWeight: 700, background: TYPE_CONFIG[n.type]?.badge, color: '#fff', borderRadius: 4 }}>
                      {TYPE_CONFIG[n.type]?.text}
                    </span>
                    {!n.read && <span style={{ display: 'inline-block', width: 6, height: 6, background: '#3b82f6', borderRadius: '50%' }} />}
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--color-silver-dark)', margin: '0 0 6px 0' }}>{n.message}</p>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: 'var(--color-silver-dark)' }}>{new Date(n.created).toLocaleDateString()}</span>
                    {!n.read && <button onClick={() => handleMarkAsRead(n.id)} style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', cursor: 'pointer', background: 'none', border: 'none' }}>Mark as read</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Notifications;
