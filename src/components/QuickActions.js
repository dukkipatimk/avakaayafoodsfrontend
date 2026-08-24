import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './QuickActions.css';

// Intent-based shortcuts for shoppers who already know what they want.
// Sits directly under the category grid on phones.
const QuickActions = ({ onQuickOrder }) => {
  const { user } = useAuth();

  return (
    <section className="quick-actions" aria-label="Quick actions">
      <h2 className="quick-actions-heading">⚡ Quick actions</h2>
      <div className="quick-actions-grid">
        <button className="qa-tile qa-tile--order" onClick={onQuickOrder}>
          <span className="qa-tile-icon" aria-hidden="true">⚡</span>
          <span className="qa-tile-label">Quick Order</span>
          <span className="qa-tile-sub">Order favourites in seconds</span>
          <span className="qa-tile-cta">Order now &rarr;</span>
        </button>

        {/* Buy Again needs an account — send signed-out visitors to log in
            rather than showing them an action that cannot work. */}
        <Link className="qa-tile qa-tile--again" to={user ? '/my-orders' : '/login'}>
          <span className="qa-tile-icon" aria-hidden="true">🔄</span>
          <span className="qa-tile-label">Buy Again</span>
          <span className="qa-tile-sub">{user ? 'Reorder past favourites' : 'Sign in to reorder'}</span>
          <span className="qa-tile-cta">Buy again &rarr;</span>
        </Link>

        <a className="qa-tile qa-tile--combo" href="#combos">
          <span className="qa-tile-icon" aria-hidden="true">🎁</span>
          <span className="qa-tile-label">Combos</span>
          <span className="qa-tile-sub">Save on bundles</span>
          <span className="qa-tile-cta">Build now &rarr;</span>
        </a>

        <Link className="qa-tile qa-tile--offers" to="/products?sort=popular">
          <span className="qa-tile-icon" aria-hidden="true">%</span>
          <span className="qa-tile-label">Offers</span>
          <span className="qa-tile-sub">Best sellers &amp; deals</span>
          <span className="qa-tile-cta">Explore &rarr;</span>
        </Link>
      </div>
    </section>
  );
};

export default QuickActions;
