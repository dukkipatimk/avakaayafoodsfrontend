import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './AdminDashboard.css';

const STATUS_OPTIONS = ['placed', 'confirmed', 'processing', 'packed', 'shipped', 'out-for-delivery', 'delivered', 'cancelled', 'returned'];
const FILTER_OPTIONS = ['all', 'placed', 'confirmed', 'processing', 'packed', 'shipped', 'delivered', 'cancelled'];

/* ── helpers ── */
const fmtDate = iso => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const ordersToCSV = orders => {
  const header = ['Order #', 'Date', 'Customer', 'Email', 'Items', 'Total', 'Payment', 'Status', 'Zone'];
  const rows = orders.map(o => [
    o.orderNumber,
    fmtDate(o.createdAt),
    o.user?.name || o.shippingAddress?.name || '',
    o.user?.email || o.shippingAddress?.email || '',
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
const OrderDetailModal = ({ order, onClose, onStatusUpdated }) => {
  const [newStatus, setNewStatus] = useState(order.orderStatus || '');
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleUpdateStatus = async e => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.patch(`/orders/${order._id}/status`, { status: newStatus, trackingNumber, note });
      onStatusUpdated(order._id, res.data.order || { ...order, orderStatus: newStatus, trackingNumber });
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  const addr = order.shippingAddress || {};
  const history = order.statusHistory || [];

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

        <div className="order-modal-body">
          {/* Customer */}
          <section className="omd-section">
            <h3 className="omd-section-title">Customer</h3>
            <p className="omd-line"><strong>{order.user?.name || addr.name || '—'}</strong></p>
            <p className="omd-line omd-muted">{order.user?.email || addr.email || '—'}</p>
          </section>

          {/* Items */}
          <section className="omd-section">
            <h3 className="omd-section-title">Items</h3>
            <table className="omd-items-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Weight</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, i) => (
                  <tr key={i}>
                    <td>{item.name || item.productId?.name || '—'}</td>
                    <td>{item.weight || '—'}</td>
                    <td>{item.quantity}</td>
                    <td>₹{item.price?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="omd-total">Total: <strong>₹{(order.total ?? 0).toLocaleString()}</strong></p>
          </section>

          {/* Shipping Address */}
          <section className="omd-section">
            <h3 className="omd-section-title">Shipping Address</h3>
            <p className="omd-line">{addr.name}</p>
            {addr.line1 && <p className="omd-line">{addr.line1}</p>}
            {addr.line2 && <p className="omd-line">{addr.line2}</p>}
            <p className="omd-line">
              {[addr.city, addr.state, addr.pincode, addr.country].filter(Boolean).join(', ')}
            </p>
            {addr.phone && <p className="omd-line omd-muted">{addr.phone}</p>}
          </section>

          {/* Payment */}
          <section className="omd-section omd-row-2">
            <div>
              <h3 className="omd-section-title">Payment</h3>
              <p className="omd-line">Method: <strong>{order.paymentMethod || '—'}</strong></p>
              <p className="omd-line">Status: <span className={`payment-status ${order.paymentStatus}`}>{order.paymentStatus}</span></p>
            </div>
            <div>
              <h3 className="omd-section-title">Current Status</h3>
              <span className={`order-status-badge status-${order.orderStatus}`}>{order.orderStatus}</span>
              {order.trackingNumber && (
                <p className="omd-line omd-muted" style={{ marginTop: '0.5rem' }}>
                  Tracking: {order.trackingNumber}
                </p>
              )}
            </div>
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
                      <span className="omd-timeline-date">{fmtDate(h.changedAt || h.date)}</span>
                      {h.note && <p className="omd-timeline-note">{h.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

/* ── Main Component ── */
const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOrders = (filter = 'all') => {
    const params = filter === 'all' ? '?limit=50' : `?limit=50&status=${filter}`;
    return api.get(`/orders${params}`).then(res => res.data.orders || []);
  };

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      fetchOrders('all'),
    ]).then(([statsRes, orders]) => {
      setStats(statsRes.data);
      setRecentOrders(orders);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

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
          <div className="admin-actions">
            <Link to="/admin/products" className="btn btn-primary">Manage Products</Link>
          </div>
        </div>

        {/* Stats */}
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

        {/* Recent Orders */}
        <div className="admin-section">
          <div className="section-header-row">
            <h2 className="section-title">Orders</h2>
            <button className="btn-export-csv" onClick={handleExportCSV}>
              Export CSV
            </button>
          </div>

          {/* Filter Buttons */}
          <div className="order-filters">
            {FILTER_OPTIONS.map(f => (
              <button
                key={f}
                className={`filter-btn${statusFilter === f ? ' active' : ''}`}
                onClick={() => handleFilterChange(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
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
                        <span>{order.user?.name || order.shippingAddress?.name}</span>
                        <span className="cell-sub">{order.user?.email || order.shippingAddress?.email}</span>
                      </div>
                    </td>
                    <td>{order.items?.length}</td>
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
          onStatusUpdated={handleStatusUpdated}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
