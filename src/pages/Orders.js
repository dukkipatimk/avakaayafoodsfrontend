import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Orders.css';

const STATUS_COLORS = {
  awaiting_payment: '#f59e0b',
  pending: '#f59e0b',
  placed: '#f59e0b',
  confirmed: '#3b82f6',
  processing: '#8b5cf6',
  packed: '#7c3aed',
  shipped: '#06b6d4',
  'out-for-delivery': '#0284c7',
  delivered: '#10b981',
  cancelled: '#ef4444',
  returned: '#6b7280',
};

// "awaiting_payment" → "Awaiting payment"
const prettyStatus = s => (s || '')
  .replace(/[-_]/g, ' ')
  .replace(/^\w/, c => c.toUpperCase());

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const { addItem } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/orders/my')
      .then(res => setOrders(res.data.orders || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Load the Razorpay checkout script once, so "Pay Now" can open the dialog.
  useEffect(() => {
    if (window.Razorpay || document.getElementById('razorpay-checkout-js')) return;
    const s = document.createElement('script');
    s.id = 'razorpay-checkout-js';
    s.src = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  // Complete payment for an order that was saved but never paid (awaiting_payment).
  // Routes through Razorpay checkout, which itself covers UPI, cards, netbanking & wallets.
  const handlePayNow = async (order) => {
    setPayingId(order._id);
    try {
      const payRes = await api.post('/payment/create-order', {
        orderId: order._id,
        amount: Number(order.total),
        currency: order.currency || 'INR',
      });

      // Dev / unconfigured-gateway mode — simulate a successful payment.
      if (payRes.data.mock) {
        await api.post('/payment/verify', {
          razorpay_order_id: payRes.data.order.id,
          razorpay_payment_id: 'mock_pay_' + Date.now(),
          razorpay_signature: 'mock_sig',
          orderId: order._id,
        });
        toast.success('Payment successful!');
        navigate(`/order/success?orderId=${order._id}&orderNumber=${order.orderNumber}`);
        return;
      }

      const Razorpay = window.Razorpay;
      if (!Razorpay) {
        toast.error('Payment gateway not loaded. Please refresh and try again.');
        return;
      }

      const apiBase = process.env.REACT_APP_API_URL || '/api';
      const callbackUrl = apiBase.startsWith('http')
        ? `${apiBase.replace(/\/$/, '')}/payment/callback`
        : `${window.location.origin}${apiBase.replace(/\/$/, '')}/payment/callback`;

      const addr = order.shippingAddress || {};
      const rzp = new Razorpay({
        key: payRes.data.keyId,
        amount: payRes.data.order.amount,
        currency: order.currency || 'INR',
        name: 'Avakaaya Foods',
        description: `Order #${order.orderNumber}`,
        order_id: payRes.data.order.id,
        callback_url: callbackUrl,
        prefill: {
          name: addr.fullName || user?.name,
          email: addr.email || user?.email,
          contact: addr.phone || user?.phone,
        },
        theme: { color: '#1a2e1a' },
        handler: async (response) => {
          await api.post('/payment/verify', { ...response, orderId: order._id });
          toast.success('Payment successful!');
          navigate(`/order/success?orderId=${order._id}&orderNumber=${order.orderNumber}`);
        },
        modal: {
          ondismiss: () => toast('Payment cancelled — your order is still saved.'),
        },
      });
      rzp.on('payment.failed', (resp) => {
        toast.error(`Payment failed: ${resp?.error?.description || 'Please try again'}`);
      });
      rzp.open();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not start payment. Please try again.');
    } finally {
      setPayingId(null);
    }
  };

  const handleReorder = (order) => {
    order.items?.forEach(item => {
      const productObj = {
        ...(typeof item.product === 'object' ? item.product : {}),
        _id: item.product?._id || item.product,
      };
      const variantObj = {
        weight: item.variant?.weight,
        price: item.variant?.price,
        mrp: item.variant?.price,
      };
      addItem(productObj, variantObj);
    });
    toast.success('Items added to cart!');
  };

  if (loading) return (
    <div className="orders-page">
      <div className="container" style={{ textAlign: 'center', padding: '5rem' }}>
        <div className="loading-spinner" style={{ margin: '0 auto' }} />
      </div>
    </div>
  );

  return (
    <div className="orders-page">
      <div className="container">
        <div className="orders-header">
          <h1 className="orders-title">My Orders</h1>
          <Link to="/products" className="btn btn-outline btn-sm">Continue Shopping</Link>
        </div>

        {orders.length === 0 ? (
          <div className="orders-empty">
            <div className="empty-icon">📦</div>
            <h2>No orders yet</h2>
            <p>Your order history will appear here once you make your first purchase.</p>
            <Link to="/products" className="btn btn-primary">Shop Now</Link>
          </div>
        ) : (
          <div className="orders-list">
            {orders.map(order => {
              const unpaid = order.orderStatus === 'awaiting_payment';
              return (
              <div key={order._id} className={`order-card${unpaid ? ' order-card--unpaid' : ''}`}>
                <div className="order-card-header" onClick={() => setExpanded(expanded === order._id ? null : order._id)}>
                  <div className="order-meta">
                    <div>
                      <span className="order-number">#{order.orderNumber}</span>
                      <span className="order-date">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="order-brief">
                      {order.items?.length} item{order.items?.length !== 1 ? 's' : ''} ·{' '}
                      <strong>₹{order.total?.toLocaleString()}</strong>
                    </div>
                  </div>
                  <div className="order-header-right">
                    <span className="order-status-badge"
                      style={{ background: (STATUS_COLORS[order.orderStatus] || '#999') + '22', color: STATUS_COLORS[order.orderStatus] || '#999' }}>
                      {prettyStatus(order.orderStatus)}
                    </span>
                    {unpaid && (
                      <button
                        className="btn btn-gold btn-sm pay-now-btn"
                        onClick={e => { e.stopPropagation(); handlePayNow(order); }}
                        disabled={payingId === order._id}
                        title="Complete payment for this order"
                      >
                        {payingId === order._id ? '⏳ Processing…' : '💳 Pay Now'}
                      </button>
                    )}
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={e => { e.stopPropagation(); handleReorder(order); }}
                      title="Reorder these items"
                    >
                      🔁 Reorder
                    </button>
                    <span className="expand-icon">{expanded === order._id ? '▲' : '▼'}</span>
                  </div>
                </div>

                {expanded === order._id && (
                  <div className="order-card-body">
                    {/* Items */}
                    <div className="order-items">
                      {order.items?.map((item, i) => (
                        <div key={i} className="order-line-item">
                          <div className="line-item-info">
                            <span className="line-item-name">{item.name}</span>
                            <span className="line-item-meta">{item.variant?.weight} × {item.quantity}</span>
                          </div>
                          <span className="line-item-price">
                            ₹{item.price?.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Summary */}
                    <div className="order-summary-row">
                      <div className="summary-col">
                        <p className="summary-label">Shipping Address</p>
                        <p className="summary-value">
                          {order.shippingAddress?.fullName}<br />
                          {order.shippingAddress?.line1}<br />
                          {order.shippingAddress?.city}, {order.shippingAddress?.state}<br />
                          {order.shippingAddress?.country}
                        </p>
                      </div>
                      <div className="summary-col">
                        <p className="summary-label">Payment</p>
                        <p className="summary-value">
                          {order.paymentMethod?.toUpperCase()}<br />
                          <span style={{ color: order.paymentStatus === 'paid' ? '#10b981' : '#f59e0b' }}>
                            {order.paymentStatus?.charAt(0).toUpperCase() + order.paymentStatus?.slice(1)}
                          </span>
                        </p>
                      </div>
                      <div className="summary-col">
                        <p className="summary-label">Totals</p>
                        <div className="totals-mini">
                          <span>Shipping: {order.shippingCost === 0 ? 'Free' : `₹${order.shippingCost}`}</span>
                          <span><strong>Total: ₹{order.total?.toLocaleString()}</strong></span>
                        </div>
                      </div>
                    </div>

                    {/* Tracking */}
                    {order.trackingNumber && (
                      <div className="tracking-bar">
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Tracking: <strong>{order.trackingNumber}</strong>
                      </div>
                    )}

                    {/* Status timeline */}
                    {order.statusHistory?.length > 0 && (
                      <div className="status-timeline">
                        {order.statusHistory.map((s, i) => (
                          <div key={i} className="timeline-item">
                            <div className="timeline-dot" style={{ background: STATUS_COLORS[s.status] || '#999' }} />
                            <div className="timeline-content">
                              <span className="timeline-status">
                                {prettyStatus(s.status)}
                              </span>
                              <span className="timeline-date">
                                {new Date(s.timestamp).toLocaleDateString('en-IN', {
                                  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                              </span>
                              {s.note && <span className="timeline-note">{s.note}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
