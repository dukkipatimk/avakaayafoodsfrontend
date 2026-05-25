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
];

const fmtDate = iso => new Date(iso).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric',
});

const emptyStaff = { name: '', email: '', password: '', phone: '', role: 'store_manager' };

/* ── Create Staff Modal ── */
const CreateStaffModal = ({ onClose, onCreated }) => {
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
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
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

/* ── Main Component ── */
const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const myId = String(currentUser?._id || currentUser?.id || '');

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [passwordUser, setPasswordUser] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const fetchUsers = () => {
    api.get('/admin/users')
      .then(res => setUsers(res.data.users || []))
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
                          disabled={isSelf || busy}
                          title={isSelf ? 'You cannot change your own role' : ''}
                          onChange={e => patchUser(u._id, { role: e.target.value })}
                        >
                          {ROLES.map(r => (
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
        />
      )}
      {passwordUser && (
        <ResetPasswordModal
          user={passwordUser}
          onClose={() => setPasswordUser(null)}
        />
      )}
    </div>
  );
};

export default AdminUsers;
