import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './CartBar.css';

// Routes where a "view cart" prompt is noise: the cart/checkout flow itself,
// the post-order screens, and the admin panel.
const HIDDEN_PREFIXES = ['/cart', '/checkout', '/order/', '/admin'];

const CartBar = () => {
  const { items, totalItems, subtotal } = useCart();
  const { pathname } = useLocation();

  const hidden = HIDDEN_PREFIXES.some((p) => pathname === p || pathname.startsWith(p));
  const visible = items.length > 0 && !hidden;

  // Bump the body's bottom padding while the bar is up so it never covers the
  // last of the page content (the bottom toolbar's own reserve is in index.css).
  useEffect(() => {
    document.body.classList.toggle('has-cart-bar', visible);
    return () => document.body.classList.remove('has-cart-bar');
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="cart-bar" role="region" aria-label="Cart summary">
      <span className="cart-bar-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
      </span>
      <span className="cart-bar-text">
        <strong>{totalItems} {totalItems === 1 ? 'item' : 'items'} in cart</strong>
        <span className="cart-bar-total">₹{subtotal.toLocaleString('en-IN')}</span>
      </span>
      <Link to="/cart" className="cart-bar-cta">View Cart →</Link>
    </div>
  );
};

export default CartBar;
