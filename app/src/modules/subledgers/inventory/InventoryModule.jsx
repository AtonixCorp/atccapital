import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { PageHeader, Card, Table, Button, Modal, Input } from '../../../components/ui';
import { inventoryItemsAPI, inventoryTransactionsAPI, entitiesAPI } from '../../../services/api';

const BASE_PATH = '/app/subledgers/inventory';
const ITEM_FORM = {
  entity: '',
  sku: '',
  item_code: '',
  item_name: '',
  description: '',
  category: '',
  unit_of_measure: 'unit',
  quantity_on_hand: '0',
  reorder_level: '0',
  reorder_quantity: '0',
  unit_cost: '0',
  valuation_method: 'fifo',
};
const MOVEMENT_FORM = {
  entity: '',
  inventory_item: '',
  transaction_type: 'purchase',
  transaction_date: '',
  quantity: '',
  reference_number: '',
  notes: '',
};

const parseList = (response) => response.data.results || response.data;
const formatMoney = (value) => `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
const formatError = (error, fallback) => {
  const data = error.response?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  return Object.entries(data).map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`).join(' | ');
};
const stockStatus = (item) => {
  const quantity = Number(item.quantity_on_hand || 0);
  const reorderLevel = Number(item.reorder_level || 0);
  if (quantity <= 0) return 'Out of Stock';
  if (quantity <= reorderLevel) return 'Low Stock';
  return 'In Stock';
};

export default function InventoryModule() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showItemModal, setShowItemModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [viewOnly, setViewOnly] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [itemForm, setItemForm] = useState(ITEM_FORM);
  const [movementForm, setMovementForm] = useState(MOVEMENT_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [itemRes, txnRes, entityRes] = await Promise.all([
        inventoryItemsAPI.getAll(),
        inventoryTransactionsAPI.getAll(),
        entitiesAPI.getAll(),
      ]);
      setItems(parseList(itemRes));
      setTransactions(parseList(txnRes));
      setEntities(parseList(entityRes));
      setError('');
    } catch (requestError) {
      setError(formatError(requestError, 'Failed to load inventory.'));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const closeItemModal = useCallback(() => {
    setShowItemModal(false);
    setEditItem(null);
    setViewOnly(false);
    setItemForm(ITEM_FORM);
    if (location.pathname !== BASE_PATH) {
      navigate(BASE_PATH, { replace: true });
    }
  }, [location.pathname, navigate]);

  useEffect(() => {
    if (location.pathname === `${BASE_PATH}/create`) {
      setViewOnly(false);
      setEditItem(null);
      setItemForm(ITEM_FORM);
      setShowItemModal(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (!id || !items.length) return;
    const match = items.find((item) => String(item.id) === String(id));
    if (!match) return;
    setEditItem(match);
    setViewOnly(location.pathname.includes('/view/'));
    setItemForm({
      entity: match.entity || '',
      sku: match.sku || '',
      item_code: match.item_code || '',
      item_name: match.item_name || '',
      description: match.description || '',
      category: match.category || '',
      unit_of_measure: match.unit_of_measure || 'unit',
      quantity_on_hand: match.quantity_on_hand || '0',
      reorder_level: match.reorder_level || '0',
      reorder_quantity: match.reorder_quantity || '0',
      unit_cost: match.unit_cost || '0',
      valuation_method: match.valuation_method || 'fifo',
    });
    setShowItemModal(true);
  }, [id, items, location.pathname]);

  const setItemField = (field) => (event) => setItemForm((current) => ({ ...current, [field]: event.target.value }));
  const setMovementField = (field) => (event) => setMovementForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSaveItem = async () => {
    if (!itemForm.entity || !itemForm.item_name.trim() || !itemForm.sku.trim() || !itemForm.item_code.trim()) {
      setError('Entity, SKU, item code, and item name are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      let response;
      if (editItem) {
        response = await inventoryItemsAPI.update(editItem.id, itemForm);
      } else {
        response = await inventoryItemsAPI.create(itemForm);
      }
      await load();
      navigate(`${BASE_PATH}/view/${response.data.id}`, { replace: true });
    } catch (requestError) {
      setError(formatError(requestError, 'Failed to save inventory item.'));
    }
    setSaving(false);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Delete this inventory item?')) return;
    try {
      await inventoryItemsAPI.delete(itemId);
      await load();
      if (String(editItem?.id) === String(itemId)) {
        closeItemModal();
      }
    } catch (requestError) {
      setError(formatError(requestError, 'Failed to delete inventory item.'));
    }
  };

  const handleSaveMovement = async () => {
    if (!movementForm.entity || !movementForm.inventory_item || !movementForm.transaction_date || !movementForm.quantity) {
      setError('Entity, item, date, and quantity are required for inventory movements.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await inventoryTransactionsAPI.create(movementForm);
      await load();
      setShowMovementModal(false);
      setMovementForm(MOVEMENT_FORM);
    } catch (requestError) {
      setError(formatError(requestError, 'Failed to record inventory movement.'));
    }
    setSaving(false);
  };

  const totalValue = items.reduce((sum, item) => sum + (Number(item.quantity_on_hand || 0) * Number(item.unit_cost || 0)), 0);
  const lowStockCount = items.filter((item) => stockStatus(item) !== 'In Stock').length;

  const itemColumns = [
    { key: 'sku', label: 'SKU', render: (value) => <code style={{ fontSize: 12 }}>{value}</code> },
    { key: 'item_name', label: 'Item Name' },
    { key: 'category', label: 'Category' },
    { key: 'quantity_on_hand', label: 'Quantity' },
    { key: 'unit_cost', label: 'Unit Cost', render: (value) => <span style={{ fontFamily: 'monospace' }}>{formatMoney(value)}</span> },
    { key: 'reorder_level', label: 'Reorder Level' },
    { key: 'status', label: 'Status', render: (_value, row) => stockStatus(row) },
  ];
  const transactionColumns = [
    { key: 'transaction_date', label: 'Date' },
    { key: 'inventory_item_sku', label: 'SKU' },
    { key: 'transaction_type', label: 'Type', render: (value) => String(value || '').replace(/_/g, ' ') },
    { key: 'quantity', label: 'Quantity' },
    { key: 'reference_number', label: 'Reference' },
  ];

  return (
    <div className="module-page">
      <PageHeader
        title="Inventory"
        subtitle="Track inventory levels, valuations, and stock movements"
        actions={<><Button variant="secondary" size="small" onClick={() => setShowMovementModal(true)}>Record Movement</Button><Button variant="primary" size="small" onClick={() => navigate(`${BASE_PATH}/create`)}>Add Item</Button></>}
      />

      {error && <div className="error-banner" style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 14px', borderRadius: 8, marginBottom: 16 }}>{error}</div>}

      <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <Card className="stat-card"><div className="stat-label">Total Inventory Value</div><div className="stat-value">{formatMoney(totalValue)}</div></Card>
        <Card className="stat-card"><div className="stat-label">SKUs Tracked</div><div className="stat-value">{items.length}</div></Card>
        <Card className="stat-card"><div className="stat-label">Low / Out of Stock</div><div className="stat-value" style={{ color: '#dc2626' }}>{lowStockCount}</div></Card>
      </div>

      <Card title="Inventory Register">
        {loading ? <div style={{ padding: 32, textAlign: 'center' }}>Loading inventory...</div> : <Table columns={itemColumns} data={items} actions={(row) => <div style={{ display: 'flex', gap: 6 }}><button type="button" onClick={() => navigate(`${BASE_PATH}/view/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', background: 'transparent', cursor: 'pointer' }}>View</button><button type="button" onClick={() => navigate(`${BASE_PATH}/edit/${row.id}`)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid var(--border-color-default)', background: 'transparent', cursor: 'pointer' }}>Edit</button><button type="button" onClick={() => handleDeleteItem(row.id)} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 4, border: '1px solid #fca5a5', background: 'transparent', color: '#dc2626', cursor: 'pointer' }}>Delete</button></div>} />}
      </Card>

      <Card title="Recent Inventory Movements" style={{ marginTop: 24 }}>
        <Table columns={transactionColumns} data={transactions.slice(0, 10)} />
      </Card>

      <Modal isOpen={showItemModal} onClose={closeItemModal} title={viewOnly ? 'Inventory Item Details' : editItem ? 'Edit Inventory Item' : 'Add Inventory Item'} footer={viewOnly ? <Button variant="secondary" onClick={closeItemModal}>Close</Button> : <><Button variant="secondary" onClick={closeItemModal}>Cancel</Button><Button variant="primary" onClick={handleSaveItem} disabled={saving}>{saving ? 'Saving...' : 'Save Item'}</Button></>}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Entity *</label>
            <select disabled={viewOnly} value={itemForm.entity} onChange={setItemField('entity')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
              <option value="">Select entity</option>
              {entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="SKU *" value={itemForm.sku} onChange={setItemField('sku')} disabled={viewOnly} />
            <Input label="Item Code *" value={itemForm.item_code} onChange={setItemField('item_code')} disabled={viewOnly} />
          </div>
          <Input label="Item Name *" value={itemForm.item_name} onChange={setItemField('item_name')} disabled={viewOnly} />
          <Input label="Description" value={itemForm.description} onChange={setItemField('description')} disabled={viewOnly} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Input label="Category" value={itemForm.category} onChange={setItemField('category')} disabled={viewOnly} />
            <Input label="Unit of Measure" value={itemForm.unit_of_measure} onChange={setItemField('unit_of_measure')} disabled={viewOnly} />
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Valuation Method</label>
              <select disabled={viewOnly} value={itemForm.valuation_method} onChange={setItemField('valuation_method')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
                {['fifo', 'lifo', 'weighted_avg'].map((method) => <option key={method} value={method}>{method.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12 }}>
            <Input label="Opening Quantity" type="number" step="0.01" value={itemForm.quantity_on_hand} onChange={setItemField('quantity_on_hand')} disabled={viewOnly} />
            <Input label="Reorder Level" type="number" step="0.01" value={itemForm.reorder_level} onChange={setItemField('reorder_level')} disabled={viewOnly} />
            <Input label="Reorder Quantity" type="number" step="0.01" value={itemForm.reorder_quantity} onChange={setItemField('reorder_quantity')} disabled={viewOnly} />
            <Input label="Unit Cost" type="number" step="0.01" value={itemForm.unit_cost} onChange={setItemField('unit_cost')} disabled={viewOnly} />
          </div>
        </div>
      </Modal>

      <Modal isOpen={showMovementModal} onClose={() => { setShowMovementModal(false); setMovementForm(MOVEMENT_FORM); }} title="Record Inventory Movement" footer={<><Button variant="secondary" onClick={() => { setShowMovementModal(false); setMovementForm(MOVEMENT_FORM); }}>Cancel</Button><Button variant="primary" onClick={handleSaveMovement} disabled={saving}>{saving ? 'Saving...' : 'Save Movement'}</Button></>}>
        <div style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Entity *</label>
            <select value={movementForm.entity} onChange={setMovementField('entity')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
              <option value="">Select entity</option>
              {entities.map((entity) => <option key={entity.id} value={entity.id}>{entity.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Item *</label>
            <select value={movementForm.inventory_item} onChange={setMovementField('inventory_item')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
              <option value="">Select item</option>
              {items.map((item) => <option key={item.id} value={item.id}>{item.sku} - {item.item_name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Transaction Type</label>
              <select value={movementForm.transaction_type} onChange={setMovementField('transaction_type')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }}>
                {['purchase', 'sale', 'adjustment', 'return', 'transfer'].map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <Input label="Transaction Date *" type="date" value={movementForm.transaction_date} onChange={setMovementField('transaction_date')} />
            <Input label="Quantity *" type="number" step="0.01" value={movementForm.quantity} onChange={setMovementField('quantity')} />
          </div>
          <Input label="Reference Number" value={movementForm.reference_number} onChange={setMovementField('reference_number')} />
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Notes</label>
            <textarea rows={3} value={movementForm.notes} onChange={setMovementField('notes')} style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-color-default)' }} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
