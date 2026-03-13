import React, { useState } from 'react';
import { Button, Card, PageHeader, Table, Modal, Input } from '../../components/ui';

const MOCK_TASKS = [
  { id: 1, title: 'Review November journal entries', status: 'In Progress', due_date: '2024-12-01', priority: 'High', assignee: 'You', created: '2024-11-20' },
  { id: 2, title: 'Reconcile Chase business account', status: 'In Progress', due_date: '2024-11-30', priority: 'High', assignee: 'Alex Rodriguez', created: '2024-11-15' },
  { id: 3, title: 'Complete tax provision calculation', status: 'Open', due_date: '2024-12-10', priority: 'High', assignee: 'Sarah Chen', created: '2024-11-25' },
  { id: 4, title: 'Update fixed asset depreciation schedules', status: 'Open', due_date: '2024-12-15', priority: 'Medium', assignee: 'You', created: '2024-11-18' },
  { id: 5, title: 'Prepare period close checklist', status: 'Open', due_date: '2024-12-05', priority: 'High', assignee: 'You', created: '2024-11-22' },
  { id: 6, title: 'Review intercompany transactions', status: 'Open', due_date: '2024-12-08', priority: 'Medium', assignee: 'Morgan Lee', created: '2024-11-20' },
  { id: 7, title: 'Update customer credit limits', status: 'Completed', due_date: '2024-11-28', priority: 'Low', assignee: 'You', created: '2024-11-10' },
  { id: 8, title: 'File Q3 tax returns for entities', status: 'Completed', due_date: '2024-11-15', priority: 'High', assignee: 'Alex Rodriguez', created: '2024-10-20' },
];

const PRIORITY_COLOR = { High: '#ef4444', Medium: '#f59e0b', Low: '#6b7280' };
const STATUS_COLOR = { Open: '#1d4ed8', 'In Progress': '#c2410c', Completed: '#15803d' };

const Tasks = () => {
  const [tasks, setTasks] = useState(MOCK_TASKS);
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [form, setForm] = useState({ title: '', priority: 'Medium', due_date: '' });

  const filtered = filterStatus === 'All' ? tasks : tasks.filter(t => t.status === filterStatus);

  const handleCreateTask = () => {
    if (form.title.trim()) {
      setTasks([{ ...form, id: tasks.length + 1, status: 'Open', assignee: 'You', created: new Date().toISOString().split('T')[0] }, ...tasks]);
      setForm({ title: '', priority: 'Medium', due_date: '' });
      setShowModal(false);
    }
  };

  const columns = [
    { key: 'title', label: 'Task', width: '35%', render: v => <span style={{ fontWeight: 500 }}>{v}</span> },
    { key: 'priority', label: 'Priority', width: '12%', render: v => <span style={{ fontWeight: 700, fontSize: 12, color: PRIORITY_COLOR[v] || '#6b7280' }}>{v}</span> },
    { key: 'status', label: 'Status', width: '15%', render: v => <span style={{ fontWeight: 700, fontSize: 12, color: STATUS_COLOR[v] || '#6b7280' }}>{v}</span> },
    { key: 'due_date', label: 'Due Date', width: '18%', render: v => <span style={{ color: 'var(--color-silver-dark)', fontSize: 12 }}>{v}</span> },
    { key: 'assignee', label: 'Assignee', width: '20%', render: v => <span style={{ fontSize: 12 }}>{v}</span> },
  ];

  const stats = { Open: tasks.filter(t => t.status === 'Open').length, InProgress: tasks.filter(t => t.status === 'In Progress').length, Completed: tasks.filter(t => t.status === 'Completed').length };

  return (
    <div className="tasks-page">
      <PageHeader
        title="Tasks"
        subtitle="Manage your accounting tasks"
        actions={<Button variant="primary" onClick={() => setShowModal(true)}>+ New Task</Button>}
      />

      <div className="stats-row">
        {[{ label: 'Open', value: stats.Open, accent: '#1d4ed8' }, { label: 'In Progress', value: stats.InProgress, accent: '#c2410c' }, { label: 'Completed', value: stats.Completed, accent: '#15803d' }].map(s => (
          <div key={s.label} className="stat-card" style={{ borderTop: `3px solid ${s.accent}` }}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.accent }}>{s.value}</div>
          </div>
        ))}
      </div>

      <Card>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {['All', 'Open', 'In Progress', 'Completed'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, border: '1px solid var(--border-color-default)', cursor: 'pointer', background: filterStatus === s ? 'var(--color-midnight)' : 'var(--color-white)', color: filterStatus === s ? '#fff' : 'var(--color-midnight)', borderRadius: 6 }}>
              {s}
            </button>
          ))}
        </div>
        <Table columns={columns} data={filtered} />
      </Card>

      {showModal && (
        <Modal
          isOpen={true}
          title="Create New Task"
          onClose={() => { setShowModal(false); setForm({ title: '', priority: 'Medium', due_date: '' }); }}
          footer={<>
            <Button variant="secondary" onClick={() => { setShowModal(false); setForm({ title: '', priority: 'Medium', due_date: '' }); }}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateTask} disabled={!form.title.trim()}>Create Task</Button>
          </>}
        >
          <div className="form-grid">
            <div><div className="input-label">Task Title <span className="required">*</span></div><Input placeholder="Enter task title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1 }}><div className="input-label">Priority</div><select className="filter-select" style={{ width: '100%' }} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}><option>Low</option><option>Medium</option><option>High</option></select></div>
              <div style={{ flex: 1 }}><div className="input-label">Due Date</div><Input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} /></div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Tasks;
