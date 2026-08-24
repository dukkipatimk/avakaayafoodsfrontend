import React, { useEffect, useMemo, useState } from 'react';
import api from '../utils/api';
import AdminTabs from '../components/AdminTabs';
import toast from 'react-hot-toast';
import './AdminDashboard.css';
import './AdminCombos.css';

const money = (n) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const emptyCombo = {
  name: '', subtitle: '', image: '', type: 'fixed', pickCount: 3, price: '',
  isActive: true, sortOrder: 0, items: [],
};

/* ── Create / edit modal ── */
const ComboModal = ({ combo, products, onClose, onSaved }) => {
  const [form, setForm] = useState(() => combo ? {
    name: combo.name || '',
    subtitle: combo.subtitle || '',
    image: combo.image || '',
    type: combo.type || 'fixed',
    pickCount: combo.pickCount || 3,
    price: String(combo.price ?? ''),
    isActive: combo.isActive !== false,
    sortOrder: combo.sortOrder || 0,
    items: (combo.items || []).map((i) => ({
      productId: i.productId, weight: i.weight, quantity: i.quantity || 1,
    })),
  } : { ...emptyCombo });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const addMember = () => {
    const first = products[0];
    const weight = first?.variants?.[0]?.weight;
    if (!first || !weight) { toast.error('No products with variants available'); return; }
    set('items', [...form.items, { productId: first._id ?? first.id, weight, quantity: 1 }]);
  };

  const updateMember = (index, patch) => {
    set('items', form.items.map((m, i) => (i === index ? { ...m, ...patch } : m)));
  };

  const removeMember = (index) => set('items', form.items.filter((_, i) => i !== index));

  // What the members would cost bought loose — mirrors the API's compareAtPrice
  // so the admin can see the discount before saving.
  const looseTotal = useMemo(() => {
    const unit = (member) => {
      const product = products.find((p) => String(p._id ?? p.id) === String(member.productId));
      const variant = (product?.variants || []).find((v) => v.weight === member.weight);
      return Number(variant?.price) || 0;
    };
    if (form.type === 'pick') {
      const n = Math.max(1, Number(form.pickCount) || 1);
      return form.items.map(unit).sort((a, b) => b - a).slice(0, n).reduce((s, p) => s + p, 0);
    }
    return form.items.reduce((s, m) => s + unit(m) * Math.max(1, Number(m.quantity) || 1), 0);
  }, [form.items, form.type, form.pickCount, products]);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        price: Number(form.price) || 0,
        pickCount: parseInt(form.pickCount, 10) || 3,
        sortOrder: parseInt(form.sortOrder, 10) || 0,
      };
      const { data } = combo
        ? await api.put(`/combos/${combo._id ?? combo.id}`, payload)
        : await api.post('/combos', payload);
      onSaved(data.combo);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save combo');
    } finally {
      setSaving(false);
    }
  };

  const savings = looseTotal - (Number(form.price) || 0);

  return (
    <div className="combo-modal-overlay" onClick={onClose}>
      <div className="combo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="combo-modal-header">
          <h2>{combo ? 'Edit combo' : 'Create combo'}</h2>
          <button className="combo-modal-close" onClick={onClose}>✕</button>
        </div>

        <form className="combo-form" onSubmit={submit}>
          <div className="combo-form-row">
            <div className="combo-form-group">
              <label>Name *</label>
              <input value={form.name} onChange={(e) => set('name', e.target.value)} required placeholder="Pick Any 3 Veg Pickles" />
            </div>
            <div className="combo-form-group">
              <label>Subtitle</label>
              <input value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} placeholder="4 x 500g" />
            </div>
          </div>

          <div className="combo-form-row">
            <div className="combo-form-group">
              <label>Type</label>
              <select value={form.type} onChange={(e) => set('type', e.target.value)}>
                <option value="fixed">Fixed set — customer gets exactly these items</option>
                <option value="pick">Pick any N — customer chooses from the pool</option>
              </select>
            </div>
            {form.type === 'pick' && (
              <div className="combo-form-group combo-form-group--narrow">
                <label>How many to pick *</label>
                <input type="number" min="1" value={form.pickCount} onChange={(e) => set('pickCount', e.target.value)} />
              </div>
            )}
          </div>

          <div className="combo-form-row">
            <div className="combo-form-group combo-form-group--narrow">
              <label>Combo price (₹) *</label>
              <input type="number" min="0" step="1" value={form.price} onChange={(e) => set('price', e.target.value)} required />
            </div>
            <div className="combo-form-group combo-form-group--narrow">
              <label>Sort order</label>
              <input type="number" value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} />
            </div>
            <div className="combo-form-group combo-form-group--narrow">
              <label>Active</label>
              <select value={form.isActive ? 'yes' : 'no'} onChange={(e) => set('isActive', e.target.value === 'yes')}>
                <option value="yes">Live on storefront</option>
                <option value="no">Hidden</option>
              </select>
            </div>
          </div>

          <div className="combo-form-group">
            <label>Image URL</label>
            <input value={form.image} onChange={(e) => set('image', e.target.value)} placeholder="/images/combos/veg-3.jpg" />
          </div>

          <div className="combo-members">
            <div className="combo-members-head">
              <h3>{form.type === 'pick' ? 'Products customers can choose from' : 'Products in this combo'}</h3>
              <button type="button" className="combo-add-member" onClick={addMember}>+ Add product</button>
            </div>

            {form.items.length === 0 && <p className="combo-members-empty">No products added yet.</p>}

            {form.items.map((member, index) => {
              const product = products.find((p) => String(p._id ?? p.id) === String(member.productId));
              const variants = product?.variants || [];
              return (
                <div key={index} className="combo-member-row">
                  <select
                    value={member.productId}
                    onChange={(e) => {
                      const next = products.find((p) => String(p._id ?? p.id) === e.target.value);
                      updateMember(index, {
                        productId: e.target.value,
                        weight: next?.variants?.[0]?.weight || '',
                      });
                    }}
                  >
                    {products.map((p) => (
                      <option key={p._id ?? p.id} value={p._id ?? p.id}>{p.name}</option>
                    ))}
                  </select>

                  <select value={member.weight} onChange={(e) => updateMember(index, { weight: e.target.value })}>
                    {variants.map((v) => (
                      <option key={v.weight} value={v.weight}>{v.weight} — {money(v.price)}</option>
                    ))}
                  </select>

                  {form.type === 'fixed' && (
                    <input
                      type="number" min="1" className="combo-member-qty"
                      value={member.quantity}
                      onChange={(e) => updateMember(index, { quantity: e.target.value })}
                    />
                  )}

                  <button type="button" className="combo-member-remove" onClick={() => removeMember(index)}>✕</button>
                </div>
              );
            })}
          </div>

          <div className="combo-preview">
            <span>Loose price: <strong>{money(looseTotal)}</strong></span>
            <span>Combo price: <strong>{money(form.price)}</strong></span>
            <span className={savings > 0 ? 'combo-preview-good' : 'combo-preview-bad'}>
              {savings > 0 ? `Customer saves ${money(savings)}` : 'No saving — check the price'}
            </span>
          </div>

          {error && <p className="combo-form-error">{error}</p>}

          <div className="combo-form-actions">
            <button type="button" onClick={onClose}>Cancel</button>
            <button type="submit" disabled={saving}>{saving ? 'Saving…' : combo ? 'Save changes' : 'Create combo'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AdminCombos = () => {
  const [combos, setCombos] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(undefined);   // undefined = closed, null = new

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/combos/admin/all'),
      api.get('/products?limit=200'),
    ])
      .then(([comboRes, productRes]) => {
        setCombos(comboRes.data.combos || []);
        setProducts((productRes.data.products || []).filter((p) => (p.variants || []).length));
      })
      .catch(() => toast.error('Could not load combos'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const remove = async (combo) => {
    if (!window.confirm(`Delete "${combo.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/combos/${combo._id ?? combo.id}`);
      setCombos((list) => list.filter((c) => (c._id ?? c.id) !== (combo._id ?? combo.id)));
      toast.success('Combo deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete combo');
    }
  };

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1 className="admin-title">Admin Dashboard</h1>
        </div>
        <AdminTabs />

        <div className="section-header-row">
          <h2 className="section-title">Combos ({combos.length})</h2>
          <button className="btn btn-primary" onClick={() => setEditing(null)}>+ New Combo</button>
        </div>

        {loading && <p className="combo-empty">Loading…</p>}
        {!loading && combos.length === 0 && (
          <p className="combo-empty">No combos yet. Create one to show a “Save with combos” row on the storefront.</p>
        )}

        <div className="combo-table">
          {combos.map((combo) => (
            <div key={combo._id ?? combo.id} className={`combo-row${combo.isActive ? '' : ' combo-row--off'}`}>
              <div className="combo-row-main">
                <strong>{combo.name}</strong>
                <span className="combo-row-meta">
                  {combo.type === 'pick' ? `Pick any ${combo.pickCount}` : 'Fixed set'}
                  {' · '}{(combo.items || []).length} products
                  {!combo.isActive && ' · hidden'}
                </span>
              </div>
              <div className="combo-row-price">
                {combo.compareAtPrice > combo.price && <s>{money(combo.compareAtPrice)}</s>}
                <strong>{money(combo.price)}</strong>
                {combo.savings > 0 && <span className="combo-row-save">save {money(combo.savings)}</span>}
              </div>
              <div className="combo-row-actions">
                <button onClick={() => setEditing(combo)}>Edit</button>
                <button className="combo-row-delete" onClick={() => remove(combo)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editing !== undefined && (
        <ComboModal
          combo={editing}
          products={products}
          onClose={() => setEditing(undefined)}
          onSaved={() => load()}
        />
      )}
    </div>
  );
};

export default AdminCombos;
