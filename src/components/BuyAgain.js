import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import useLastOrder from '../hooks/useLastOrder';
import { addOrderToCart, reorderableItems } from '../utils/reorder';
import { trackEvent } from '../utils/tracking';
import toast from 'react-hot-toast';
import './BuyAgain.css';

const orderedOn = (value) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? null
    : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

// One tap to recreate the customer's last order. Lives inside the shop band's
// action column, so it is laid out as a wide card rather than a page section.
const BuyAgain = () => {
  const { addItem, subtotal } = useCart();
  const navigate = useNavigate();
  const order = useLastOrder();

  if (!order) return null;

  const items = reorderableItems(order);
  const lines = items.slice(0, 3);
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
        <div className="buy-again-info">
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
        </div>

        <div className="buy-again-actions">
          <span className="buy-again-total">₹{Number(order.subtotal || 0).toLocaleString('en-IN')}</span>
          <button className="buy-again-cta" onClick={addAll}>Add all to cart</button>
          <button className="buy-again-modify" onClick={() => navigate('/my-orders')}>
            Modify order →
          </button>
        </div>
      </div>
    </section>
  );
};

export default BuyAgain;
