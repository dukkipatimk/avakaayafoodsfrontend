import React from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './MiniCart.css';

const MiniCart = ({ isOpen, onClose }) => {
  const { items, updateQuantity, removeItem, subtotal, savings, totalItems } = useCart();

  return (
    <>
      <div className={`mini-cart-overlay ${isOpen ? 'mini-cart-overlay--open' : ''}`} onClick={onClose} />

      <div className={`mini-cart ${isOpen ? 'mini-cart--open' : ''}`} aria-hidden={!isOpen}>
        <div className="mini-cart-header">
          <h2 className="mini-cart-title">
            Your Cart
            {totalItems > 0 && <span className="mini-cart-count">{totalItems}</span>}
          </h2>
          <button className="mini-cart-close" onClick={onClose} aria-label="Close cart">✕</button>
        </div>

        {items.length === 0 ? (
          <div className="mini-cart-empty">
            <span className="mini-cart-empty-icon">🛒</span>
            <p>Your cart is empty</p>
            <Link to="/products" className="btn btn-primary btn-sm" onClick={onClose}>Browse Products</Link>
          </div>
        ) : (
          <>
            <div className="mini-cart-items">
              {items.map(item => (
                <div key={`${item.productId}_${item.weight}_${item.bundleId || 'regular'}`} className="mini-cart-item">
                  <img
                    src={item.thumbnail || '/placeholder.jpg'}
                    alt={item.name}
                    className="mini-cart-item-img"
                  />
                  <div className="mini-cart-item-info">
                    <Link
                      to={`/products/${item.slug}`}
                      className="mini-cart-item-name"
                      onClick={onClose}
                    >
                      {item.name}
                    </Link>
                    {item.bundleId && <span className="mini-cart-hamper-badge">Custom Hamper</span>}
                    <span className="mini-cart-item-meta">
                      {item.weight}
                      {item.mrp > item.price && (
                        <span className="mini-cart-item-mrp"> ₹{item.mrp}</span>
                      )}
                    </span>
                    <div className="mini-cart-qty-row">
                      {!item.bundleId && <div className="mini-cart-qty">
                        <button
                          className="mini-qty-btn"
                          onClick={() => updateQuantity(item.productId, item.weight, item.quantity - 1)}
                        >−</button>
                        <span className="mini-qty-val">{item.quantity}</span>
                        <button
                          className="mini-qty-btn"
                          onClick={() => updateQuantity(item.productId, item.weight, item.quantity + 1)}
                        >+</button>
                      </div>}
                      <span className="mini-cart-item-price">₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  </div>
                  {!item.bundleId && <button
                    className="mini-cart-remove"
                    onClick={() => removeItem(item.productId, item.weight)}
                    title="Remove item"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                  </button>}
                </div>
              ))}
            </div>

            <div className="mini-cart-footer">
              {/* Delivery info */}
              <div className="mini-shipping-bar mini-shipping-bar--free">
                🚚 <strong>1–2 day delivery</strong> within India · <strong>3–7 days</strong> international
              </div>

              {savings > 0 && (
                <div className="mini-cart-savings">
                  You're saving ₹{savings.toLocaleString()} on this order
                </div>
              )}

              <div className="mini-cart-subtotal">
                <span>Subtotal ({totalItems} {totalItems === 1 ? 'item' : 'items'})</span>
                <strong>₹{subtotal.toLocaleString()}</strong>
              </div>

              <Link
                to="/checkout"
                className="btn btn-gold btn-lg mini-cart-checkout"
                onClick={onClose}
              >
                Checkout →
              </Link>
              <Link
                to="/cart"
                className="mini-cart-view-full"
                onClick={onClose}
              >
                View full cart
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default MiniCart;
