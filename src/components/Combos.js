import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useCart } from '../context/CartContext';
import { trackEvent } from '../utils/tracking';
import ComboBuilder from './ComboBuilder';
import toast from 'react-hot-toast';
import './Combos.css';

// One thumbnail per product in the combo, de-duplicated: a fixed combo can
// list the same product at two weights, which should not show twice.
const memberThumbs = (combo) => {
  const seen = new Set();
  return (combo.items || []).reduce((list, member) => {
    const product = member.product;
    const src = product?.thumbnail || product?.images?.[0];
    if (!product || !src || seen.has(String(product.id))) return list;
    seen.add(String(product.id));
    return [...list, { key: String(product.id), name: product.name, src }];
  }, []);
};

// "Save with combos" — fixed bundles add straight to the cart, "pick any N"
// bundles open the builder.
const Combos = () => {
  const { addCombo, subtotal } = useCart();
  const [combos, setCombos] = useState([]);
  const [building, setBuilding] = useState(null);

  useEffect(() => {
    api.get('/combos')
      .then((r) => setCombos(r.data.combos || []))
      .catch(() => setCombos([]));
  }, []);

  if (!combos.length) return null;

  const addFixed = (combo) => {
    // A fixed combo ships exactly its member list; quantity>1 members repeat.
    const selections = [];
    (combo.items || []).forEach((member) => {
      const variant = (member.product?.variants || []).find((v) => v.weight === member.weight);
      if (!variant) return;
      for (let i = 0; i < Math.max(1, Number(member.quantity) || 1); i += 1) {
        selections.push({ product: member.product, variant });
      }
    });

    if (!selections.length) { toast.error('This combo is unavailable right now.'); return; }

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
      metadata: { source: 'combo_card', comboName: combo.name, addedValue: Number(combo.price) || 0 },
    });
    toast.success(`${combo.name} added to cart`);
  };

  return (
    <section className="combos" id="combos" aria-label="Save with combos">
      <div className="combos-head">
        <h2 className="combos-heading">🎁 Save more with combos</h2>
        <Link to="/combos" className="combos-all">View all combos ›</Link>
      </div>

      <div className="combos-row">
        {/* Card colour comes from the combo's category, so a veg-pickle bundle
            reads the same wherever it appears — not from its position in the
            row, which changes as combos are added or reordered. */}
        {combos.map((combo) => (
          <article key={combo._id ?? combo.id} className={`combo-card combo-card--${combo.category || 'mixed'}`}>
            {(() => {
              // Show what is actually in the combo. For a "pick any N" combo
              // the pool can be longer than the card, so it is trimmed to N
              // with a "+ more" chip — the customer chooses the rest anyway.
              const shown = combo.type === 'pick'
                ? Math.max(1, Number(combo.pickCount) || 1)
                : 4;
              const thumbs = memberThumbs(combo).slice(0, shown);
              const extra = memberThumbs(combo).length - thumbs.length;
              if (!thumbs.length) {
                return combo.image
                  ? <img className="combo-img" src={combo.image} alt="" loading="lazy" />
                  : null;
              }
              return (
                <div className="combo-thumbs">
                  {thumbs.map((thumb) => (
                    <span key={thumb.key} className="combo-thumb" title={thumb.name}>
                      <img src={thumb.src} alt={thumb.name} loading="lazy" />
                    </span>
                  ))}
                  {extra > 0 && <span className="combo-thumb combo-thumb--more">+{extra}</span>}
                </div>
              );
            })()}

            <div className="combo-title-row">
              <h3 className="combo-name">{combo.name}</h3>
              {combo.savings > 0 && (
                <span className="combo-save">Save &#8377;{combo.savings.toLocaleString('en-IN')}</span>
              )}
            </div>
            {combo.subtitle && <p className="combo-sub">{combo.subtitle}</p>}

            <div className="combo-price">
              {combo.compareAtPrice > combo.price && (
                <span className="combo-mrp">&#8377;{Number(combo.compareAtPrice).toLocaleString('en-IN')}</span>
              )}
              <strong>&#8377;{Number(combo.price).toLocaleString('en-IN')}</strong>
            </div>

            {combo.type === 'pick' ? (
              <button className="combo-cta combo-cta--build" onClick={() => setBuilding(combo)}>
                Build combo &rarr;
              </button>
            ) : (
              <button className="combo-cta" onClick={() => addFixed(combo)}>
                Add to cart &rarr;
              </button>
            )}
          </article>
        ))}
      </div>

      {building && <ComboBuilder combo={building} onClose={() => setBuilding(null)} />}
    </section>
  );
};

export default Combos;
