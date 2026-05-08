import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './Account.css';

const Account = () => {
  const { user, logout, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('profile');
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [addrForm, setAddrForm] = useState({
    label: 'Home', name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India'
  });

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleProfileSave = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/auth/profile', form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = async e => {
    e.preventDefault();
    try {
      await api.post('/auth/address', addrForm);
      setAddingAddress(false);
      setAddrForm({ label: 'Home', name: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', country: 'India' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="account-page">
      <div className="container">
        <div className="account-layout">
          {/* Sidebar */}
          <aside className="account-sidebar">
            <div className="account-avatar">
              <div className="avatar-circle">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="avatar-name">{user?.name}</p>
                <p className="avatar-email">{user?.email}</p>
              </div>
            </div>

            <nav className="account-nav">
              {[
                { id: 'profile', label: 'My Profile', icon: '👤' },
                { id: 'addresses', label: 'Addresses', icon: '📍' },
              ].map(item => (
                <button key={item.id}
                  className={`account-nav-item ${tab === item.id ? 'active' : ''}`}
                  onClick={() => setTab(item.id)}>
                  <span>{item.icon}</span> {item.label}
                </button>
              ))}
              <Link to="/my-orders" className="account-nav-item">
                <span>📦</span> My Orders
              </Link>
              <Link to="/wishlist" className="account-nav-item">
                <span>♥</span> Wishlist
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="account-nav-item admin-link">
                  <span>⚙️</span> Admin Dashboard
                </Link>
              )}
              <button className="account-nav-item logout" onClick={handleLogout}>
                <span>🚪</span> Sign Out
              </button>
            </nav>
          </aside>

          {/* Content */}
          <div className="account-content">
            {tab === 'profile' && (
              <div className="account-panel">
                <h2 className="panel-title">My Profile</h2>
                <form className="profile-form" onSubmit={handleProfileSave}>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="form-group">
                    <label>Email Address</label>
                    <input type="email" value={user?.email} disabled className="disabled-input" />
                    <p className="field-note">Email cannot be changed</p>
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" value={form.phone}
                      onChange={e => setForm({ ...form, phone: e.target.value })} />
                  </div>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Changes'}
                  </button>
                </form>
              </div>
            )}

            {tab === 'addresses' && (
              <div className="account-panel">
                <div className="panel-header">
                  <h2 className="panel-title">Saved Addresses</h2>
                  <button className="btn btn-outline btn-sm"
                    onClick={() => setAddingAddress(!addingAddress)}>
                    {addingAddress ? 'Cancel' : '+ Add Address'}
                  </button>
                </div>

                {addingAddress && (
                  <form className="address-form" onSubmit={handleAddAddress}>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Label</label>
                        <select value={addrForm.label}
                          onChange={e => setAddrForm({ ...addrForm, label: e.target.value })}>
                          <option>Home</option>
                          <option>Work</option>
                          <option>Other</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" required value={addrForm.name}
                          onChange={e => setAddrForm({ ...addrForm, name: e.target.value })} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Address Line 1</label>
                      <input type="text" required value={addrForm.line1}
                        onChange={e => setAddrForm({ ...addrForm, line1: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Address Line 2 (optional)</label>
                      <input type="text" value={addrForm.line2}
                        onChange={e => setAddrForm({ ...addrForm, line2: e.target.value })} />
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label>City</label>
                        <input type="text" required value={addrForm.city}
                          onChange={e => setAddrForm({ ...addrForm, city: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>State</label>
                        <input type="text" required value={addrForm.state}
                          onChange={e => setAddrForm({ ...addrForm, state: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>Pincode</label>
                        <input type="text" required value={addrForm.pincode}
                          onChange={e => setAddrForm({ ...addrForm, pincode: e.target.value })} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Country</label>
                      <select value={addrForm.country}
                        onChange={e => setAddrForm({ ...addrForm, country: e.target.value })}>
                        <option>India</option>
                        <option>United States</option>
                        <option>United Kingdom</option>
                        <option>Singapore</option>
                        <option>Australia</option>
                        <option>Malaysia</option>
                      </select>
                    </div>
                    <button type="submit" className="btn btn-primary">Save Address</button>
                  </form>
                )}

                {user?.addresses?.length === 0 && !addingAddress && (
                  <div className="empty-state">
                    <p>No saved addresses yet.</p>
                    <button className="btn btn-primary" onClick={() => setAddingAddress(true)}>
                      Add Your First Address
                    </button>
                  </div>
                )}

                <div className="address-list">
                  {user?.addresses?.map((addr, i) => (
                    <div key={i} className="address-card">
                      <div className="addr-label-badge">{addr.label || 'Address'}</div>
                      <p className="addr-name">{addr.name}</p>
                      <p className="addr-lines">
                        {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
                        {addr.city}, {addr.state} {addr.pincode}<br />
                        {addr.country}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;
