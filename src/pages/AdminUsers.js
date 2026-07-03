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
    <div className="modal-overlay" onClick={onClose}>
      <div className="staff-modal" onClick={e => e.stopPropagation()}>
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

const ResetPasswordModal = ({ user, onClose }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      await api.patch(`/admin/users/${user._id}/password`, { password });
      setPassword('');
      setConfirmPassword('');
      setSuccess('Password updated. Share the new password securely with the user.');
    } catch (err) {
      setError(err.response?.data?.message || 'Could not update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="staff-modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Reset Password</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <form className="staff-form" onSubmit={handleSubmit}>
          <p className="reset-password-user">
            Set a temporary password for <strong>{user.name}</strong><br />
            <span>{user.email}</span>
          </p>
          <div className="form-group">
            <label>New Password *</label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
          <div className="form-group">
            <label>Confirm Password *</label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>
          {error && <p className="staff-form-error">{error}</p>}
          {success && <p className="staff-form-success">{success}</p>}
          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              {success ? 'Close' : 'Cancel'}
            </button>
            {!success && (
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Updating...' : 'Update Password'}
              </button>
            )}
          </div>
        </form>
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="staff-modal user-orders-modal" onClick={e => e.stopPropagation()}>
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
  const [passwordUser, setPasswordUser] = useState(null);
  const [ordersUser, setOrdersUser] = useState(null);
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
          <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
            + Add Staff
          </button>
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
                  <th>Role</th>
                  <th>Status</th>
                  <th>Orders</th>
                  {isSuperAdmin && <th>Revenue</th>}
                  <th>Leads</th>
                  {isSuperAdmin && <th>Leads Revenue</th>}
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(u => {
                  const isSelf = String(u._id) === myId;
                  const busy = String(busyId) === String(u._id);
                  return (
                    <tr key={u._id} className={busy ? 'row-busy' : ''}>
                      <td>
                        <strong>{u.name}</strong>
                        {isSelf && <span className="self-tag">you</span>}
                      </td>
                      <td>{u.email}</td>
                      <td>{u.phone || '—'}</td>
                      <td>
                        <select
                          className={`role-select role-${u.role}`}
                          value={u.role}
                          disabled={isSelf || busy || (u.role === 'super_admin' && !isSuperAdmin)}
                          title={
                            isSelf ? 'You cannot change your own role'
                            : (u.role === 'super_admin' && !isSuperAdmin) ? 'Only a super admin can change a super admin'
                            : ''
                          }
                          onChange={e => patchUser(u._id, { role: e.target.value })}
                        >
                          {ROLES
                            // Only a super admin may assign the super_admin role. Still
                            // render the option when the row already is one, so its label shows.
                            .filter(r => r.value !== 'super_admin' || isSuperAdmin || u.role === 'super_admin')
                            .map(r => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                        </select>
                      </td>
                      <td>
                        <button
                          className={`status-toggle ${u.isActive ? 'active' : 'inactive'}`}
                          disabled={isSelf || busy}
                          title={isSelf ? 'You cannot deactivate yourself' : 'Click to toggle'}
                          onClick={() => patchUser(u._id, { isActive: !u.isActive })}
                        >
                          {u.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td>
                        <button
                          className="user-orders-link"
                          onClick={() => setOrdersUser(u)}
                          title="View this customer's orders"
                        >
                          {u.orderCount || 0} {u.orderCount === 1 ? 'order' : 'orders'}
                        </button>
                      </td>
                      {isSuperAdmin && <td className="cell-revenue">{fmtMoney(u.revenue)}</td>}
                      <td>{u.leadCount || 0}</td>
                      {isSuperAdmin && <td className="cell-lead-revenue">{fmtMoney(u.leadRevenue)}</td>}
                      <td className="cell-date">{fmtDate(u.createdAt)}</td>
                      <td>
                        <button
                          className="password-reset-btn"
                          onClick={() => setPasswordUser(u)}
                          disabled={busy}
                        >
                          Reset Password
                        </button>
                      </td>
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
      {passwordUser && (
        <ResetPasswordModal
          user={passwordUser}
          onClose={() => setPasswordUser(null)}
        />
      )}
      {ordersUser && (
        <UserOrdersModal
          user={ordersUser}
          onClose={() => setOrdersUser(null)}
        />
      )}
    </div>
  );
};

export default AdminUsers;
