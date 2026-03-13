import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../../components/ui';

const mockPayroll = [
  { id: 'EMP-001', name: 'Sarah Johnson', role: 'CFO', department: 'Finance', gross: '$18,333.33', deductions: '$4,200.00', net: '$14,133.33', period: 'Jan 2025', status: 'Processed' },
  { id: 'EMP-002', name: 'Michael Chen', role: 'Senior Accountant', department: 'Finance', gross: '$9,166.67', deductions: '$2,100.00', net: '$7,066.67', period: 'Jan 2025', status: 'Processed' },
  { id: 'EMP-003', name: 'Lisa Rodriguez', role: 'Operations Manager', department: 'Operations', gross: '$10,833.33', deductions: '$2,500.00', net: '$8,333.33', period: 'Jan 2025', status: 'Pending' },
];

const STATUS_COLORS = { Processed: 'var(--color-success)', Pending: 'var(--color-warning)', Rejected: 'var(--color-error)' };

const columns = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Employee' },
  { key: 'role', header: 'Role' },
  { key: 'department', header: 'Department' },
  { key: 'period', header: 'Period' },
  { key: 'gross', header: 'Gross Pay' },
  { key: 'deductions', header: 'Deductions' },
  { key: 'net', header: 'Net Pay' },
  { key: 'status', header: 'Status', render: (row) => (
    <span className="status-badge" style={{ background: STATUS_COLORS[row.status] }}>{row.status}</span>
  )},
];

const BLANK_FORM = { name: '', employeeId: '', role: '', department: '', salary: '', frequency: 'Monthly', taxPct: '', startDate: '' };

export default function Payroll() {
  const [showModal, setShowModal] = useState(false);
  const [employees, setEmployees] = useState(mockPayroll);
  const [form, setForm] = useState(BLANK_FORM);

  const handleAdd = () => {
    if (!form.name.trim() || !form.employeeId.trim()) return;
    const annualSalary = parseFloat(form.salary) || 0;
    const gross = `$${(annualSalary / 12).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    const deductAmt = annualSalary / 12 * (parseFloat(form.taxPct) || 0) / 100;
    const netAmt = annualSalary / 12 - deductAmt;
    const today = new Date();
    const period = today.toLocaleString('en-US', { month: 'short', year: 'numeric' });
    setEmployees(prev => [...prev, {
      id: form.employeeId,
      name: form.name,
      role: form.role,
      department: form.department,
      gross,
      deductions: `$${deductAmt.toFixed(2)}`,
      net: `$${netAmt.toFixed(2)}`,
      period,
      status: 'Pending',
    }]);
    setForm(BLANK_FORM);
    setShowModal(false);
  };

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  return (
    <div className="module-page">
      <PageHeader
        title="Payroll Subledger"
        subtitle="Track payroll expenses, deductions, and employee compensation records"
        actions={
          <>
            <Button variant="secondary" size="small">Export Payroll</Button>
            <Button variant="primary" size="small" onClick={() => setShowModal(true)}>Add Employee
            </Button>
          </>
        }
      />

      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-label">Total Gross (MTD)</div>
          <div className="stat-value">$38,333.33</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Total Deductions</div>
          <div className="stat-value" style={{ color: 'var(--color-error)' }}>$8,800.00</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Total Net Pay</div>
          <div className="stat-value" style={{ color: 'var(--color-success)' }}>$29,533.33</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Employees</div>
          <div className="stat-value">3</div>
        </Card>
      </div>

      <Card title="Payroll Records">
        <Table columns={columns} data={employees} />
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(BLANK_FORM); }} title="Add Employee" size="medium">
        <div className="form-grid">
          <Input label="Full Name" required value={form.name} onChange={set('name')} />
          <Input label="Employee ID" required value={form.employeeId} onChange={set('employeeId')} />
          <Input label="Role / Title" required value={form.role} onChange={set('role')} />
          <Input label="Department" value={form.department} onChange={set('department')} />
          <Input label="Annual Salary" type="number" required value={form.salary} onChange={set('salary')} />
          <Input label="Pay Frequency" placeholder="Monthly / Bi-weekly / Weekly" value={form.frequency} onChange={set('frequency')} />
          <Input label="Tax Withholding %" type="number" value={form.taxPct} onChange={set('taxPct')} />
          <Input label="Start Date" type="date" value={form.startDate} onChange={set('startDate')} />
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(BLANK_FORM); }}>Cancel</Button>
          <Button variant="primary" onClick={handleAdd} disabled={!form.name.trim() || !form.employeeId.trim()}>Add Employee</Button>
        </div>
      </Modal>
    </div>
  );
}
