import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import AdminTabs from '../components/AdminTabs';
import './AdminDashboard.css';
import './AdminStores.css';

const emptyStore = {
  name: '', area: '', address: '', city: 'Hyderabad', state: 'Telangana',
  phone: '', hours: '', statusOverride: 'auto', mapUrl: '', sortOrder: 0, isActive: true,
};

const STATUS_OVERRIDE_OPTIONS = [
  { value: 'auto', label: 'Auto from hours' },
  { value: 'open', label: 'Force Open' },
  { value: 'closed', label: 'Force Closed' },
  { value: 'coming_soon', label: 'Coming Soon' },
];

const statusClass = (status) => `branch-status branch-status--${status || 'unknown'}`;

/* ── Create / Edit Store Modal ── */
const StoreModal = ({ store, onClose, onSaved }) => {
  const [form, setForm] = useState(store ? { ...emptyStore, ...store } : emptyStore);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const editing = !!store;

  const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name.trim(), area: form.area.trim(), address: form.address.trim(),
        city: form.city.trim(), state: form.state.trim(), phone: form.phone.trim(),
        hours: form.hours.trim(), statusOverride: form.statusOverride || 'auto', mapUrl: form.mapUrl.trim(),
        sortOrder: Number(form.sortOrder) || 0, isActive: form.isActive,
      };
      const { data } = editing
        ? await api.put(`/stores/${store._id}`, payload)
        : await api.post('/stores', payload);
      onSaved(data.store, editing);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save store');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="store-modal-overlay" onClick={onClose}>
      <div className="store-modal" onClick={e => e.stopPropagation()}>
        <div className="store-modal-header">
          <h2>{editing ? 'Edit Store' : 'Add Store'}</h2>
          <button className="store-modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="store-form" onSubmit={handleSubmit}>
          <div className="store-form-group">
            <label>Store Name *</label>
            <input type="text" required value={form.name}
              placeholder="e.g. KPHB Store"
              onChange={e => set('name', e.target.value)} />
          </div>
          <div className="store-form-group">
            <label>Area / Locality</label>
            <input type="text" value={form.area}
              placeholder="e.g. KPHB, Kukatpally"
              onChange={e => set('area', e.target.value)} />
          </div>
          <div className="store-form-group">
            <label>Address</label>
            <textarea rows={2} value={form.address}
              placeholder="Full street address"
              onChange={e => set('address', e.target.value)} />
          </div>
          <div className="store-form-row">
            <div className="store-form-group">
              <label>City</label>
              <input type="text" value={form.city}
                onChange={e => set('city', e.target.value)} />
            </div>
            <div className="store-form-group">
              <label>State</label>
              <input type="text" value={form.state}
                onChange={e => set('state', e.target.value)} />
            </div>
          </div>
          <div className="store-form-row">
            <div className="store-form-group">
              <label>Phone</label>
              <input type="text" value={form.phone}
                onChange={e => set('phone', e.target.value)} />
            </div>
            <div className="store-form-group">
              <label>Hours</label>
              <input type="text" value={form.hours}
                placeholder="e.g. 9 AM – 9 PM"
                onChange={e => set('hours', e.target.value)} />
            </div>
          </div>
          <div className="store-form-group">
            <label>Branch Status Override</label>
            <select value={form.statusOverride || 'auto'} onChange={e => set('statusOverride', e.target.value)}>
              {STATUS_OVERRIDE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          <div className="store-form-group">
            <label>Google Maps Link</label>
            <input type="url" value={form.mapUrl}
              placeholder="https://maps.google.com/..."
              onChange={e => set('mapUrl', e.target.value)} />
          </div>
          <div className="store-form-row">
            <div className="store-form-group">
              <label>Display Order</label>
              <input type="number" value={form.sortOrder}
                onChange={e => set('sortOrder', e.target.value)} />
            </div>
            <div className="store-form-group store-form-checkbox">
              <label>
                <input type="checkbox" checked={form.isActive}
                  onChange={e => set('isActive', e.target.checked)} />
                Active (shown on storefront)
              </label>
            </div>
          </div>

          {error && <p className="store-form-error">{error}</p>}

          <div className="store-modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Main Component ── */
const AdminStores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalStore, setModalStore] = useState(undefined); // undefined = closed, null = new, obj = edit
  const [busyId, setBusyId] = useState(null);

  const fetchStores = () => {
    api.get('/stores?all=1')
      .then(res => setStores(res.data.stores || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchStores, []);

  const handleSaved = (store, wasEdit) => {
    setStores(prev => wasEdit
      ? prev.map(s => (s._id === store._id ? store : s))
      : [...prev, store]);
  };

  const toggleActive = async store => {
    setBusyId(store._id);
    try {
      const { data } = await api.put(`/stores/${store._id}`, { isActive: !store.isActive });
      setStores(prev => prev.map(s => (s._id === store._id ? data.store : s)));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update store');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async store => {
    if (!window.confirm(`Delete "${store.name}"? This cannot be undone.`)) return;
    setBusyId(store._id);
    try {
      await api.delete(`/stores/${store._id}`);
      setStores(prev => prev.filter(s => s._id !== store._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete store');
    } finally {
      setBusyId(null);
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
          <h2 className="section-title">Stores ({stores.length})</h2>
          <button className="btn btn-primary" onClick={() => setModalStore(null)}>
            + Add Store
          </button>
        </div>

        {loading ? (
          <div className="loading-spinner" style={{ margin: '4rem auto' }} />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Area</th>
                  <th>City</th>
                  <th>Phone</th>
                  <th>Hours</th>
                  <th>Branch Status</th>
                  <th>Visibility</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stores.map(s => {
                  const busy = busyId === s._id;
                  return (
                    <tr key={s._id} className={busy ? 'row-busy' : ''}>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.area || '—'}</td>
                      <td>{s.city || '—'}</td>
                      <td>{s.phone || '—'}</td>
                      <td>{s.hours || '—'}</td>
                      <td>
                        <span className={statusClass(s.status)}>
                          {s.statusLabel || 'Unknown'}
                        </span>
                        <small className="branch-status-note">
                          {s.statusOverride && s.statusOverride !== 'auto' ? 'Manual override' : s.statusNote || 'Auto from hours'}
                        </small>
                      </td>
                      <td>
                        <button
                          className={`status-toggle ${s.isActive ? 'active' : 'inactive'}`}
                          disabled={busy}
                          onClick={() => toggleActive(s)}
                        >
                          {s.isActive ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      <td>
                        <div className="store-actions">
                          <button className="btn-table-edit" onClick={() => setModalStore(s)}>Edit</button>
                          <button className="btn-table-delete" onClick={() => handleDelete(s)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {stores.length === 0 && (
              <div className="table-empty">No stores yet. Add your first one.</div>
            )}
          </div>
        )}
      </div>

      {modalStore !== undefined && (
        <StoreModal
          store={modalStore}
          onClose={() => setModalStore(undefined)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default AdminStores;
