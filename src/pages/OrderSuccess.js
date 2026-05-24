import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import './OrderSuccess.css';

const OrderSuccess = () => {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      api.get(`/orders/${orderId}`)
        .then(res => setOrder(res.data.order))
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [orderId]);

  return (
    <div className="success-page">
      <div className="success-container">
        {/* Checkmark */}
        <div className="success-icon">
          <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
            <circle cx="32" cy="32" r="32" fill="#1a2e1a" />
            <path d="M18 33l10 10 18-20" stroke="#c9a84c" strokeWidth="3.5"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <h1 className="success-title">Order Placed!</h1>
        <p className="success-subtitle">
          Thank you for choosing Avakaaya Foods. Your authentic Andhra flavours are on their way!
        </p>

        {loading ? (
          <div className="loading-spinner" style={{ margin: '2rem auto' }} />
        ) : order ? (
          <div className="order-summary-card">
            <div className="order-ref">
              <span className="ref-label">Order Number</span>
              <span className="ref-value">#{order.orderNumber}</span>
            </div>

            <div className="order-items-list">
              {order.items?.map((item, i) => (
                <div key={i} className="success-item">
                  <div className="success-item-info">
                    <span className="success-item-name">{item.name}</span>
                    {item.bundleType === 'hamper' && <span className="success-hamper-badge">Inside Custom Gift Hamper</span>}
                    <span className="success-item-variant">{item.variantWeight} x {item.quantity}</span>
                  </div>
                  <span className="success-item-price">INR {Number(item.price).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="order-totals">
              <div className="total-row">
                <span>Shipping</span>
                <span>{Number(order.shippingCost) === 0 ? 'Free' : `INR ${Number(order.shippingCost).toLocaleString()}`}</span>
              </div>
              <div className="total-row grand">
                <span>Total Paid</span>
                <span>INR {Number(order.total).toLocaleString()}</span>
              </div>
            </div>

            <div className="delivery-note">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>
                {order.shippingZone === 'india'
                  ? 'Expected delivery in 3–5 business days'
                  : 'International delivery in 7–14 business days'}
              </span>
            </div>

            <p className="email-note">
              A confirmation email has been sent to <strong>{order.shippingAddress?.email || 'your email'}</strong>
            </p>
          </div>
        ) : (
          <div className="order-summary-card">
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
              Your order has been placed successfully. Check your email for details.
            </p>
          </div>
        )}

        <div className="success-actions">
          <Link to="/account/orders" className="btn btn-primary">Track Your Order</Link>
          <Link to="/products" className="btn btn-outline">Continue Shopping</Link>
        </div>

        <div className="share-section">
          <p>Love our pickles? Share with friends!</p>
          <div className="share-buttons">
            <a href={`https://wa.me/?text=I just ordered authentic Andhra pickles from Avakaaya Foods! Check them out at avakaayafoods.com`}
              target="_blank" rel="noopener noreferrer" className="share-btn whatsapp">
              Share on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
