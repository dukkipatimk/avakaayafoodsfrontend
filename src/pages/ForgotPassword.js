import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
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
          <h1 className="auth-title">Forgot Password</h1>
          <p className="auth-subtitle">We'll email you a link to reset it</p>
        </div>

        {sent ? (
          <div className="auth-success">
            <p>If an account exists for <strong>{email}</strong>, a password reset link has been sent.</p>
            <p>Check your inbox (and spam folder) — the link expires in 1 hour.</p>
          </div>
        ) : (
          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
              {loading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>Remembered it? <Link to="/login">Back to sign in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
