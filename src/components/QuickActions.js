import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useLastOrder from '../hooks/useLastOrder';
import './QuickActions.css';

// Intent-based shortcuts for shoppers who already know what they want.
const QuickActions = ({ onQuickOrder }) => {
  const { user } = useAuth();
  // When the Buy Again card is on screen beside these tiles, this shortcut
  // would just be a worse duplicate of it, so the tile steps aside.
  const hasLastOrder = Boolean(useLastOrder());

  return (
    <section className="quick-actions" aria-label="Quick actions">
      <h2 className="quick-actions-heading">⚡ Quick actions</h2>
      <div className={`quick-actions-grid${hasLastOrder ? ' quick-actions-grid--three' : ''}`}>
        <button className="qa-tile qa-tile--order" onClick={onQuickOrder}>
          <span className="qa-tile-icon" aria-hidden="true">⚡</span>
          <span className="qa-tile-label">Quick Order</span>
          <span className="qa-tile-sub">Order favourites in seconds</span>
          <span className="qa-tile-cta">Order now &rarr;</span>
        </button>

        {/* Shown only when there is no last-order card to defer to. Signed-out
            visitors go to log in rather than to an action that cannot work. */}
        {!hasLastOrder && (
          <Link className="qa-tile qa-tile--again" to={user ? '/my-orders' : '/login'}>
            <span className="qa-tile-icon" aria-hidden="true">🔄</span>
            <span className="qa-tile-label">Buy Again</span>
            <span className="qa-tile-sub">{user ? 'Reorder past favourites' : 'Sign in to reorder'}</span>
            <span className="qa-tile-cta">Buy again &rarr;</span>
          </Link>
        )}

        <a className="qa-tile qa-tile--combo" href="#combos">
          <span className="qa-tile-icon" aria-hidden="true">🎁</span>
          <span className="qa-tile-label">Combos</span>
          <span className="qa-tile-sub">Save on bundles</span>
          <span className="qa-tile-cta">Build now &rarr;</span>
        </a>

      </div>
    </section>
  );
};

export default QuickActions;
