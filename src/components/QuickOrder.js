import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { reorderableItems } from '../utils/reorder';
import { trackEvent } from '../utils/tracking';
import './QuickOrder.css';

// Text-only rapid ordering for customers who already know what they want.
// Deliberately image-free: the list stays dense so a regular can fill a basket
// in a handful of taps.
const QuickOrder = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { items, addItem, updateQuantity, totalItems, subtotal } = useCart();
  const navigate = useNavigate();

  const [products, setProducts] = useState([]);
  const [favouriteIds, setFavouriteIds] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [weights, setWeights] = useState({});   // productId -> chosen weight

  // Load the catalogue the first time the sheet opens, not on mount.
  useEffect(() => {
    if (!isOpen || products.length) return;
    setLoading(true);
    api.get('/products?sort=popular&limit=60')
      .then((r) => setProducts(r.data.products || []))
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [isOpen, products.length]);

  // Previously-ordered products float to the top of the list.
  useEffect(() => {
    if (!isOpen || !user) return;
    api.get('/orders/my')
      .then((r) => {
        const ids = [];
        (r.data.orders || []).forEach((order) =>
          reorderableItems(order).forEach((item) => {
            if (!ids.includes(String(item.productId))) ids.push(String(item.productId));
          })
        );
        setFavouriteIds(ids);
      })
      .catch(() => setFavouriteIds([]));
  }, [isOpen, user]);

  // Lock background scrolling while the sheet is up.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matches = q
      ? products.filter((p) =>
          (p.name || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q))
      : products;
    const rank = (p) => {
      const idx = favouriteIds.indexOf(String(p._id ?? p.id));
      return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
    };
    return [...matches].sort((a, b) => rank(a) - rank(b));
  }, [products, query, favouriteIds]);

  if (!isOpen) return null;

  const variantFor = (product) => {
    const list = product.variants || [];
    const chosen = weights[product._id ?? product.id];
    return list.find((v) => v.weight === chosen) || list[0];
  };

  const qtyOf = (product, variant) => {
    const line = items.find((i) =>
      !i.bundleId && String(i.productId) === String(product._id ?? product.id) && i.weight === variant?.weight);
    return line ? line.quantity : 0;
  };

  const step = (product, variant, nextQty) => {
    const productId = product._id ?? product.id;
    if (nextQty > 0 && variant.stock !== undefined && nextQty > variant.stock) return;
    if (qtyOf(product, variant) === 0 && nextQty === 1) {
      addItem(product, variant);
      trackEvent('add_to_cart', {
        productId,
        cartValue: subtotal + (Number(variant.price) || 0),
        cartItems: [{ productId, name: product.name, weight: variant.weight, quantity: 1, price: variant.price }],
        metadata: { source: 'quick_order', addedValue: Number(variant.price) || 0 },
      });
      return;
    }
    updateQuantity(productId, variant.weight, nextQty);
  };

  const showFavouritesHeading = favouriteIds.length > 0 && !query.trim();
  const favouriteRowCount = showFavouritesHeading
    ? rows.filter((p) => favouriteIds.includes(String(p._id ?? p.id))).length
    : 0;

  return (
    <div className="qo" role="dialog" aria-modal="true" aria-label="Quick order">
      <header className="qo-head">
        <button className="qo-back" onClick={onClose} aria-label="Close quick order">&larr;</button>
        <h2>Quick Order</h2>
      </header>

      <div className="qo-search-wrap">
        <input
          className="qo-search"
          type="search"
          placeholder="Search products..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
      </div>

      <div className="qo-list">
        {loading && <p className="qo-empty">Loading products...</p>}
        {!loading && rows.length === 0 && <p className="qo-empty">No products match that search.</p>}

        {!loading && showFavouritesHeading && favouriteRowCount > 0 && (
          <p className="qo-group">Your favourites</p>
        )}

        {!loading && rows.map((product, index) => {
          const variant = variantFor(product);
          if (!variant) return null;
          const productId = product._id ?? product.id;
          const qty = qtyOf(product, variant);
          // Heading appears once, at the boundary between reordered and new items.
          const startsAllProducts = showFavouritesHeading && favouriteRowCount > 0 && index === favouriteRowCount;
          return (
            <React.Fragment key={productId}>
              {startsAllProducts && <p className="qo-group">All products</p>}
              <div className="qo-row">
                <div className="qo-row-main">
                  <span className="qo-name">{product.name}</span>
                  <div className="qo-row-meta">
                    {(product.variants || []).length > 1 ? (
                      <select
                        className="qo-weight"
                        value={variant.weight}
                        onChange={(e) => setWeights((w) => ({ ...w, [productId]: e.target.value }))}
                        aria-label={`Size for ${product.name}`}
                      >
                        {product.variants.map((v) => (
                          <option key={v.weight} value={v.weight}>{v.weight}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="qo-weight qo-weight--static">{variant.weight}</span>
                    )}
                    <span className="qo-price">&#8377;{Number(variant.price).toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {variant.stock === 0 ? (
                  <span className="qo-oos">Out of stock</span>
                ) : qty > 0 ? (
                  <div className="qo-stepper">
                    <button onClick={() => step(product, variant, qty - 1)} aria-label={`Remove one ${product.name}`}>&minus;</button>
                    <span>{qty}</span>
                    <button onClick={() => step(product, variant, qty + 1)} aria-label={`Add one ${product.name}`}>+</button>
                  </div>
                ) : (
                  <button className="qo-add" onClick={() => step(product, variant, 1)} aria-label={`Add ${product.name}`}>+</button>
                )}
              </div>
            </React.Fragment>
          );
        })}
      </div>

      <footer className="qo-foot">
        <span className="qo-foot-summary">
          {totalItems} {totalItems === 1 ? 'item' : 'items'}
          <strong>&#8377;{subtotal.toLocaleString('en-IN')}</strong>
        </span>
        <button
          className="qo-continue"
          disabled={totalItems === 0}
          onClick={() => { onClose(); navigate('/cart'); }}
        >
          Continue &rarr;
        </button>
      </footer>
    </div>
  );
};

export default QuickOrder;
