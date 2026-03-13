import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, PageHeader, Table } from '../../components/ui';
import { invoicesAPI } from '../../services/api';

const DAYS_OVERDUE_COLOR = (days) => {
  if (days < 30) return '#f59e0b';
  if (days < 60) return '#f97316';
  return '#ef4444';
};

export default function Collections() {
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await invoicesAPI.getAll({ status: 'overdue' });
      const all = res.data.results || res.data;
      const overdue = all.filter(i => i.status === 'overdue' || i.status === 'sent');
      setOverdueInvoices(overdue);
    } catch (e) { setError('Failed to load collections data'); }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const getDaysOverdue = (dueDate) => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const today = new Date();
    return Math.max(0, Math.floor((today - due) / (1000 * 60 * 60 * 24)));
  };

  const handleSendReminder = async (invoice) => {
    alert(`Reminder would be sent for invoice ${invoice.invoice_number}. Connect email service to enable.`);
  };

  const columns = [
    { key: 'invoice_number', label: 'Invoice #', render: v => <code style={{ fontSize: 12 }}>{v}</code> },
    { key: 'customer_name', label: 'Customer', render: (v, row) => row.customer_name || '—' },
    { key: 'due_date', label: 'Due Date' },
    { key: 'total', label: 'Amount', render: v => <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>${parseFloat(v||0).toLocaleString('en-US',{minimumFractionDigits:2})}</span> },
    { key: 'due_date', label: 'Days Overdue', render: v => {
        const days = getDaysOverdue(v);
        return <span style={{ color: DAYS_OVERDUE_COLOR(days), fontWeight: 700 }}>{days} days</span>;
    }},
  ];

  const totalOutstanding = overdueInvoices.reduce((sum, i) => sum + parseFloat(i.total || 0), 0);

  return (
    <div className="collections-page">
      <PageHeader title="Collections" subtitle="Track and manage overdue receivables" actions={<Button variant="secondary" onClick={load}>Refresh</Button>} />
      {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', padding: '10px 16px', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>{error}</div>}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 24 }}>
        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--color-silver-dark)', marginBottom: 4 }}>Overdue Invoices</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#ef4444' }}>{overdueInvoices.length}</div>
        </Card>
        <Card style={{ padding: 20 }}>
          <div style={{ fontSize: 12, color: 'var(--color-silver-dark)', marginBottom: 4 }}>Total Outstanding</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#ef4444' }}>${totalOutstanding.toLocaleString('en-US',{minimumFractionDigits:2})}</div>
        </Card>
      </div>
      <Card>
        {loading ? <div style={{ textAlign: 'center', padding: 32, color: 'var(--color-silver-dark)' }}>Loading...</div>
        : overdueInvoices.length === 0
          ? <div style={{ textAlign: 'center', padding: 48, color: 'var(--color-silver-dark)' }}><p style={{ fontSize: 15, fontWeight: 500 }}>No overdue invoices.</p><p style={{ fontSize: 13 }}>All receivables are current.</p></div>
          : <Table columns={columns} data={overdueInvoices} actions={row => (
              <button onClick={() => handleSendReminder(row)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid #f97316', cursor: 'pointer', background: 'transparent', color: '#f97316' }}>Send Reminder</button>
            )} />}
      </Card>
    </div>
  );
}
