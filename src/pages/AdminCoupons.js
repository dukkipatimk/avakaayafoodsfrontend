import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import AdminTabs from '../components/AdminTabs';
import './AdminDashboard.css';
import './AdminCoupons.css';

const fmtDate = iso => new Date(iso).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
});
const money = n => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const emptyCoupon = {
  code: '', type: 'percent', value: '', minOrder: '0',
  maxDiscount: '0', usageLimit: '0', perUserLimit: '1', expiresAt: '',
};

/* ── Create Coupon Modal ── */
const CreateCouponModal = ({ onClose, onCreated }) => {
  const [form, setForm] = useState(emptyCoupon);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        code:         form.code.trim().toUpperCase(),
        type:         form.type,
        value:        Number(form.value),
        minOrder:     Number(form.minOrder) || 0,
        maxDiscount:  Number(form.maxDiscount) || 0,
        usageLimit:   parseInt(form.usageLimit) || 0,
        perUserLimit: parseInt(form.perUserLimit) || 1,
        expiresAt:    form.expiresAt || null,
      };
      const { data } = await api.post('/coupons', payload);
      onCreated(data.coupon);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create coupon');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="coupon-modal-overlay" onClick={onClose}>
      <div className="coupon-modal" onClick={e => e.stopPropagation()}>
        <div className="coupon-modal-header">
          <h2>Create Coupon</h2>
          <button className="coupon-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="coupon-form" onSubmit={handleSubmit}>
          <div className="coupon-form-group">
            <label>Coupon Code *</label>
            <input
              type="text" required value={form.code}
              placeholder="e.g. WELCOME10"
              onChange={e => set('code', e.target.value.toUpperCase())}
            />
          </div>

          <div className="coupon-form-row">
            <div className="coupon-form-group">
              <label>Discount Type *</label>
              <select value={form.type} onChange={e => set('type', e.target.value)}>
                <option value="percent">Percentage (%)</option>
                <option value="flat">Flat amount (₹)</option>
              </select>
            </div>
            <div className="coupon-form-group">
              <label>{form.type === 'percent' ? 'Discount % *' : 'Discount ₹ *'}</label>
              <input
                type="number" required min="0" step="0.01" value={form.value}
                onChange={e => set('value', e.target.value)}
              />
            </div>
          </div>

          <div className="coupon-form-row">
            <div className="coupon-form-group">
              <label>Minimum Order (₹)</label>
              <input
                type="number" min="0" value={form.minOrder}
                onChange={e => set('minOrder', e.target.value)}
              />
            </div>
            <div className="coupon-form-group">
              <label>Max Discount (₹)</label>
              <input
                type="number" min="0" value={form.maxDiscount}
                disabled={form.type === 'flat'}
                onChange={e => set('maxDiscount', e.target.value)}
              />
              <span className="coupon-field-hint">0 = no cap (percentage only)</span>
            </div>
          </div>

          <div className="coupon-form-row">
            <div className="coupon-form-group">
              <label>Total Usage Limit</label>
              <input
                type="number" min="0" value={form.usageLimit}
                onChange={e => set('usageLimit', e.target.value)}
              />
              <span className="coupon-field-hint">0 = unlimited</span>
            </div>
            <div className="coupon-form-group">
              <label>Per-Customer Limit</label>
              <input
                type="number" min="1" value={form.perUserLimit}
                onChange={e => set('perUserLimit', e.target.value)}
              />
            </div>
          </div>

          <div className="coupon-form-group">
            <label>Expires On</label>
            <input
              type="date" value={form.expiresAt}
              onChange={e => set('expiresAt', e.target.value)}
            />
            <span className="coupon-field-hint">Leave blank for no expiry</span>
          </div>

          {error && <p className="coupon-form-error">{error}</p>}

          <div className="coupon-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create Coupon'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main Component ── */
const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    api.get('/coupons')
      .then(res => setCoupons(res.data.coupons || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleActive = async coupon => {
    setBusyId(coupon.id);
    try {
      const { data } = await api.patch(`/coupons/${coupon.id}`, { isActive: !coupon.isActive });
      setCoupons(prev => prev.map(c => (c.id === coupon.id ? data.coupon : c)));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update coupon');
    } finally {
      setBusyId(null);
    }
  };

  const isExpired = c => c.expiresAt && new Date(c.expiresAt) < new Date();

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1 className="admin-title">Admin Dashboard</h1>
        </div>

        <AdminTabs />

        <div className="section-header-row">
          <h2 className="section-title">Coupons ({coupons.length})</h2>
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + Create Coupon
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner" style={{ margin: '4rem auto' }} />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Discount</th>
                  <th>Min Order</th>
                  <th>Usage</th>
                  <th>Per User</th>
                  <th>Expires</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => {
                  const busy = busyId === c.id;
                  const expired = isExpired(c);
                  return (
                    <tr key={c.id} className={busy ? 'row-busy' : ''}>
                      <td><strong className="coupon-code">{c.code}</strong></td>
                      <td>
                        {c.type === 'percent'
                          ? `${Number(c.value)}%${Number(c.maxDiscount) > 0 ? ` (max ${money(c.maxDiscount)})` : ''}`
                          : money(c.value)}
                      </td>
                      <td>{Number(c.minOrder) > 0 ? money(c.minOrder) : '—'}</td>
                      <td>
                        {c.usageCount} / {Number(c.usageLimit) > 0 ? c.usageLimit : '∞'}
                      </td>
                      <td>{c.perUserLimit}</td>
                      <td className="cell-date">
                        {c.expiresAt
                          ? <span className={expired ? 'coupon-expired' : ''}>{fmtDate(c.expiresAt)}</span>
                          : 'Never'}
                      </td>
                      <td>
                        <button
                          className={`status-toggle ${c.isActive && !expired ? 'active' : 'inactive'}`}
                          disabled={busy}
                          title="Click to toggle"
                          onClick={() => toggleActive(c)}
                        >
                          {expired ? 'Expired' : c.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {coupons.length === 0 && (
              <div className="table-empty">No coupons yet. Create your first one.</div>
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateCouponModal
          onClose={() => setShowCreate(false)}
          onCreated={c => setCoupons(prev => [c, ...prev])}
        />
      )}
    </div>
  );
};

export default AdminCoupons;
