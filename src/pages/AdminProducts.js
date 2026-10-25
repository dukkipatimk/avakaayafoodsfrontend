import React, { useCallback, useEffect, useState } from 'react';
import api from '../utils/api';
import AdminTabs from '../components/AdminTabs';
import AdminCollectionFilters from '../components/AdminCollectionFilters';
import { useCategories, setCategories } from '../utils/categories';
import './AdminProducts.css';

const WEIGHTS = ['100g', '200g', '250g', '500g', '1kg'];
// Categories come from the server: the six built-ins plus any added here (Categories button).

// Add / rename / remove the categories you've added. The built-in six stay fixed.
// A category in use by any product can't be removed (move its products first).
const CategoriesModal = ({ categories, onClose }) => {
  const [label, setLabel] = useState('');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState(false);
  const run = async (fn) => {
    setBusy(true);
    try { const { data } = await fn(); setCategories(data.categories); return true; }
    catch (err) { alert(err.response?.data?.message || 'Could not save the category'); return false; }
    finally { setBusy(false); }
  };
  const add = async (e) => {
    e.preventDefault();
    if (await run(() => api.post('/settings/categories', { label, description }))) { setLabel(''); setDescription(''); }
  };
  const rename = (c) => {
    const next = window.prompt('Category name', c.label);
    if (next == null || !next.trim()) return;
    const desc = window.prompt('Short description for the category page (optional)', c.description || '');
    run(() => api.put(`/settings/categories/${c.value}`, { label: next.trim(), description: desc ?? c.description }));
  };
  const toggle = (c) => run(() => api.put(`/settings/categories/${c.value}/enabled`, { enabled: c.enabled === false }));
  const remove = (c) => {
    if (!window.confirm(`Remove the "${c.label}" category?`)) return;
    run(() => api.delete(`/settings/categories/${c.value}`));
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 560 }}>
        <div className="modal-header">
          <h2>Product categories</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{ padding: '0 1.5rem 1.5rem' }}>
          <p style={{ marginTop: 0, color: '#6b6b6b', fontSize: '.9rem' }}>
            Categories you add appear in the shop menu, the footer and the Products filter, each with its own page at /collections/&lt;name&gt;.
            Turn a category <strong>off</strong> to hide it and all its products from the shop; turn it back on to bring them back.
          </p>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem' }}>
            {categories.map((c) => (
              <li key={c.value} style={{ display: 'flex', alignItems: 'center', gap: '.5rem', padding: '.45rem 0', borderBottom: '1px solid #eee' }}>
                <span style={{ flex: 1, opacity: c.enabled === false ? 0.55 : 1 }}><strong>{c.label}</strong> <span style={{ color: '#999', fontSize: '.8rem' }}>/collections/{c.value}</span>{c.enabled === false && <span style={{ color: '#b45309', fontSize: '.8rem', marginLeft: '.4rem' }}>hidden from shop</span>}</span>
                <label style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.85rem', cursor: 'pointer' }} title="Show this category and its products in the shop">
                  <input type="checkbox" checked={c.enabled !== false} disabled={busy} onChange={() => toggle(c)} /> {c.enabled === false ? 'Off' : 'On'}
                </label>
                {c.builtIn ? <span style={{ color: '#999', fontSize: '.8rem' }}>built-in</span> : (<>
                  <button type="button" className="btn btn-outline" disabled={busy} onClick={() => rename(c)}>Edit</button>
                  <button type="button" className="btn btn-outline" disabled={busy} onClick={() => remove(c)}>Remove</button>
                </>)}
              </li>
            ))}
          </ul>
          <form onSubmit={add} className="product-form" style={{ padding: 0 }}>
            <div className="form-group">
              <label>New category name *</label>
              <input type="text" required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Millet Mixes" />
            </div>
            <div className="form-group">
              <label>Short description <span style={{ fontWeight: 400, color: '#999' }}>(shown on its page, optional)</span></label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={busy || !label.trim()}>{busy ? 'Saving…' : '+ Add category'}</button>
          </form>
        </div>
      </div>
    </div>
  );
};

// shippingType values must match the Product model enum: 'standard' | 'international' | 'both'
const SHIPPING_TYPES = [
  { value: 'both', label: 'India + International' },
  { value: 'standard', label: 'India Only' },
  { value: 'international', label: 'International Only' },
];

const emptyVariant = w => ({ weight: w, price: '', mrp: '', stock: 100, sku: '' });

const emptyProduct = {
  name: '', description: '', shortDescription: '', category: 'pickles',
  isVeg: true, isFeatured: false, ingredients: '', allergens: '', shelfLife: '',
  tags: [], shippingType: 'both', thumbnail: '', images: [],
  variants: WEIGHTS.map(emptyVariant)
};

// Storefront stores ingredients/allergens/tags as JSON arrays; the form edits them
// as comma/newline text. Convert between the two on load and save.
const splitToArray = str =>
  String(str || '').split(/[,\n]/).map(s => s.trim()).filter(Boolean);
const joinToText = val =>
  Array.isArray(val) ? val.join(', ') : String(val || '');

/* ── Stock status helper ── */
const getStockStatus = variants => {
  if (!variants || variants.length === 0) return null;
  const activeVariants = variants.filter(v => v.price);
  if (activeVariants.length === 0) return null;
  if (activeVariants.some(v => v.stock === 0)) return 'out';
  if (activeVariants.some(v => v.stock <= 5)) return 'low';
  return 'ok';
};

const StockBadge = ({ variants }) => {
  const status = getStockStatus(variants);
  if (!status) return <span className="stock-badge stock-na">—</span>;
  if (status === 'out') return <span className="stock-badge stock-out">✕ Out of Stock</span>;
  if (status === 'low') return <span className="stock-badge stock-low">⚠ Low Stock</span>;
  return <span className="stock-badge stock-ok">✓</span>;
};

/* ── Bulk Stock Update Panel ── */
const BulkStockPanel = ({ product, onClose, onSaved }) => {
  const [stocks, setStocks] = useState(() => {
    const map = {};
    (product.variants || []).forEach(v => { map[v.weight] = v.stock ?? 0; });
    return map;
  });
  const [saving, setSaving] = useState(false);

  const activeVariants = (product.variants || []).filter(v => v.price);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updatedVariants = product.variants.map(v => ({
        ...v,
        stock: Number(stocks[v.weight] ?? v.stock),
      }));
      const payload = { ...product, variants: updatedVariants };
      await api.put(`/products/${product._id}`, payload);
      onSaved(product._id, updatedVariants);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update stock');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bulk-stock-panel" onClick={e => e.stopPropagation()}>
      <div className="bulk-stock-header">
        <span className="bulk-stock-title">Update Stock — {product.name}</span>
        <button className="bulk-stock-close" onClick={onClose}>✕</button>
      </div>
      {activeVariants.length === 0 ? (
        <p className="bulk-stock-empty">No active variants.</p>
      ) : (
        <div className="bulk-stock-rows">
          {activeVariants.map(v => (
            <div key={v.weight} className="bulk-stock-row">
              <span className="bulk-stock-weight">{v.weight}</span>
              <input
                type="number"
                min="0"
                value={stocks[v.weight] ?? v.stock}
                onChange={e => setStocks(prev => ({ ...prev, [v.weight]: e.target.value }))}
                className="bulk-stock-input"
              />
            </div>
          ))}
        </div>
      )}
      <div className="bulk-stock-footer">
        <button className="btn-table-edit btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || activeVariants.length === 0}>
          {saving ? 'Saving…' : 'Save Stock'}
        </button>
      </div>
    </div>
  );
};

/* ── Inline Price Update Panel ── */
const PriceUpdatePanel = ({ product, onClose, onSaved }) => {
  const [prices, setPrices] = useState(() => {
    const map = {};
    (product.variants || []).forEach(v => {
      map[v.weight] = { price: v.price ?? '', mrp: v.mrp ?? '' };
    });
    return map;
  });
  const [saving, setSaving] = useState(false);

  const activeVariants = (product.variants || []).filter(v => v.price);

  const handleSave = async () => {
    const updatedVariants = product.variants.map(v => ({
      ...v,
      price: Number(prices[v.weight]?.price ?? v.price),
      mrp: Number(prices[v.weight]?.mrp ?? v.mrp),
    }));
    if (updatedVariants.some(v => v.price <= 0 || v.mrp <= 0)) {
      alert('Price and MRP must be greater than zero.');
      return;
    }
    if (updatedVariants.some(v => v.mrp < v.price)) {
      alert('MRP cannot be lower than selling price.');
      return;
    }

    setSaving(true);
    try {
      await api.put(`/products/${product._id}`, { ...product, variants: updatedVariants });
      onSaved(product._id, updatedVariants);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update prices');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bulk-price-panel" onClick={e => e.stopPropagation()}>
      <div className="bulk-stock-header">
        <span className="bulk-stock-title">Update Prices — {product.name}</span>
        <button className="bulk-stock-close" onClick={onClose}>✕</button>
      </div>
      {activeVariants.length === 0 ? (
        <p className="bulk-stock-empty">No active variants.</p>
      ) : (
        <div className="bulk-price-rows">
          {activeVariants.map(v => (
            <div key={v.weight} className="bulk-price-row">
              <span className="bulk-stock-weight">{v.weight}</span>
              <label>
                Price
                <input
                  type="number"
                  min="1"
                  value={prices[v.weight]?.price ?? v.price}
                  onChange={e => setPrices(prev => ({
                    ...prev,
                    [v.weight]: { ...prev[v.weight], price: e.target.value },
                  }))}
                  className="bulk-stock-input"
                />
              </label>
              <label>
                MRP
                <input
                  type="number"
                  min="1"
                  value={prices[v.weight]?.mrp ?? v.mrp}
                  onChange={e => setPrices(prev => ({
                    ...prev,
                    [v.weight]: { ...prev[v.weight], mrp: e.target.value },
                  }))}
                  className="bulk-stock-input"
                />
              </label>
            </div>
          ))}
        </div>
      )}
      <div className="bulk-stock-footer">
        <button className="btn-table-edit btn-sm" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={saving || activeVariants.length === 0}>
          {saving ? 'Saving…' : 'Save Prices'}
        </button>
      </div>
    </div>
  );
};

/* ── Main Component ── */
const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  // The list holds withdrawn products now, so it needs a way to say which kind
  // you are looking at. Defaults to active — the day-to-day view.
  const [visibility, setVisibility] = useState('active');
  const [bulkStockProductId, setBulkStockProductId] = useState(null);
  const [priceProductId, setPriceProductId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const categories = useCategories();
  const [showCategories, setShowCategories] = useState(false);

  // Withdrawn products are invisible to the shop, which is the point — but the
  // admin has to be able to find one to put it back. `status=all` is honoured
  // for staff only; the storefront's own calls are unchanged.
  const fetchProducts = useCallback(() => {
    setLoading(true);
    api.get('/products?limit=100&status=all').then(res => {
      setProducts(res.data.products || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const openNew = () => {
    setForm(emptyProduct);
    setEditing(null);
    setShowForm(true);
    setBulkStockProductId(null);
    setPriceProductId(null);
  };

  const openEdit = product => {
    setForm({
      ...product,
      shortDescription: product.shortDescription || '',
      shelfLife: product.shelfLife || '',
      ingredients: joinToText(product.ingredients),
      allergens: joinToText(product.allergens),
      tags: Array.isArray(product.tags) ? product.tags : [],
      thumbnail: product.thumbnail || '',
      images: Array.isArray(product.images) ? product.images : [],
      variants: WEIGHTS.map(w => {
        const v = product.variants?.find(v => v.weight === w);
        return v ? { ...v } : emptyVariant(w);
      })
    });
    setEditing(product._id);
    setShowForm(true);
    setBulkStockProductId(null);
    setPriceProductId(null);
  };

  const uploadImage = async file => {
    const fd = new FormData();
    fd.append('image', file);
    const { data } = await api.post('/products/upload', fd);
    return data.url;
  };

  const handleThumbUpload = async e => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      setForm(prev => ({ ...prev, thumbnail: url }));
    } catch (err) {
      alert(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleGalleryUpload = async e => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const f of files) urls.push(await uploadImage(f));
      setForm(prev => ({ ...prev, images: [...(prev.images || []), ...urls] }));
    } catch (err) {
      alert(err.response?.data?.message || 'Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const removeGalleryImage = url => {
    setForm(prev => ({ ...prev, images: (prev.images || []).filter(u => u !== url) }));
  };

  const handleVariantChange = (weight, field, value) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.map(v => v.weight === weight ? { ...v, [field]: value } : v)
    }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        ingredients: splitToArray(form.ingredients),
        allergens: splitToArray(form.allergens),
        tags: Array.isArray(form.tags) ? form.tags : [],
        variants: form.variants.filter(v => v.price && v.mrp)
          .map(v => ({ ...v, price: Number(v.price), mrp: Number(v.mrp), stock: Number(v.stock) }))
      };
      if (editing) {
        await api.put(`/products/${editing}`, payload);
      } else {
        await api.post('/products', payload);
      }
      setShowForm(false);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async id => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) { alert('Could not delete product'); }
  };

  const handleBulkStockSaved = (productId, updatedVariants) => {
    setProducts(prev => prev.map(p =>
      p._id === productId ? { ...p, variants: updatedVariants } : p
    ));
  };

  const handlePricesSaved = (productId, updatedVariants) => {
    setProducts(prev => prev.map(p =>
      p._id === productId ? { ...p, variants: updatedVariants } : p
    ));
  };

  const filtered = products.filter(p => {
    if (visibility === 'active' && p.isActive === false) return false;
    if (visibility === 'inactive' && p.isActive !== false) return false;
    return p.name?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="admin-products-page admin-workspace">
      <div className="container">
        <AdminTabs />

        {/* Same bar as Coupons, Combos and Stores: search, what to show, and the
            one button this page exists for. */}
        <AdminCollectionFilters
          search={search} onSearch={setSearch}
          status={visibility} onStatus={setVisibility}
          count={filtered.length} noun="products" loading={loading}
          action={<>
            <button className="btn btn-outline" onClick={() => setShowCategories(true)} style={{ marginRight: '.5rem' }}>Categories</button>
            <button className="btn btn-primary" onClick={openNew}>+ Add Product</button>
          </>}
        />

        {/* Product table */}
        {loading ? (
          <div className="loading-spinner" style={{ margin: '4rem auto' }} />
        ) : (
          <div className="admin-table-wrap" style={{ position: 'relative' }}>
            <table className="admin-table products-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Variants</th>
                  <th>Price Range</th>
                  <th>Stock</th>
                  <th>Featured</th>
                  <th>Veg</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => {
                  const prices = p.variants?.map(v => v.price).filter(Boolean) || [];
                  const min = Math.min(...prices);
                  const max = Math.max(...prices);
                  const isStockPanelOpen = bulkStockProductId === p._id;
                  const isPricePanelOpen = priceProductId === p._id;
                  return (
                    <React.Fragment key={p._id}>
                      <tr>
                        <td>
                          <div className="product-name-cell">
                            <strong>{p.name}</strong>
                            {/* Withdrawn products are in this list now, and two
                                rows that look alike but only one of which the
                                shop can sell is worse than not listing them. */}
                            {p.isActive === false && <span className="status-toggle inactive" title="Not on the storefront">Inactive</span>}
                            <span className="cell-sub slug">{p.slug}</span>
                          </div>
                        </td>
                        <td>
                          <span className="category-badge">{categories.find((c) => c.value === p.category)?.label || p.category}</span>
                        </td>
                        <td>{p.variants?.length || 0}</td>
                        <td>
                          {prices.length > 0
                            ? min === max ? `₹${min}` : `₹${min} – ₹${max}`
                            : '—'
                          }
                        </td>
                        <td>
                          <StockBadge variants={p.variants} />
                        </td>
                        <td>{p.isFeatured ? '⭐' : '—'}</td>
                        <td>{p.isVeg ? '🟢' : '🔴'}</td>
                        <td>
                          <div className="table-actions">
                            <button className="btn-table-edit" onClick={() => openEdit(p)}>Edit</button>
                            <button
                              className={`btn-table-stock${isStockPanelOpen ? ' active' : ''}`}
                              onClick={() => {
                                setBulkStockProductId(isStockPanelOpen ? null : p._id);
                                setPriceProductId(null);
                              }}
                            >
                              Stock
                            </button>
                            <button
                              className={`btn-table-price${isPricePanelOpen ? ' active' : ''}`}
                              onClick={() => {
                                setPriceProductId(isPricePanelOpen ? null : p._id);
                                setBulkStockProductId(null);
                              }}
                            >
                              Price
                            </button>
                            <button className="btn-table-delete" onClick={() => handleDelete(p._id)}>Delete</button>
                          </div>
                        </td>
                      </tr>
                      {isStockPanelOpen && (
                        <tr className="bulk-stock-row-tr">
                          <td colSpan={8} style={{ padding: 0, background: '#f9fafb' }}>
                            <BulkStockPanel
                              product={p}
                              onClose={() => setBulkStockProductId(null)}
                              onSaved={handleBulkStockSaved}
                            />
                          </td>
                        </tr>
                      )}
                      {isPricePanelOpen && (
                        <tr className="bulk-stock-row-tr">
                          <td colSpan={8} style={{ padding: 0, background: '#f9fafb' }}>
                            <PriceUpdatePanel
                              product={p}
                              onClose={() => setPriceProductId(null)}
                              onSaved={handlePricesSaved}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="table-empty">No products found.</div>
            )}
          </div>
        )}
      </div>

      {showCategories && <CategoriesModal categories={categories} onClose={() => setShowCategories(false)} />}

      {/* Form modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editing ? 'Edit Product' : 'Add Product'}</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>

            <form className="product-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input type="text" required value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <select value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value })}>
                    {categories.map(c => <option key={c.value} value={c.value}>{c.label}{c.enabled === false ? ' (hidden from shop)' : ''}</option>)}
                    {form.category && !categories.some(c => c.value === form.category) && <option value={form.category}>{form.category}</option>}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Short Description</label>
                <input type="text" value={form.shortDescription}
                  placeholder="One-line summary shown on product cards & search"
                  onChange={e => setForm({ ...form, shortDescription: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea required rows={3} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Ingredients</label>
                <textarea rows={2} value={form.ingredients}
                  placeholder="Comma-separated, e.g. Mango, Sesame oil, Salt, Red chilli"
                  onChange={e => setForm({ ...form, ingredients: e.target.value })} />
                <p className="field-note">Separate each ingredient with a comma.</p>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Shelf Life</label>
                  <input type="text" value={form.shelfLife}
                    placeholder="e.g. 6 months from manufacture"
                    onChange={e => setForm({ ...form, shelfLife: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Allergens</label>
                  <input type="text" value={form.allergens}
                    placeholder="Comma-separated, e.g. Mustard, Sesame"
                    onChange={e => setForm({ ...form, allergens: e.target.value })} />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={form.isVeg}
                      onChange={e => setForm({ ...form, isVeg: e.target.checked })} />
                    Vegetarian
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={form.isFeatured}
                      onChange={e => setForm({ ...form, isFeatured: e.target.checked })} />
                    Featured
                  </label>
                </div>
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input type="checkbox" checked={form.tags?.includes('bestseller')}
                      onChange={e => setForm(prev => ({
                        ...prev,
                        tags: e.target.checked
                          ? [...new Set([...(prev.tags || []), 'bestseller'])]
                          : (prev.tags || []).filter(t => t !== 'bestseller'),
                      }))} />
                    Bestseller
                  </label>
                </div>
                <div className="form-group">
                  <label>Ships To</label>
                  <select value={form.shippingType}
                    onChange={e => setForm({ ...form, shippingType: e.target.value })}>
                    {SHIPPING_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Images */}
              <div className="form-group">
                <label>Main Image (thumbnail)</label>
                <div className="img-upload-row">
                  {form.thumbnail ? (
                    <div className="img-thumb-preview">
                      <img src={form.thumbnail} alt="thumbnail" />
                      <button type="button" className="img-remove"
                        onClick={() => setForm({ ...form, thumbnail: '' })}>✕</button>
                    </div>
                  ) : (
                    <div className="img-thumb-empty">No image</div>
                  )}
                  <label className="btn btn-outline btn-sm img-upload-btn">
                    {form.thumbnail ? 'Replace' : 'Upload'}
                    <input type="file" accept="image/*" hidden onChange={handleThumbUpload} />
                  </label>
                </div>
              </div>

              <div className="form-group">
                <label>Gallery Images</label>
                <div className="img-gallery">
                  {(form.images || []).map(url => (
                    <div key={url} className="img-thumb-preview">
                      <img src={url} alt="" />
                      <button type="button" className="img-remove"
                        onClick={() => removeGalleryImage(url)}>✕</button>
                    </div>
                  ))}
                  <label className="img-add-tile" title="Add image(s)">
                    +
                    <input type="file" accept="image/*" multiple hidden onChange={handleGalleryUpload} />
                  </label>
                </div>
                {uploading && <p className="field-note">Uploading…</p>}
              </div>

              {/* Variants */}
              <div className="variants-section">
                <h3 className="variants-title">Variants — fill Price & MRP to activate</h3>
                <div className="variants-grid">
                  {form.variants.map(v => (
                    <div key={v.weight} className="variant-row">
                      <div className="variant-weight-label">{v.weight}</div>
                      <div className="form-group">
                        <label>Price (₹)</label>
                        <input type="number" min="0" value={v.price}
                          onChange={e => handleVariantChange(v.weight, 'price', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>MRP (₹)</label>
                        <input type="number" min="0" value={v.mrp}
                          onChange={e => handleVariantChange(v.weight, 'mrp', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label>Stock</label>
                        <input type="number" min="0" value={v.stock}
                          onChange={e => handleVariantChange(v.weight, 'stock', e.target.value)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving || uploading}>
                  {saving ? 'Saving…' : uploading ? 'Uploading…' : editing ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
