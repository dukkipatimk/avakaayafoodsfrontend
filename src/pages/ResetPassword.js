import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import './Auth.css';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const id = params.get('id');
  const token = params.get('token');

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const linkValid = Boolean(id && token);

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    if (password !== confirm) return setError('Passwords do not match.');

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { id, token, password });
      toast.success('Password updated. Please sign in.');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Could not reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <span className="logo-main">Avakaaya</span>
            <span className="logo-sub">Pickles House</span>
          </Link>
          <h1 className="auth-title">Set New Password</h1>
          <p className="auth-subtitle">Choose a new password for your account</p>
        </div>

        {!linkValid ? (
          <div className="auth-error">
            This reset link is invalid or incomplete. Please request a new one.
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 6 characters"
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm">Confirm Password</label>
              <input
                type="password"
                id="confirm"
                name="confirm"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="Repeat new password"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
              {loading ? 'Updating…' : 'Update Password'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          {linkValid
            ? <p>Back to <Link to="/login">sign in</Link></p>
            : <p><Link to="/forgot-password">Request a new reset link</Link></p>}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
