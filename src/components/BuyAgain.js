import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { addOrderToCart, reorderableItems } from '../utils/reorder';
import { trackEvent } from '../utils/tracking';
import toast from 'react-hot-toast';
import './BuyAgain.css';

// Orders that never completed payment aren't something to "buy again".
const REORDERABLE_STATUS = new Set([
  'placed', 'confirmed', 'processing', 'packed', 'shipped', 'out-for-delivery', 'delivered',
]);

const orderedOn = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const BuyAgain = () => {
  const { user } = useAuth();
  const { addItem, subtotal } = useCart();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!user) { setOrder(null); return; }
    let cancelled = false;
    api.get('/orders/my')
      .then((r) => {
        if (cancelled) return;
        // /orders/my is already sorted newest-first.
        const last = (r.data.orders || []).find(
          (o) => REORDERABLE_STATUS.has(o.orderStatus) && reorderableItems(o).length > 0
        );
        setOrder(last || null);
      })
      .catch(() => { if (!cancelled) setOrder(null); });
    return () => { cancelled = true; };
  }, [user]);

  if (!order) return null;

  const items = reorderableItems(order);
  const lines = items.slice(0, 4);
  const date = orderedOn(order.createdAt);

  const addAll = () => {
    const added = addOrderToCart(order, addItem);
    trackEvent('add_to_cart', {
      cartValue: subtotal + Number(order.subtotal || 0),
      cartItems: items.map((i) => ({
        productId: i.productId, name: i.product?.name || i.name,
        weight: i.variantWeight, quantity: i.quantity, price: Number(i.variantPrice) || 0,
      })),
      metadata: { source: 'buy_again', orderNumber: order.orderNumber, addedValue: Number(order.subtotal) || 0 },
    });
    toast.success(`${added} ${added === 1 ? 'item' : 'items'} added to cart`);
  };

  return (
    <section className="buy-again" aria-label="Buy again">
      <div className="buy-again-card">
        <header className="buy-again-head">
          <span className="buy-again-title">🔄 Your last order</span>
          {date && <span className="buy-again-date">Ordered {date}</span>}
        </header>

        <ul className="buy-again-lines">
          {lines.map((item) => (
            <li key={`${item.productId}_${item.variantWeight}`}>
              <span className="buy-again-name">{item.product?.name || item.name}</span>
              <span className="buy-again-weight">{item.variantWeight}</span>
            </li>
          ))}
          {items.length > lines.length && (
            <li className="buy-again-more">+{items.length - lines.length} more</li>
          )}
        </ul>

        <div className="buy-again-total">₹{Number(order.subtotal || 0).toLocaleString('en-IN')}</div>

        <button className="buy-again-cta" onClick={addAll}>Add all to cart</button>
        <button className="buy-again-modify" onClick={() => navigate('/my-orders')}>
          Modify order →
        </button>
      </div>
    </section>
  );
};

export default BuyAgain;
