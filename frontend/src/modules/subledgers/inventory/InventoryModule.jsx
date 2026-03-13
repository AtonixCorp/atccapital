import React, { useState } from 'react';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../../components/ui';

const mockInventory = [
  { sku: 'SKU-001', name: 'Enterprise License - Annual', category: 'Software', qty: 142, unitCost: '$4,800.00', totalValue: '$681,600.00', reorderLevel: 10, status: 'In Stock' },
  { sku: 'SKU-002', name: 'Hardware Module A', category: 'Hardware', qty: 8, unitCost: '$1,250.00', totalValue: '$10,000.00', reorderLevel: 15, status: 'Low Stock' },
  { sku: 'SKU-003', name: 'Consulting Hours Bundle', category: 'Services', qty: 0, unitCost: '$200.00', totalValue: '$0.00', reorderLevel: 5, status: 'Out of Stock' },
];

const STATUS_COLORS = { 'In Stock': 'var(--color-success)', 'Low Stock': 'var(--color-warning)', 'Out of Stock': 'var(--color-error)' };

const columns = [
  { key: 'sku', header: 'SKU' },
  { key: 'name', header: 'Item Name' },
  { key: 'category', header: 'Category' },
  { key: 'qty', header: 'Quantity' },
  { key: 'unitCost', header: 'Unit Cost' },
  { key: 'totalValue', header: 'Total Value' },
  { key: 'reorderLevel', header: 'Reorder Level' },
  { key: 'status', header: 'Status', render: (row) => (
    <span className="status-badge" style={{ background: STATUS_COLORS[row.status] }}>{row.status}</span>
  )},
];

const BLANK_ITEM = { name: '', sku: '', category: '', unitCost: '', qty: '', reorderLevel: '', method: '', glAccount: '' };

export default function InventoryModule() {
  const [showModal, setShowModal] = useState(false);
  const [inventoryList, setInventoryList] = useState(mockInventory);
  const [form, setForm] = useState(BLANK_ITEM);
  const set = f => e => setForm(p => ({ ...p, [f]: e.target.value }));

  const handleCreate = () => {
    if (!form.name.trim() || !form.sku.trim()) return;
    const costNum = parseFloat(form.unitCost) || 0;
    const qtyNum = parseInt(form.qty) || 0;
    const costFmt = `$${costNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const totalFmt = `$${(costNum * qtyNum).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    const status = qtyNum === 0 ? 'Out of Stock' : qtyNum <= (parseInt(form.reorderLevel) || 5) ? 'Low Stock' : 'In Stock';
    setInventoryList(prev => [...prev, {
      sku: form.sku, name: form.name, category: form.category || '—',
      qty: qtyNum, unitCost: costFmt, totalValue: totalFmt,
      reorderLevel: parseInt(form.reorderLevel) || 0, status,
    }]);
    setForm(BLANK_ITEM);
    setShowModal(false);
  };

  return (
    <div className="module-page">
      <PageHeader
        title="Inventory"
        subtitle="Track inventory levels, valuations, and reorder points"
        actions={
          <>
            <Button variant="secondary" size="small">Valuation Report</Button>
            <Button variant="primary" size="small" onClick={() => setShowModal(true)}>Add Item
            </Button>
          </>
        }
      />

      <div className="stats-row">
        <Card className="stat-card">
          <div className="stat-label">Total Inventory Value</div>
          <div className="stat-value">$691,600.00</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">SKUs Tracked</div>
          <div className="stat-value">3</div>
        </Card>
        <Card className="stat-card">
          <div className="stat-label">Low / Out of Stock</div>
          <div className="stat-value" style={{ color: 'var(--color-error)' }}>2</div>
        </Card>
      </div>

      <Card title="Inventory Register">
        <Table columns={columns} data={inventoryList} />
      </Card>

      <Modal isOpen={showModal} onClose={() => { setShowModal(false); setForm(BLANK_ITEM); }} title="Add Inventory Item" size="medium">
        <div className="form-grid">
          <Input label="Item Name" required value={form.name} onChange={set('name')} />
          <Input label="SKU / Code" required value={form.sku} onChange={set('sku')} />
          <Input label="Category" value={form.category} onChange={set('category')} />
          <Input label="Unit Cost" type="number" required value={form.unitCost} onChange={set('unitCost')} />
          <Input label="Opening Quantity" type="number" value={form.qty} onChange={set('qty')} />
          <Input label="Reorder Level" type="number" value={form.reorderLevel} onChange={set('reorderLevel')} />
          <Input label="Valuation Method" placeholder="FIFO / LIFO / Average Cost" value={form.method} onChange={set('method')} />
          <Input label="GL Account" value={form.glAccount} onChange={set('glAccount')} />
        </div>
        <div className="modal-footer">
          <Button variant="secondary" onClick={() => { setShowModal(false); setForm(BLANK_ITEM); }}>Cancel</Button>
          <Button variant="primary" onClick={handleCreate} disabled={!form.name.trim() || !form.sku.trim()}>Add Item</Button>
        </div>
      </Modal>
    </div>
  );
}
