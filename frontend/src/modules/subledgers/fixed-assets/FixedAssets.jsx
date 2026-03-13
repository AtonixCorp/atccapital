import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../../components/ui';

const mockAssets = [
  { id: 'FA-001', name: 'Office Building', category: 'Real Estate', cost: '$2,500,000.00', accumulated: '$125,000.00', netBook: '$2,375,000.00', method: 'Straight-line', life: '40 yrs', status: 'Active' },
  { id: 'FA-002', name: 'Server Infrastructure', category: 'Technology', cost: '$180,000.00', accumulated: '$72,000.00', netBook: '$108,000.00', method: 'Straight-line', life: '5 yrs', status: 'Active' },
  { id: 'FA-003', name: 'Company Vehicles (x3)', category: 'Vehicles', cost: '$120,000.00', accumulated: '$48,000.00', netBook: '$72,000.00', method: 'Declining Balance', life: '5 yrs', status: 'Active' },
  { id: 'FA-004', name: 'Leasehold Improvements', category: 'Improvements', cost: '$85,000.00', accumulated: '$85,000.00', netBook: '$0.00', method: 'Straight-line', life: '10 yrs', status: 'Fully Depreciated' },
];

const STATUS_COLORS = { Active: 'var(--color-success)', 'Fully Depreciated': 'var(--color-silver-dark)', Disposed: 'var(--color-error)' };

const columns = [
  { key: 'id', header: 'Asset ID' },
  { key: 'name', header: 'Asset Name' },
  { key: 'category', header: 'Category' },
  { key: 'cost', header: 'Cost' },
  { key: 'accumulated', header: 'Accum. Depreciation' },
  { key: 'netBook', header: 'Net Book Value' },
  { key: 'method', header: 'Method' },
  { key: 'life', header: 'Useful Life' },
  { key: 'status', header: 'Status', render: (row) => (
    <span className="status-badge" style={{ background: STATUS_COLORS[row.status] }}>{row.status}</span>
  )},
];

const BLANK_ASSET = { name: '', category: '', acquisitionDate: '', cost: '', method: '', usefulLife: '', salvageValue: '', glAccount: '' };

export default function FixedAssets() {
  const [showModal, setShowModal] = useState(false);
  const [assetList, setAssetList] = useState(mockAssets);
  const [form, setForm] = useState(BLANK_ASSET);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleCreate = () => {
    if (!form.name.trim() || !form.cost.trim()) return;
    const costFmt = `$${parseFloat(form.cost).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const nextId = `FA-${String(assetList.length + 1).padStart(3, '0')}`;
    setAssetList(prev => [...prev, {
      id: nextId, name: form.name, category: form.category || '—',
      cost: costFmt, accumulated: '$0.00', netBook: costFmt,
      method: form.method || 'Straight-line', life: form.usefulLife ? `${form.usefulLife} yrs` : '—',
      status: 'Active',
    }]);
    setForm(BLANK_ASSET);
    setShowModal(false);
  };

  return (
    <div className="module-page">
      <PageHeader
        title="Fixed Assets"
        subtitle="Manage fixed assets, depreciation schedules, and disposal tracking"
        actions={
          <>
            <Button variant="secondary" size="small">Depreciation Schedule</Button>
            <Button variant="primary" size="small" onClick={() => setShowModal(true)}>Add Asset
            </Button>
          </>
        }
      />

      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-label">Total Assets (Cost)</div>
          <div className="stat-value">$2,885,000.00</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Net Book Value</div>
          <div className="stat-value">$2,555,000.00</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">YTD Depreciation</div>
          <div className="stat-value" style={{ color: 'var(--color-error)' }}>$85,400.00</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Active Assets</div>
          <div className="stat-value">3</div>
        </Card>
      </div>

      <Card title="Asset Register">
        <Table columns={columns} data={assetList} />
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(BLANK_ASSET); }} title="Add Fixed Asset" size="medium">
        <div className="form-grid">
          <Input label="Asset Name" required value={form.name} onChange={set('name')} />
          <Input label="Category" required value={form.category} onChange={set('category')} />
          <Input label="Acquisition Date" type="date" required value={form.acquisitionDate} onChange={set('acquisitionDate')} />
          <Input label="Cost" type="number" required value={form.cost} onChange={set('cost')} />
          <Input label="Depreciation Method" placeholder="Straight-line / Declining Balance" value={form.method} onChange={set('method')} />
          <Input label="Useful Life (years)" type="number" value={form.usefulLife} onChange={set('usefulLife')} />
          <Input label="Salvage Value" type="number" value={form.salvageValue} onChange={set('salvageValue')} />
          <Input label="GL Account" value={form.glAccount} onChange={set('glAccount')} />
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(BLANK_ASSET); }}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={!form.name.trim() || !form.cost.trim()}>Add Asset</Button>
        </div>
      </Modal>
    </div>
  );
}
