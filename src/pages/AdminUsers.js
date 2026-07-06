import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import AdminTabs from '../components/AdminTabs';
import './AdminDashboard.css';
import './AdminUsers.css';

const ROLES = [
  { value: 'customer', label: 'Customer' },
  { value: 'store_manager', label: 'Store Manager' },
  { value: 'admin', label: 'Admin' },
  { value: 'super_admin', label: 'Super Admin' },
];

// Short chips shown before the name: C / A / SA / SM.
const ROLE_ABBR = { customer: 'C', admin: 'A', super_admin: 'SA', store_manager: 'SM' };

const fmtDate = iso => new Date(iso).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
});

const fmtMoney = (n, ccy = 'INR') =>
  `${ccy === 'INR' ? '₹' : ccy + ' '}${(Number(n) || 0).toLocaleString('en-IN')}`;

const emptyStaff = { name: '', email: '', password: '', phone: '', role: 'store_manager' };

/* ── Create Staff Modal ── */
const CreateStaffModal = ({ onClose, onCreated, canCreateSuper }) => {
  const [form, setForm] = useState(emptyStaff);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post('/admin/users', form);
      onCreated(data.user);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay modal-right" onClick={onClose}>
      <div className="staff-modal drawer" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Staff Account</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="staff-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input type="text" required value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input type="email" required value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Temporary Password *</label>
            <input type="text" required minLength={6} value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="At least 6 characters" />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input type="text" value={form.phone}
              onChange={e => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Role *</label>
            <select value={form.role}
              onChange={e => setForm({ ...form, role: e.target.value })}>
              {ROLES
                .filter(r => r.value !== 'super_admin' || canCreateSuper)
                .map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>
          {error && <p className="staff-form-error">{error}</p>}
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ── Manage User drawer (role + reset password), right-aligned ── */
const UserManageModal = ({ user, isSuperAdmin, isSelf, onRoleChange, onClose }) => {
  const [role, setRole] = useState(user.role);
  const [roleSaving, setRoleSaving] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const saveRole = async e => {
    const next = e.target.value;
    setRole(next);
    setRoleSaving(true);
    try { await onRoleChange(user._id, { role: next }); }
    catch { setRole(user.role); }
    finally { setRoleSaving(false); }
  };

  const submitPassword = async e => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (password !== confirmPassword) { setError('Passwords do not match'); return; }
    setSaving(true);
    try {
      await api.patch(`/admin/users/${user._id}/password`, { password });
      setPassword(''); setConfirmPassword('');
      setSuccess('Password updated. Share it securely with the user.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay modal-right" onClick={onClose}>
      <div className="staff-modal drawer" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manage — {user.name}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="drawer-body">
          <p className="drawer-user-email">{user.email}</p>

          <div className="form-group">
            <label>Role</label>
            <select
              className={`role-select role-${role}`}
              value={role}
              disabled={!isSuperAdmin || isSelf || roleSaving}
              title={!isSuperAdmin ? 'Only a super admin can change user roles'
                : isSelf ? 'You cannot change your own role' : ''}
              onChange={saveRole}
            >
              {ROLES
                .filter(r => r.value !== 'super_admin' || isSuperAdmin || role === 'super_admin')
                .map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </div>

          <hr className="drawer-divider" />

          <form className="staff-form drawer-form" onSubmit={submitPassword}>
            <h3 className="drawer-section-title">Reset Password</h3>
            <div className="form-group">
              <label>New Password *</label>
              <input type="password" required minLength={6} autoComplete="new-password"
                value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" />
            </div>
            <div className="form-group">
              <label>Confirm Password *</label>
              <input type="password" required minLength={6} autoComplete="new-password"
                value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
            {error && <p className="staff-form-error">{error}</p>}
            {success && <p className="staff-form-success">{success}</p>}
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

/* ── Customer Orders Modal ── */
const UserOrdersModal = ({ user, onClose }) => {
  const [orders, setOrders] = useState(null); // null = loading
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/admin/users/${user._id}/orders`)
      .then(res => setOrders(res.data.orders || []))
      .catch(err => setError(err.response?.data?.message || 'Could not load orders'));
  }, [user._id]);

  return (
    <div className="modal-overlay modal-right" onClick={onClose}>
      <div className="staff-modal user-orders-modal drawer" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Orders — {user.name}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {error && <p className="staff-form-error">{error}</p>}
        {!error && orders === null && (
          <div className="loading-spinner" style={{ margin: '3rem auto' }} />
        )}
        {!error && orders && orders.length === 0 && (
          <div className="table-empty">This customer has no orders yet.</div>
        )}
        {!error && orders && orders.length > 0 && (
          <div className="admin-table-wrap">
            <table className="admin-table user-orders-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Status</th>
                  <th>Payment</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o._id || o.id}>
                    <td><strong>{o.orderNumber || `#${o._id || o.id}`}</strong></td>
                    <td className="cell-date">{fmtDate(o.createdAt)}</td>
                    <td>{(o.items || []).reduce((n, i) => n + (i.quantity || 0), 0)}</td>
                    <td><span className={`order-status-pill status-${o.orderStatus}`}>{o.orderStatus}</span></td>
                    <td className={o.paymentStatus === 'paid' ? 'pay-paid' : 'pay-pending'}>{o.paymentStatus}</td>
                    <td>{fmtMoney(o.total, o.currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

/* ── Customer Leads Modal ── */
const UserLeadsModal = ({ user, isSuperAdmin, onClose }) => {
  const [data, setData] = useState(null); // { leads, revenue }
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/admin/users/${user._id}/leads`)
      .then(res => setData({ leads: res.data.leads || [], revenue: res.data.revenue }))
      .catch(err => setError(err.response?.data?.message || 'Could not load leads'));
  }, [user._id]);

  const fmtWhen = iso => new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div className="modal-overlay modal-right" onClick={onClose}>
      <div className="staff-modal user-orders-modal drawer" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Leads — {user.name}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {isSuperAdmin && data && data.revenue != null && (
          <p className="leads-modal-revenue">Leads revenue (potential): <strong>{fmtMoney(data.revenue)}</strong></p>
        )}
        {error && <p className="staff-form-error">{error}</p>}
        {!error && data === null && <div className="loading-spinner" style={{ margin: '3rem auto' }} />}
        {!error && data && data.leads.length === 0 && <div className="table-empty">No open leads for this customer.</div>}

        {!error && data && data.leads.map(l => (
          <div className="lead-detail-card" key={l.id}>
            <div className="lead-detail-head">
              <span className={`order-status-pill status-${l.stage}`}>{l.stage}</span>
              <span className="lead-detail-status">{l.status}</span>
              <span className="lead-detail-when">{fmtWhen(l.lastEventAt)}</span>
            </div>
            <div className="lead-detail-metrics">
              {isSuperAdmin && l.cartValue != null && <span><strong>{fmtMoney(l.cartValue)}</strong> cart</span>}
              <span><strong>{l.products}</strong> qty</span>
              <span><strong>{l.score}</strong> score</span>
              <span><strong>{l.productViews}</strong> views</span>
              <span><strong>{l.cartAdds}</strong> adds</span>
              {l.region && <span>{l.region}</span>}
            </div>
            {l.items && l.items.length > 0 ? (
              <table className="admin-table lead-cart-mini">
                <thead>
                  <tr>
                    <th>Product</th><th>Qty</th>
                    {isSuperAdmin && <><th>Price</th><th>Total</th></>}
                  </tr>
                </thead>
                <tbody>
                  {l.items.map((it, idx) => (
                    <tr key={idx}>
                      <td>
                        <strong>{it.name}</strong>
                        {it.weight ? <small> · {it.weight}</small> : null}
                        {it.bundleType === 'hamper' ? <small> · Hamper</small> : null}
                      </td>
                      <td>{it.quantity}</td>
                      {isSuperAdmin && <td>{fmtMoney(it.price)}</td>}
                      {isSuperAdmin && <td>{fmtMoney((Number(it.price) || 0) * (Number(it.quantity) || 1))}</td>}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="report-muted" style={{ margin: '0.4rem 0 0' }}>No cart products captured.</p>}
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Main Component ── */
const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const myId = String(currentUser?._id || currentUser?.id || '');
  const isSuperAdmin = currentUser?.role === 'super_admin';   // revenue visibility

  const [users, setUsers] = useState([]);
  const [counts, setCounts] = useState({ users: 0, orders: 0, revenue: 0, leads: 0, leadRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [manageUser, setManageUser] = useState(null);
  const [ordersUser, setOrdersUser] = useState(null);
  const [leadsUser, setLeadsUser] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchUsers = () => {
    api.get('/admin/users')
      .then(res => {
        setUsers(res.data.users || []);
        if (res.data.counts) setCounts(res.data.counts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(fetchUsers, []);

  const patchUser = async (id, changes) => {
    setBusyId(id);
    try {
      const { data } = await api.patch(`/admin/users/${id}`, changes);
      setUsers(prev => prev.map(u => (String(u._id) === String(id) ? data.user : u)));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update user');
    } finally {
      setBusyId(null);
    }
  };

  const q = search.toLowerCase();
  const filtered = users.filter(u => {
    const matchesSearch =
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="admin-page">
      <div className="container">
        <div className="admin-header">
          <h1 className="admin-title">Admin Dashboard</h1>
        </div>

        <AdminTabs />

        <div className="stats-grid users-summary">
          {[
            { label: 'Total Users',   display: (counts.users || 0).toLocaleString('en-IN'),  icon: '👥', color: '#f59e0b' },
            { label: 'Orders',        display: (counts.orders || 0).toLocaleString('en-IN'), icon: '📦', color: '#3b82f6' },
            // Revenue figures — super admin only.
            ...(isSuperAdmin ? [{ label: 'Revenue', display: fmtMoney(counts.revenue), icon: '💰', color: '#10b981' }] : []),
            { label: 'Leads',         display: (counts.leads || 0).toLocaleString('en-IN'),  icon: '🎯', color: '#8b5cf6' },
            ...(isSuperAdmin ? [{ label: 'Leads Revenue', display: fmtMoney(counts.leadRevenue), icon: '📈', color: '#ec4899' }] : []),
          ].map(stat => (
            <div key={stat.label} className="stat-card">
              <div className="stat-icon" style={{ background: stat.color + '18', color: stat.color }}>
                {stat.icon}
              </div>
              <div>
                <p className="stat-value">{stat.display}</p>
                <p className="stat-label">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="section-header-row">
          <h2 className="section-title">Users ({users.length})</h2>
          {isSuperAdmin && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
              + Add Staff
            </button>
          )}
        </div>

        <div className="users-toolbar">
          <input
            type="search"
            className="users-search"
            placeholder="Search by name, email or phone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select
            className="users-role-filter"
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
          >
            <option value="all">All roles</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {loading ? (
          <div className="loading-spinner" style={{ margin: '4rem auto' }} />
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Orders</th>
                  <th>Leads</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const isSelf = String(u._id) === myId;
                  const busy = String(busyId) === String(u._id);
                  return (
                    <tr
                      key={u._id}
                      className={`user-row${busy ? ' row-busy' : ''}`}
                      onClick={() => setManageUser(u)}
                      title="Click to manage role &amp; password"
                    >
                      <td>
                        <button
                          className={`status-tick ${u.isActive ? 'active' : 'inactive'}`}
                          disabled={isSelf || busy}
                          title={isSelf ? "You can't change your own status"
                            : u.isActive ? 'Active — click to deactivate'
                            : 'Inactive — click to activate'}
                          onClick={e => { e.stopPropagation(); patchUser(u._id, { isActive: !u.isActive }); }}
                        >
                          {u.isActive ? '✓' : '✕'}
                        </button>
                        <span className={`role-chip role-${u.role}`} title={ROLES.find(r => r.value === u.role)?.label || u.role}>
                          {ROLE_ABBR[u.role] || '?'}
                        </span>
                        <strong>{u.name}</strong>
                        {isSelf && <span className="self-tag">you</span>}
                      </td>
                      <td>{u.email}</td>
                      <td>{u.phone || '—'}</td>
                      <td>
                        <button
                          className="user-orders-link"
                          onClick={e => { e.stopPropagation(); setOrdersUser(u); }}
                          title="View this customer's orders"
                        >
                          {u.orderCount || 0}
                        </button>
                        {isSuperAdmin && <span className="cell-inline-rev">{fmtMoney(u.revenue)}</span>}
                      </td>
                      <td>
                        <button
                          className="user-orders-link"
                          onClick={e => { e.stopPropagation(); setLeadsUser(u); }}
                          title="View this customer's leads &amp; lead revenue"
                        >
                          {u.leadCount || 0}
                        </button>
                      </td>
                      <td className="cell-date">{fmtDate(u.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="table-empty">No users found.</div>
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <CreateStaffModal
          onClose={() => setShowCreate(false)}
          onCreated={u => setUsers(prev => [u, ...prev])}
          canCreateSuper={isSuperAdmin}
        />
      )}
      {manageUser && (
        <UserManageModal
          user={manageUser}
          isSuperAdmin={isSuperAdmin}
          isSelf={String(manageUser._id) === myId}
          onRoleChange={patchUser}
          onClose={() => setManageUser(null)}
        />
      )}
      {ordersUser && (
        <UserOrdersModal
          user={ordersUser}
          onClose={() => setOrdersUser(null)}
        />
      )}
      {leadsUser && (
        <UserLeadsModal
          user={leadsUser}
          isSuperAdmin={isSuperAdmin}
          onClose={() => setLeadsUser(null)}
        />
      )}
    </div>
  );
};

export default AdminUsers;
