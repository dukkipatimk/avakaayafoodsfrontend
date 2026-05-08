import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Cart.css';

function parseWeightGrams(w) {
  if (!w) return 500;
  if (String(w).endsWith('kg')) return parseFloat(w) * 1000;
  if (String(w).endsWith('g'))  return parseFloat(w);
  return 500;
}

function formatWeight(g) {
  if (g >= 1000) return `${(g / 1000).toFixed(2).replace(/\.?0+$/, '')} kg`;
  return `${g}g`;
}

const Cart = () => {
  const { items, updateQuantity, removeItem, subtotal, savings } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <div className="cart-empty-inner">
          <span className="cart-empty-icon">🛒</span>
          <h2>Your cart is empty</h2>
          <p>Looks like you haven't added any pickles yet!</p>
          <Link to="/products" className="btn btn-primary btn-lg">Start Shopping</Link>
        </div>
      </div>
    );
  }

  const freeShippingLeft = Math.max(0, 999 - subtotal);
  const totalWeightGrams = items.reduce((sum, i) => sum + parseWeightGrams(i.weight) * (i.quantity || 1), 0);

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="cart-title">Your Cart <span className="cart-count">({items.length} items)</span></h1>

        {/* Free shipping bar */}
        {freeShippingLeft > 0 && (
          <div className="shipping-bar">
            <div className="shipping-bar-text">
              Add ₹{freeShippingLeft} more for <strong>FREE shipping</strong> within India 🚚
            </div>
            <div className="shipping-bar-track">
              <div className="shipping-bar-fill" style={{ width: `${Math.min(100, (subtotal / 999) * 100)}%` }} />
            </div>
          </div>
        )}
        {freeShippingLeft === 0 && (
          <div className="shipping-bar shipping-bar--achieved">
            🎉 You've unlocked <strong>FREE shipping</strong> within India!
          </div>
        )}

        <div className="cart-layout">
          {/* Items */}
          <div className="cart-items">
            {items.map(item => {
              const key = `${item.productId}_${item.weight}`;
              return (
                <div key={key} className="cart-item">
                  <img
                    src={item.thumbnail || '/images/products/2024/10/gongura_pickle_pp.jpg'}
                    alt={item.name}
                    className="cart-item-img"
                  />
                  <div className="cart-item-info">
                    <Link to={`/products/${item.slug}`} className="cart-item-name">{item.name}</Link>
                    <div className="cart-item-meta">
                      <span className="cart-item-weight">{item.weight}</span>
                      <span className={`badge ${item.isVeg ? 'badge-veg' : 'badge-nonveg'}`}>
                        {item.isVeg ? '● Veg' : '● Non-Veg'}
                      </span>
                    </div>
                    <div className="cart-item-price-row">
                      <span className="cart-item-price">₹{item.price}</span>
                      {item.mrp > item.price && <span className="cart-item-mrp">₹{item.mrp}</span>}
                    </div>
                  </div>
                  <div className="cart-item-controls">
                    <div className="quantity-control">
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.productId, item.weight, item.quantity - 1)}
                      >−</button>
                      <span className="qty-val">{item.quantity}</span>
                      <button
                        className="qty-btn"
                        onClick={() => updateQuantity(item.productId, item.weight, item.quantity + 1)}
                      >+</button>
                    </div>
                    <span className="cart-item-total">₹{(item.price * item.quantity).toLocaleString()}</span>
                    <button
                      className="cart-remove"
                      onClick={() => removeItem(item.productId, item.weight)}
                      title="Remove"
                    >🗑</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="cart-summary">
            <h2 className="summary-title">Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal ({items.reduce((s,i) => s+i.quantity, 0)} items)</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>
            {savings > 0 && (
              <div className="summary-row summary-row--green">
                <span>Your Savings</span>
                <span>-₹{savings.toLocaleString()}</span>
              </div>
            )}
            <div className="summary-row">
              <span>Est. Shipment Weight</span>
              <span className="summary-weight">📦 {formatWeight(totalWeightGrams)}</span>
            </div>
            <div className="summary-row">
              <span>Shipping</span>
              <span className="summary-shipping">
                Calculated at checkout
              </span>
            </div>

            <div className="summary-divider" />

            <div className="summary-total">
              <span>Total</span>
              <span>₹{subtotal.toLocaleString()}</span>
            </div>

            {savings > 0 && (
              <div className="summary-savings-note">
                🎉 You're saving ₹{savings.toLocaleString()} on this order!
              </div>
            )}

            <button
              className="btn btn-gold btn-lg checkout-btn"
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout →
            </button>

            <Link to="/products" className="continue-shopping">← Continue Shopping</Link>

            {/* Payment icons */}
            <div className="payment-icons">
              <span className="payment-label">Secure payment via</span>
              <div className="payment-methods">
                <span>💳 ICICI Bank</span>
                <span>📱 UPI</span>
                <span>🏦 Net Banking</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
