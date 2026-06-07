import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AdminTabs from '../components/AdminTabs';
import './AdminDashboard.css';

const STATUS_OPTIONS = ['placed', 'confirmed', 'processing', 'packed', 'shipped', 'out-for-delivery', 'delivered', 'cancelled', 'returned'];
// Orders grouped into tabs. Each tab fetches its set of statuses.
const ORDER_TABS = [
  { key: 'active',    label: 'Active',              statuses: ['placed', 'confirmed', 'processing', 'packed'] },
  { key: 'fulfilled', label: 'Shipped & Delivered', statuses: ['out-for-delivery', 'shipped', 'delivered'] },
  { key: 'cancelled', label: 'Cancelled',           statuses: ['cancelled', 'returned'] },
  { key: 'all',       label: 'All',                 statuses: [] },
];

/* ── helpers ── */
const fmtDate = iso => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
// shippingAddress may arrive as an object or a JSON string — normalize to an object.
const orderAddr = (order) => {
  const value = order?.shippingAddress;
  if (!value) return {};
  if (typeof value === 'object') return value;
  if (typeof value === 'string') { try { return JSON.parse(value) || {}; } catch { return {}; } }
  return {};
};

const money = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const ordersToCSV = orders => {
  const header = ['Order #', 'Date', 'Customer', 'Email', 'Items', 'Total', 'Payment', 'Status', 'Zone'];
  const rows = orders.map(o => [
    o.orderNumber,
    fmtDate(o.createdAt),
    o.user?.name || orderAddr(o).fullName || orderAddr(o).name || '',
    o.user?.email || orderAddr(o).email || o.guestEmail || '',
    o.items?.length ?? 0,
    o.total ?? 0,
    o.paymentStatus,
    o.orderStatus,
    o.shippingZone || '',
  ]);
  return [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
};

const downloadCSV = (content, filename) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

/* ── Order Detail Modal ── */
const OrderDetailModal = ({ order, onClose, onOrderUpdated }) => {
  const orderId = order._id || order.id;

  const [data, setData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [products, setProducts] = useState([]);
  const [zones, setZones] = useState([]);

  const [newStatus, setNewStatus] = useState(order.orderStatus || '');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [payStatus, setPayStatus] = useState(order.paymentStatus || 'pending');
  const [payMethod, setPayMethod] = useState(order.paymentMethod || 'razorpay');
  const [payRef, setPayRef] = useState(order.paymentId || '');
  const [savingPayment, setSavingPayment] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [pickProduct, setPickProduct] = useState('');
  const [pickWeight, setPickWeight] = useState('');
  const [savingItems, setSavingItems] = useState(false);

  useEffect(() => {
    let alive = true;
    Promise.all([
      api.get(`/orders/${orderId}`),
      api.get('/products?limit=200'),
      api.get('/shipping/zones'),
    ]).then(([oRes, pRes, zRes]) => {
      if (!alive) return;
      const full = oRes.data.order;
      setData(full);
      setNewStatus(full.orderStatus || '');
      setTrackingNumber(full.trackingNumber || '');
      setPayStatus(full.paymentStatus || 'pending');
      setPayMethod(full.paymentMethod || 'razorpay');
      setPayRef(full.paymentId || '');
      setProducts(pRes.data.products || []);
      setZones(zRes.data.zones || []);
    }).catch(console.error).finally(() => { if (alive) setLoadingData(false); });
    return () => { alive = false; };
  }, [orderId]);

  const savePayment = async () => {
    setSavingPayment(true);
    try {
      const res = await api.put(`/orders/${orderId}/payment`, {
        paymentStatus: payStatus,
        paymentMethod: payMethod,
        paymentId: payRef,
      });
      const u = res.data.order;
      setData(prev => ({
        ...prev,
        paymentStatus: u.paymentStatus,
        paymentMethod: u.paymentMethod,
        paymentId: u.paymentId,
        statusHistory: u.statusHistory,
      }));
      onOrderUpdated(orderId, { paymentStatus: u.paymentStatus });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update payment');
    } finally {
      setSavingPayment(false);
    }
  };

  const handleUpdateStatus = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.put(`/orders/${orderId}/status`, { status: newStatus, trackingNumber, note });
      const u = res.data.order;
      setData(prev => ({ ...prev, orderStatus: u.orderStatus, trackingNumber: u.trackingNumber, statusHistory: u.statusHistory }));
      onOrderUpdated(orderId, { orderStatus: u.orderStatus, trackingNumber: u.trackingNumber });
      setNote('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  /* ── item editing ── */
  const startEditing = () => {
    setEditItems((data.items || []).map(i => ({
      id: i.id,
      productId: i.productId,
      name: i.name,
      weight: i.variantWeight,
      variantPrice: Number(i.variantPrice),
      quantity: i.quantity,
    })));
    setPickProduct(''); setPickWeight('');
    setEditing(true);
  };

  const setQty = (idx, qty) => setEditItems(prev =>
    prev.map((it, i) => (i === idx ? { ...it, quantity: Math.max(1, qty || 1) } : it)));

  const removeItem = idx => setEditItems(prev => prev.filter((_, i) => i !== idx));

  const addItem = () => {
    const p = products.find(x => String(x._id) === String(pickProduct));
    const v = p && (p.variants || []).find(x => x.weight === pickWeight);
    if (!p || !v) return;
    setEditItems(prev => {
      const idx = prev.findIndex(it => String(it.productId) === String(p._id) && it.weight === v.weight);
      if (idx >= 0) {
        const c = [...prev];
        c[idx] = { ...c[idx], quantity: c[idx].quantity + 1 };
        return c;
      }
      return [...prev, { productId: p._id, name: p.name, weight: v.weight, variantPrice: Number(v.price), quantity: 1 }];
    });
    setPickProduct(''); setPickWeight('');
  };

  const saveItems = async () => {
    if (editItems.length === 0) { alert('An order must have at least one item.'); return; }
    setSavingItems(true);
    try {
      const res = await api.put(`/orders/${orderId}`, {
        items: editItems.map(it => ({ id: it.id, productId: it.productId, weight: it.weight, quantity: it.quantity })),
      });
      const updated = res.data.order;
      setData(updated);
      setEditing(false);
      onOrderUpdated(orderId, updated);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order items');
    } finally {
      setSavingItems(false);
    }
  };

  /* ── live recalculation (mirrors the server) ── */
  const calcShipping = sub => {
    const zone = zones.find(z => z.id === data?.shippingZone);
    if (!zone) return Number(data?.shippingCost) || 0;
    const methodId = data?.shippingMethod === 'express' ? 'express' : 'standard';
    const m = zone.methods.find(x => x.id === methodId) || zone.methods[0];
    let cost = m?.rate || 0;
    if (zone.id === 'india' && zone.freeAbove && sub >= zone.freeAbove) cost = 0;
    return cost;
  };

  const editSubtotal = editItems.reduce((s, it) => s + it.variantPrice * it.quantity, 0);
  const editDiscount = Number(data?.discount) || 0;
  const editTax      = Number(data?.tax) || 0;
  const editShipping = calcShipping(editSubtotal);
  const editTotal    = editSubtotal - editDiscount + editTax + editShipping;
  const originalTotal = Number(data?.total) || 0;
  const diff = editTotal - originalTotal;

  const pickProductObj = products.find(x => String(x._id) === String(pickProduct));
  const pickWeights = (pickProductObj?.variants || []).filter(v => v.price);

  // JSON columns can come back as objects OR JSON strings — parse defensively.
  const parseMaybeJson = (value) => {
    if (!value) return null;
    if (typeof value === 'object') return value;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return null; }
    }
    return null;
  };
  const addr = parseMaybeJson(data?.shippingAddress || order.shippingAddress) || {};
  const billAddr = parseMaybeJson(data?.billingAddress || order.billingAddress);
  const history = data?.statusHistory || [];
  const customer = {
    name: data?.user?.name || order.user?.name || addr.fullName || addr.name || '—',
    email: data?.user?.email || order.user?.email || addr.email || data?.guestEmail || order.guestEmail || '—',
    phone: data?.user?.phone || addr.phone || '—',
  };

  return (
    <div className="order-modal-overlay" onClick={onClose}>
      <div className="order-modal-card" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="order-modal-header">
          <div>
            <h2 className="order-modal-title">Order #{order.orderNumber}</h2>
            <p className="order-modal-date">{fmtDate(order.createdAt)}</p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>✕</button>
        </div>

        {loadingData || !data ? (
          <div className="order-modal-body" style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }} />
          </div>
        ) : (
        <div className="order-modal-body">
          {/* Customer */}
          <section className="omd-section">
            <h3 className="omd-section-title">Customer</h3>
            <p className="omd-line"><strong>{data.user?.name || order.user?.name || addr.fullName || addr.name || '—'}</strong></p>
            <p className="omd-line omd-muted">{data.user?.email || order.user?.email || addr.email || '—'}</p>
          </section>

          {/* Items */}
          <section className="omd-section">
            <div className="omd-section-head">
              <h3 className="omd-section-title">Items</h3>
              {!editing && (
                <button className="omd-edit-toggle" onClick={startEditing}>Edit Items</button>
              )}
            </div>

            {!editing ? (
              <>
                <table className="omd-items-table">
                  <thead>
                    <tr><th>Product</th><th>Weight</th><th>Qty</th><th>Price</th></tr>
                  </thead>
                  <tbody>
                    {(data.items || []).map((item, i) => (
                      <tr key={i}>
                        <td>
                          {item.name || item.product?.name || '—'}
                          {item.bundleType === 'hamper' && (
                            <div className="omd-hamper-detail">
                              <strong>Custom Gift Hamper</strong>
                              {item.customization?.styleInstructions && <span>Style: {item.customization.styleInstructions}</span>}
                              {item.customization?.personalMessage && <span>Message: {item.customization.personalMessage}</span>}
                            </div>
                          )}
                        </td>
                        <td>{item.variantWeight || '—'}</td>
                        <td>{item.quantity}</td>
                        <td>{money(item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="omd-totals">
                  <div className="omd-totals-row"><span>Subtotal</span><span>{money(data.subtotal)}</span></div>
                  {editDiscount > 0 && (
                    <div className="omd-totals-row"><span>Discount</span><span>−{money(editDiscount)}</span></div>
                  )}
                  {editTax > 0 && (
                    <div className="omd-totals-row"><span>Tax</span><span>{money(editTax)}</span></div>
                  )}
                  <div className="omd-totals-row"><span>Shipping</span><span>{money(data.shippingCost)}</span></div>
                  <div className="omd-totals-row omd-totals-grand"><span>Total</span><span>{money(data.total)}</span></div>
                </div>
              </>
            ) : (
              <>
                <table className="omd-items-table omd-items-edit">
                  <thead>
                    <tr><th>Product</th><th>Weight</th><th>Unit</th><th>Qty</th><th>Line</th><th></th></tr>
                  </thead>
                  <tbody>
                    {editItems.map((it, i) => (
                      <tr key={`${it.productId}-${it.weight}-${i}`}>
                        <td>{it.name}</td>
                        <td>{it.weight}</td>
                        <td>{money(it.variantPrice)}</td>
                        <td>
                          <input
                            type="number" min="1" className="omd-qty-input"
                            value={it.quantity}
                            onChange={e => setQty(i, parseInt(e.target.value))}
                          />
                        </td>
                        <td>{money(it.variantPrice * it.quantity)}</td>
                        <td>
                          <button className="omd-item-remove" title="Remove"
                            onClick={() => removeItem(i)}>✕</button>
                        </td>
                      </tr>
                    ))}
                    {editItems.length === 0 && (
                      <tr><td colSpan={6} className="omd-empty-items">No items — add at least one.</td></tr>
                    )}
                  </tbody>
                </table>

                {/* Add product */}
                <div className="omd-add-row">
                  <select
                    className="omd-add-select"
                    value={pickProduct}
                    onChange={e => { setPickProduct(e.target.value); setPickWeight(''); }}
                  >
                    <option value="">Add a product…</option>
                    {products.map(p => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                  <select
                    className="omd-add-select"
                    value={pickWeight}
                    disabled={!pickProductObj}
                    onChange={e => setPickWeight(e.target.value)}
                  >
                    <option value="">Weight…</option>
                    {pickWeights.map(v => (
                      <option key={v.weight} value={v.weight}>{v.weight} — {money(v.price)}</option>
                    ))}
                  </select>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={!pickProduct || !pickWeight}
                    onClick={addItem}
                  >
                    + Add
                  </button>
                </div>

                {/* Live totals + difference */}
                <div className="omd-totals">
                  <div className="omd-totals-row"><span>Subtotal</span><span>{money(editSubtotal)}</span></div>
                  {editDiscount > 0 && (
                    <div className="omd-totals-row"><span>Discount</span><span>−{money(editDiscount)}</span></div>
                  )}
                  {editTax > 0 && (
                    <div className="omd-totals-row"><span>Tax</span><span>{money(editTax)}</span></div>
                  )}
                  <div className="omd-totals-row">
                    <span>Shipping {editShipping === 0 ? '(free)' : ''}</span>
                    <span>{money(editShipping)}</span>
                  </div>
                  <div className="omd-totals-row omd-totals-grand"><span>New Total</span><span>{money(editTotal)}</span></div>
                  <div className="omd-totals-row omd-totals-old"><span>Original Total</span><span>{money(originalTotal)}</span></div>
                  <div className={`omd-totals-row omd-diff ${diff > 0 ? 'up' : diff < 0 ? 'down' : ''}`}>
                    <span>Difference</span>
                    <span>{diff > 0 ? '+' : diff < 0 ? '−' : ''}{money(Math.abs(diff))}</span>
                  </div>
                </div>

                <div className="omd-edit-actions">
                  <button className="btn btn-outline btn-sm" onClick={() => setEditing(false)} disabled={savingItems}>
                    Cancel
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={saveItems} disabled={savingItems}>
                    {savingItems ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}
          </section>

          {/* Customer */}
          <section className="omd-section">
            <h3 className="omd-section-title">Customer</h3>
            <p className="omd-line">{customer.name}</p>
            <p className="omd-line omd-muted">{customer.email}</p>
            <p className="omd-line omd-muted">{customer.phone}</p>
          </section>

          {/* Shipping Address */}
          <section className="omd-section">
            <h3 className="omd-section-title">Shipping Address</h3>
            <p className="omd-line">{addr.fullName || addr.name}</p>
            {addr.line1 && <p className="omd-line">{addr.line1}</p>}
            {addr.line2 && <p className="omd-line">{addr.line2}</p>}
            <p className="omd-line">
              {[addr.city, addr.state, addr.pincode, addr.country].filter(Boolean).join(', ')}
            </p>
            {addr.phone && <p className="omd-line omd-muted">{addr.phone}</p>}
          </section>

          {/* Billing Address — only when different from shipping */}
          <section className="omd-section">
            <h3 className="omd-section-title">Billing Address</h3>
            {billAddr ? (
              <>
                <p className="omd-line">{billAddr.fullName || billAddr.name}</p>
                {billAddr.line1 && <p className="omd-line">{billAddr.line1}</p>}
                {billAddr.line2 && <p className="omd-line">{billAddr.line2}</p>}
                <p className="omd-line">
                  {[billAddr.city, billAddr.state, billAddr.pincode, billAddr.country].filter(Boolean).join(', ')}
                </p>
                {billAddr.phone && <p className="omd-line omd-muted">{billAddr.phone}</p>}
              </>
            ) : (
              <p className="omd-line omd-muted">Same as shipping address</p>
            )}
          </section>

          {/* Payment — editable */}
          <section className="omd-section">
            <h3 className="omd-section-title">Payment</h3>
            <div className="omd-form-row">
              <div className="omd-form-group">
                <label>Payment Status</label>
                <select value={payStatus} onChange={e => setPayStatus(e.target.value)}>
                  {['pending', 'paid', 'failed', 'refunded'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="omd-form-group">
                <label>Method</label>
                <select value={payMethod} onChange={e => setPayMethod(e.target.value)}>
                  {['razorpay', 'icici', 'upi', 'cod', 'cash', 'bank_transfer'].map(m => (
                    <option key={m} value={m}>{m === 'bank_transfer' ? 'Bank Transfer' : m.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="omd-form-group">
              <label>Reference / Transaction ID</label>
              <input
                type="text"
                value={payRef}
                onChange={e => setPayRef(e.target.value)}
                placeholder="e.g. UPI ref, bank txn no., receipt no."
              />
            </div>
            <button className="btn btn-primary btn-sm" onClick={savePayment} disabled={savingPayment}>
              {savingPayment ? 'Saving…' : 'Save Payment Details'}
            </button>
          </section>

          {/* Current order status */}
          <section className="omd-section">
            <h3 className="omd-section-title">Current Status</h3>
            <span className={`order-status-badge status-${data.orderStatus}`}>{data.orderStatus}</span>
            {data.trackingNumber && (
              <p className="omd-line omd-muted" style={{ marginTop: '0.5rem' }}>
                Tracking: {data.trackingNumber}
              </p>
            )}
          </section>

          {/* Status Update */}
          <section className="omd-section">
            <h3 className="omd-section-title">Update Status</h3>
            <form className="omd-status-form" onSubmit={handleUpdateStatus}>
              <div className="omd-form-row">
                <div className="omd-form-group">
                  <label>New Status</label>
                  <select value={newStatus} onChange={e => setNewStatus(e.target.value)} required>
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="omd-form-group">
                  <label>Tracking Number</label>
                  <input
                    type="text"
                    placeholder="Optional"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                  />
                </div>
              </div>
              <div className="omd-form-group">
                <label>Note (internal)</label>
                <textarea
                  rows={2}
                  placeholder="Optional internal note"
                  value={note}
                  onChange={e => setNote(e.target.value)}
                />
              </div>
              <div className="omd-form-actions">
                <button type="submit" className="btn btn-primary btn-sm" disabled={submitting}>
                  {submitting ? 'Updating…' : 'Update Status'}
                </button>
              </div>
            </form>
          </section>

          {/* Status History */}
          {history.length > 0 && (
            <section className="omd-section">
              <h3 className="omd-section-title">Status History</h3>
              <div className="omd-timeline">
                {history.map((h, i) => (
                  <div key={i} className="omd-timeline-item">
                    <div className="omd-timeline-dot" />
                    <div>
                      <span className={`order-status-badge status-${h.status}`}>{h.status}</span>
                      <span className="omd-timeline-date">{fmtDate(h.timestamp || h.changedAt || h.date)}</span>
                      {h.note && <p className="omd-timeline-note">{h.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

/* ── Main Component ── */
const AdminDashboard = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('active');

  const fetchOrders = (tabKey = statusFilter) => {
    const tab = ORDER_TABS.find(t => t.key === tabKey) || ORDER_TABS[0];
    const statusParam = tab.statuses.length ? `&status=${tab.statuses.join(',')}` : '';
    return api.get(`/orders?limit=50${statusParam}`).then(res => res.data.orders || []);
  };

  useEffect(() => {
    // Store managers only see orders — the stats endpoint is admin-only.
    fetchOrders('active')
      .then(setRecentOrders)
      .catch(console.error)
      .finally(() => setLoading(false));

    if (isAdmin) {
      api.get('/admin/dashboard')
        .then(res => setStats(res.data.stats || res.data))
        .catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const handleFilterChange = async filter => {
    setStatusFilter(filter);
    try {
      const orders = await fetchOrders(filter);
      setRecentOrders(orders);
    } catch (err) { console.error(err); }
  };

  const handleStatusUpdated = (orderId, updatedOrder) => {
    setRecentOrders(prev => prev.map(o => o._id === orderId ? { ...o, ...updatedOrder } : o));
  };

  const handleExportCSV = () => {
    const csv = ordersToCSV(recentOrders);
    const label = statusFilter === 'all' ? 'all' : statusFilter;
    downloadCSV(csv, `orders-${label}-${Date.now()}.csv`);
  };

  if (loading) return (
    <div className="admin-page">
      <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="loading-spinner" style={{ margin: '0 auto' }} />
      </div>
    </div>
  );

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1 className="admin-title">Admin Dashboard</h1>
        </div>

        <AdminTabs />

        {/* Stats — admin only */}
        {isAdmin && (
        <div className="stats-grid">
          {[
            { label: 'Total Orders', value: stats?.totalOrders || 0, icon: '📦', color: '#3b82f6' },
            { label: 'Revenue', value: `₹${(stats?.totalRevenue || 0).toLocaleString()}`, icon: '💰', color: '#10b981' },
            { label: 'Products', value: stats?.totalProducts || 0, icon: '🥫', color: '#8b5cf6' },
            { label: 'Customers', value: stats?.totalUsers || 0, icon: '👥', color: '#f59e0b' },
          ].map(stat => (
            <div key={stat.label} className="stat-card">
              <div className="stat-icon" style={{ background: stat.color + '18', color: stat.color }}>
                {stat.icon}
              </div>
              <div>
                <p className="stat-value">{stat.value}</p>
                <p className="stat-label">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
        )}

        {/* Recent Orders */}
        <div className="admin-section">
          <div className="section-header-row">
            <h2 className="section-title">Orders</h2>
            <button className="btn-export-csv" onClick={handleExportCSV}>
              Export CSV
            </button>
          </div>

          {/* Status tabs */}
          <div className="order-tabs">
            {ORDER_TABS.map(tab => (
              <button
                key={tab.key}
                className={`order-tab${statusFilter === tab.key ? ' active' : ''}`}
                onClick={() => handleFilterChange(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Address</th>
                  <th>Total</th>
                  <th>Zone</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => (
                  <tr
                    key={order._id}
                    className="order-row-clickable"
                    onClick={() => setSelectedOrder(order)}
                    title="Click to view details"
                  >
                    <td><strong>#{order.orderNumber}</strong></td>
                    <td>
                      <div className="customer-cell">
                        <span>{order.user?.name || orderAddr(order).fullName || orderAddr(order).name || '—'}</span>
                        <span className="cell-sub">{order.user?.email || orderAddr(order).email || order.guestEmail || ''}</span>
                      </div>
                    </td>
                    <td>
                      {(() => {
                        const a = orderAddr(order);
                        const street = [a.line1, a.line2].filter(Boolean).join(', ');
                        const locality = [a.city, a.state, a.pincode].filter(Boolean).join(', ');
                        return (
                          <div className="address-cell">
                            <span>{street || locality || '—'}</span>
                            {street && locality && <span className="cell-sub">{locality}</span>}
                          </div>
                        );
                      })()}
                    </td>
                    <td><strong>₹{(order.total ?? 0).toLocaleString()}</strong></td>
                    <td>
                      <span className="zone-badge">{order.shippingZone?.toUpperCase()}</span>
                    </td>
                    <td>
                      <span className={`payment-status ${order.paymentStatus}`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`order-status-badge status-${order.orderStatus}`}
                        onClick={e => e.stopPropagation()}
                      >
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="cell-date">
                      {new Date(order.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentOrders.length === 0 && (
              <div className="table-empty">No orders found.</div>
            )}
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onOrderUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
