import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import AdminTabs from '../components/AdminTabs';
import './AdminProducts.css';

const WEIGHTS = ['100g', '200g', '250g', '500g', '1kg'];
const CATEGORIES = ['pickles', 'powders', 'snacks', 'sweets', 'gift-hampers'];

const emptyVariant = w => ({ weight: w, price: '', mrp: '', stock: 100, sku: '' });

const emptyProduct = {
  name: '', description: '', category: 'pickles', isVeg: true, isFeatured: false,
  ingredients: '', shippingType: 'both', thumbnail: '', images: [],
  variants: WEIGHTS.map(emptyVariant)
};

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
  const [bulkStockProductId, setBulkStockProductId] = useState(null);
  const [priceProductId, setPriceProductId] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchProducts = () => {
    api.get('/products?limit=100').then(res => {
      setProducts(res.data.products || []);
    }).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(fetchProducts, []);

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

  const filtered = products.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="admin-products-page">
      <div className="container">
        <div className="admin-header">
          <h1 className="admin-title">Admin Dashboard</h1>
        </div>

        <AdminTabs />

        <div className="section-header-row">
          <h2 className="section-title">Products</h2>
          <button className="btn btn-primary" onClick={openNew}>+ Add Product</button>
        </div>

        {/* Search */}
        <div className="product-search">
          <input
            type="search" placeholder="Search products…"
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>

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
                            <span className="cell-sub slug">{p.slug}</span>
                          </div>
                        </td>
                        <td>
                          <span className="category-badge">{p.category}</span>
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
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea required rows={3} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <div className="form-group">
                <label>Ingredients</label>
                <textarea rows={2} value={form.ingredients}
                  onChange={e => setForm({ ...form, ingredients: e.target.value })} />
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
                <div className="form-group">
                  <label>Ships To</label>
                  <select value={form.shippingType}
                    onChange={e => setForm({ ...form, shippingType: e.target.value })}>
                    <option value="both">India + International</option>
                    <option value="india-only">India Only</option>
                    <option value="international-only">International Only</option>
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
