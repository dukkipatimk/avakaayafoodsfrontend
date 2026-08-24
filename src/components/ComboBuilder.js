import React, { useEffect, useMemo, useState } from 'react';
import { useCart } from '../context/CartContext';
import { trackEvent } from '../utils/tracking';
import toast from 'react-hot-toast';
import './ComboBuilder.css';

// Full-screen "pick any N" combo builder.
//
// Building a bundle out of existing catalogue products beats minting a separate
// combo SKU per permutation: stock, pricing and photos all stay on the product.
const ComboBuilder = ({ combo, onClose }) => {
  const { addCombo, subtotal } = useCart();
  const [picked, setPicked] = useState([]);   // ComboItem ids, in tap order

  const need = Math.max(1, Number(combo?.pickCount) || 1);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const members = useMemo(() => (combo?.items || []).filter((m) => m.product), [combo]);

  const variantOf = (member) =>
    (member.product?.variants || []).find((v) => v.weight === member.weight);

  const toggle = (member) => {
    const id = member._id ?? member.id;
    setPicked((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length >= need) {
        toast(`You've already chosen ${need}. Remove one to swap.`);
        return current;
      }
      return [...current, id];
    });
  };

  const complete = () => {
    const selections = picked
      .map((id) => members.find((m) => (m._id ?? m.id) === id))
      .filter(Boolean)
      .map((member) => ({ product: member.product, variant: variantOf(member) }))
      .filter((s) => s.variant);

    if (selections.length !== need) {
      toast.error(`Please choose ${need} products.`);
      return;
    }

    addCombo(combo, selections);
    trackEvent('add_to_cart', {
      cartValue: subtotal + (Number(combo.price) || 0),
      cartItems: selections.map((s) => ({
        productId: s.product._id ?? s.product.id,
        name: s.product.name,
        weight: s.variant.weight,
        quantity: 1,
        price: s.variant.price,
      })),
      metadata: { source: 'combo_builder', comboName: combo.name, addedValue: Number(combo.price) || 0 },
    });
    toast.success(`${combo.name} added to cart`);
    onClose();
  };

  const remaining = need - picked.length;
  const pct = Math.min(100, Math.round((picked.length / need) * 100));

  return (
    <div className="cb" role="dialog" aria-modal="true" aria-label={`Build ${combo.name}`}>
      <header className="cb-head">
        <button className="cb-back" onClick={onClose} aria-label="Close combo builder">&larr;</button>
        <div>
          <h2>Build your combo</h2>
          <p>{combo.name}</p>
        </div>
      </header>

      <div className="cb-progress-wrap">
        <span className="cb-progress-text">
          {picked.length} of {need} selected
        </span>
        <div className="cb-progress-track">
          <div className="cb-progress-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="cb-list">
        {members.map((member) => {
          const id = member._id ?? member.id;
          const variant = variantOf(member);
          const chosen = picked.includes(id);
          const soldOut = variant && variant.stock === 0;
          if (!variant) return null;
          return (
            <button
              key={id}
              className={`cb-item${chosen ? ' cb-item--on' : ''}`}
              onClick={() => !soldOut && toggle(member)}
              disabled={soldOut}
              aria-pressed={chosen}
            >
              <span className="cb-check" aria-hidden="true">{chosen ? '✓' : '+'}</span>
              {member.product.thumbnail && (
                <img className="cb-thumb" src={member.product.thumbnail} alt="" loading="lazy" />
              )}
              <span className="cb-item-name">{member.product.name}</span>
              <span className="cb-item-weight">{soldOut ? 'Sold out' : member.weight}</span>
            </button>
          );
        })}
      </div>

      <footer className="cb-foot">
        <div className="cb-foot-info">
          <span className="cb-foot-status">
            {remaining > 0 ? `Choose ${remaining} more` : 'Ready to add'}
          </span>
          <span className="cb-foot-price">
            &#8377;{Number(combo.price).toLocaleString('en-IN')}
            {combo.savings > 0 && <small>Save &#8377;{combo.savings.toLocaleString('en-IN')}</small>}
          </span>
        </div>
        <button className="cb-complete" onClick={complete} disabled={remaining > 0}>
          Complete combo
        </button>
      </footer>
    </div>
  );
};

export default ComboBuilder;
