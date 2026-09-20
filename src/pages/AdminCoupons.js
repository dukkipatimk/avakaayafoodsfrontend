import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import AdminTabs from '../components/AdminTabs';
import AdminCollectionFilters from '../components/AdminCollectionFilters';
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

// A date input wants YYYY-MM-DD in local time; toISOString() would hand back
// yesterday for anything stored late in the evening IST.
const toInputDate = (value) => {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const plusDays = (n) => toInputDate(new Date(Date.now() + n * 86400000));

/* ── Expiry Modal ──────────────────────────────────────────────────────────
   Bringing an expired coupon back is a new expiry date, not a switch: the shop
   checks isActive and expiresAt separately, so a coupon that is "active" but
   out of date is still refused at checkout. This sets both at once. */
const ExpiryModal = ({ coupon, expired, onClose, onSaved }) => {
  const [date, setDate] = useState(toInputDate(coupon.expiresAt) || plusDays(30));
  const [never, setNever] = useState(!coupon.expiresAt);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    if (!never && !date) { setError('Pick a date, or choose “never expires”.'); return; }
    setSaving(true); setError('');
    try {
      const patch = { expiresAt: never ? null : date };
      // Renewing something the admin can see is expired is also a request to
      // turn it back on — nobody sets a future date to leave it switched off.
      if (expired || !coupon.isActive) patch.isActive = true;
      const { data } = await api.patch(`/coupons/${coupon.id}`, patch);
      onSaved(data.coupon);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update the coupon');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="coupon-modal-overlay" onClick={onClose}>
      <div className="coupon-modal coupon-modal--sm" onClick={e => e.stopPropagation()}>
        <div className="coupon-modal-header">
          <h2>{expired ? 'Renew' : 'Change expiry'} · {coupon.code}</h2>
          <button className="coupon-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="coupon-form" onSubmit={save}>
          {expired && (
            <p className="coupon-note">
              This coupon expired on {fmtDate(coupon.expiresAt)}. Give it a new date and it
              goes back on sale — the storefront will accept it again straight away.
            </p>
          )}
          <div className="coupon-form-group">
            <label>Expires on</label>
            <input type="date" value={date} disabled={never} onChange={e => setDate(e.target.value)} />
            <div className="coupon-quick">
              {[7, 30, 90].map(n => (
                <button type="button" key={n} onClick={() => { setNever(false); setDate(plusDays(n)); }}>
                  +{n} days
                </button>
              ))}
            </div>
          </div>
          <label className="coupon-check">
            <input type="checkbox" checked={never} onChange={e => setNever(e.target.checked)} />
            Never expires
          </label>
          <p className="coupon-note coupon-note--quiet">
            A coupon runs until the end of the day you choose.
          </p>
          {error && <p className="coupon-form-error">{error}</p>}
          <div className="coupon-form-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : expired ? 'Renew coupon' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
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
  const [search, setSearch] = useState('');
  const [visibility, setVisibility] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [expiryFor, setExpiryFor] = useState(null);   // the coupon whose date is being set

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
  const filteredCoupons = coupons.filter(c => String(c.code || '').toLowerCase().includes(search.trim().toLowerCase()) && (visibility === 'all' || (visibility === 'active' ? c.isActive && !isExpired(c) : !c.isActive || isExpired(c))));

  return (
    <div className="admin-page admin-workspace">
      <div className="container">
        <AdminTabs />

        {/* Counted on the Coupons tab above; the button rides with the search. */}
        <AdminCollectionFilters search={search} onSearch={setSearch} status={visibility} onStatus={setVisibility} count={filteredCoupons.length} noun="coupons" loading={loading}
          action={<button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ Create Coupon</button>} />
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
                {filteredCoupons.map(c => {
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
                        {/* The date is the control: an expired coupon comes back
                            by being given a new one. */}
                        <button className="coupon-date-btn" onClick={() => setExpiryFor(c)}
                          title={c.expiresAt ? 'Change the expiry date' : 'Set an expiry date'}>
                          {c.expiresAt
                            ? <span className={expired ? 'coupon-expired' : ''}>{fmtDate(c.expiresAt)}</span>
                            : 'Never'}
                        </button>
                      </td>
                      <td>
                        {expired ? (
                          <button className="coupon-renew" disabled={busy} onClick={() => setExpiryFor(c)}
                            title="Expired — give it a new date to put it back on sale">
                            Expired · Renew
                          </button>
                        ) : (
                          <button
                            className={`status-toggle ${c.isActive ? 'active' : 'inactive'}`}
                            disabled={busy}
                            title="Click to toggle"
                            onClick={() => toggleActive(c)}
                          >
                            {c.isActive ? 'Active' : 'Inactive'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredCoupons.length === 0 && (
              <div className="table-empty">{coupons.length ? 'No coupons match your filters.' : 'No coupons yet. Create your first one.'}</div>
            )}
          </div>
        )}
      </div>

      {expiryFor && (
        <ExpiryModal
          coupon={expiryFor}
          expired={isExpired(expiryFor)}
          onClose={() => setExpiryFor(null)}
          onSaved={saved => setCoupons(prev => prev.map(c => (c.id === saved.id ? saved : c)))}
        />
      )}

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
