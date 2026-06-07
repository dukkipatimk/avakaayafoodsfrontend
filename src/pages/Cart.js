import React, { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { trackEvent } from '../utils/tracking';
import './Cart.css';

function parseWeightGrams(weight) {
  if (!weight) return 500;
  if (String(weight).endsWith('kg')) return parseFloat(weight) * 1000;
  if (String(weight).endsWith('g')) return parseFloat(weight);
  return 500;
}

function formatWeight(grams) {
  if (grams >= 1000) return `${(grams / 1000).toFixed(2).replace(/\.?0+$/, '')} kg`;
  return `${grams}g`;
}

const Cart = () => {
  const { items, updateQuantity, removeItem, removeBundle, subtotal, savings } = useCart();
  const navigate = useNavigate();
  const trackedFilledCart = useRef(items.length > 0);

  useEffect(() => {
    if (items.length || trackedFilledCart.current) {
      trackEvent('view_cart', {
        cartValue: subtotal,
        cartItems: items,
        metadata: { source: 'cart_page', subtotal, shippingStatus: 'calculated_at_checkout' },
      });
      trackedFilledCart.current = items.length > 0;
    }
  }, [items, subtotal]);

  if (items.length === 0) {
    return (
      <div className="cart-empty">
        <div className="cart-empty-inner">
          <h2>Your cart is empty</h2>
          <p>Browse our authentic Telugu foods or create a custom hamper.</p>
          <Link to="/products" className="btn btn-primary btn-lg">Start Shopping</Link>
        </div>
      </div>
    );
  }

  const totalWeightGrams = items.reduce((sum, item) => sum + parseWeightGrams(item.weight) * item.quantity, 0);
  const regularItems = items.filter(item => !item.bundleId);
  const hamperGroups = items.filter(item => item.bundleType === 'hamper').reduce((groups, item) => {
    if (!groups[item.bundleId]) groups[item.bundleId] = [];
    groups[item.bundleId].push(item);
    return groups;
  }, {});

  const renderItem = (item, isHamperItem = false) => (
    <div key={`${item.productId}_${item.weight}_${item.bundleId || 'regular'}`} className={`cart-item ${isHamperItem ? 'cart-item--hamper' : ''}`}>
      <img src={item.thumbnail || '/images/products/2024/10/gongura_pickle_pp.jpg'} alt={item.name} className="cart-item-img" />
      <div className="cart-item-info">
        <Link to={`/products/${item.slug}`} className="cart-item-name">{item.name}</Link>
        <div className="cart-item-meta">
          <span className="cart-item-weight">{item.weight}</span>
          <span className={`badge ${item.isVeg ? 'badge-veg' : 'badge-nonveg'}`}>{item.isVeg ? 'Veg' : 'Non-Veg'}</span>
        </div>
        <div className="cart-item-price-row">
          <span className="cart-item-price">INR {Number(item.price).toLocaleString()}</span>
          {item.mrp > item.price && <span className="cart-item-mrp">INR {Number(item.mrp).toLocaleString()}</span>}
        </div>
      </div>
      <div className="cart-item-controls">
        {isHamperItem ? (
          <span className="hamper-included-label">Inside hamper</span>
        ) : (
          <div className="quantity-control">
            <button className="qty-btn" onClick={() => updateQuantity(item.productId, item.weight, item.quantity - 1)}>-</button>
            <span className="qty-val">{item.quantity}</span>
            <button className="qty-btn" onClick={() => updateQuantity(item.productId, item.weight, item.quantity + 1)}>+</button>
          </div>
        )}
        <span className="cart-item-total">INR {(Number(item.price) * item.quantity).toLocaleString()}</span>
        {!isHamperItem && <button className="cart-remove" onClick={() => removeItem(item.productId, item.weight)} title="Remove">Remove</button>}
      </div>
    </div>
  );

  return (
    <div className="cart-page">
      <div className="container">
        <h1 className="cart-title">Your Cart <span className="cart-count">({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span></h1>
        <div className="shipping-bar shipping-bar--achieved">
          <strong>1-2 day delivery</strong> within India | <strong>3-7 days</strong> international
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            {Object.entries(hamperGroups).map(([bundleId, hamperItems], index) => {
              const customization = hamperItems[0].customization || {};
              const groupTotal = hamperItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
              return (
                <section key={bundleId} className="cart-hamper-group">
                  <div className="cart-hamper-header">
                    <div>
                      <span className="cart-hamper-tag">Custom Gift Hamper {Object.keys(hamperGroups).length > 1 ? index + 1 : ''}</span>
                      <p>{hamperItems.length} products packed together</p>
                    </div>
                    <div className="cart-hamper-actions">
                      <strong>INR {groupTotal.toLocaleString()}</strong>
                      <button onClick={() => removeBundle(bundleId)}>Remove hamper</button>
                    </div>
                  </div>
                  {(customization.styleInstructions || customization.personalMessage) && (
                    <div className="cart-hamper-notes">
                      {customization.styleInstructions && <p><strong>Style:</strong> {customization.styleInstructions}</p>}
                      {customization.personalMessage && <p><strong>Message card:</strong> {customization.personalMessage}</p>}
                    </div>
                  )}
                  {hamperItems.map(item => renderItem(item, true))}
                </section>
              );
            })}
            {regularItems.length > 0 && Object.keys(hamperGroups).length > 0 && <h2 className="cart-regular-title">Other Products</h2>}
            {regularItems.map(item => renderItem(item))}
          </div>

          <div className="cart-summary">
            <h2 className="summary-title">Order Summary</h2>
            <div className="summary-row">
              <span>Subtotal ({items.reduce((sum, item) => sum + item.quantity, 0)} items)</span>
              <span>INR {subtotal.toLocaleString()}</span>
            </div>
            {savings > 0 && <div className="summary-row summary-row--green"><span>Your Savings</span><span>-INR {savings.toLocaleString()}</span></div>}
            <div className="summary-row"><span>Est. Shipment Weight</span><span className="summary-weight">{formatWeight(totalWeightGrams)}</span></div>
            <div className="summary-row"><span>Shipping</span><span>Calculated at checkout</span></div>
            <div className="summary-divider" />
            <div className="summary-total"><span>Total</span><span>INR {subtotal.toLocaleString()}</span></div>
            <button className="btn btn-gold btn-lg checkout-btn" onClick={() => {
              trackEvent('begin_checkout', {
                cartValue: subtotal,
                cartItems: items,
                metadata: { source: 'cart_button', subtotal, shippingStatus: 'pending_address' },
              });
              navigate('/checkout');
            }}>Proceed to Checkout</button>
            <Link to="/products" className="continue-shopping">Continue Shopping</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
