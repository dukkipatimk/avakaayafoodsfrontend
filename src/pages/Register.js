import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Singapore', 'Australia', 'Malaysia',
];

const Register = () => {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', password: '', confirm: '',
    line1: '', line2: '', city: '', state: '', pincode: '', country: 'India',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  // Address smart-search (Nominatim / OpenStreetMap)
  const [addrQuery, setAddrQuery] = useState('');
  const [addrSuggestions, setAddrSuggestions] = useState([]);
  const [addrLoading, setAddrLoading] = useState(false);
  const [addrOpen, setAddrOpen] = useState(false);
  const addrRef = useRef(null);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  useEffect(() => {
    if (addrQuery.length < 4) { setAddrSuggestions([]); return; }
    const timer = setTimeout(() => {
      setAddrLoading(true);
      fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addrQuery)}&format=json&addressdetails=1&limit=6&accept-language=en`)
        .then(r => r.json())
        .then(data => { setAddrSuggestions(data); setAddrOpen(true); })
        .catch(() => setAddrSuggestions([]))
        .finally(() => setAddrLoading(false));
    }, 500);
    return () => clearTimeout(timer);
  }, [addrQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const onClick = (e) => {
      if (addrRef.current && !addrRef.current.contains(e.target)) setAddrOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const applySuggestion = (place) => {
    const a = place.address || {};
    const road = [a.house_number, a.road].filter(Boolean).join(' ');
    const line2 = [a.suburb, a.neighbourhood, a.quarter].filter(Boolean)[0] || '';
    const city = a.city || a.town || a.village || a.municipality || '';
    const state = a.state || a.county || '';
    const pincode = a.postcode || '';
    const countryMatch = COUNTRIES.find(c => c.toLowerCase() === (a.country || '').toLowerCase());
    setForm(prev => ({
      ...prev,
      ...(road && { line1: road }),
      ...(line2 && { line2 }),
      ...(city && { city }),
      ...(state && { state }),
      ...(pincode && { pincode }),
      ...(countryMatch && { country: countryMatch }),
    }));
    setAddrQuery('');
    setAddrSuggestions([]);
    setAddrOpen(false);
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.phone.trim()) return setError('Phone number is required.');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    if (!form.line1.trim() || !form.city.trim() || !form.pincode.trim()) {
      return setError('Address line 1, city and pincode are required.');
    }
    setLoading(true);
    try {
      const address = {
        line1: form.line1.trim(),
        line2: form.line2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
        country: form.country,
        fullName: form.name,
        phone: form.phone,
      };
      await register(form.name, form.email, form.password, form.phone, address);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join our community of pickle lovers</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input type="text" id="name" name="name" value={form.name}
              onChange={handleChange} placeholder="Your full name" required autoFocus />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input type="email" id="email" name="email" value={form.email}
              onChange={handleChange} placeholder="you@example.com" required />
          </div>

          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input type="tel" id="phone" name="phone" value={form.phone}
              onChange={handleChange} placeholder="+91 90000 00000" required />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input type="password" id="password" name="password" value={form.password}
                onChange={handleChange} placeholder="Min. 6 characters" required />
            </div>
            <div className="form-group">
              <label htmlFor="confirm">Confirm Password</label>
              <input type="password" id="confirm" name="confirm" value={form.confirm}
                onChange={handleChange} placeholder="Repeat password" required />
            </div>
          </div>

          <div className="auth-section-divider">
            <span>Delivery Address</span>
          </div>

          {/* Smart address search */}
          <div className="form-group addr-search-wrap" ref={addrRef}>
            <label htmlFor="addr-search">
              🔍 Search Address
              <span className="optional">(start typing area, street, or pincode)</span>
            </label>
            <input
              type="text"
              id="addr-search"
              value={addrQuery}
              onChange={e => setAddrQuery(e.target.value)}
              onFocus={() => addrSuggestions.length > 0 && setAddrOpen(true)}
              placeholder="e.g. Banjara Hills Hyderabad, or 500034"
              autoComplete="off"
            />
            {addrLoading && <div className="addr-search-loading">Searching…</div>}
            {addrOpen && addrSuggestions.length > 0 && (
              <ul className="addr-search-dropdown">
                {addrSuggestions.map((p) => (
                  <li
                    key={p.place_id}
                    className="addr-search-item"
                    onClick={() => applySuggestion(p)}
                  >
                    <span className="addr-search-pin">📍</span>
                    <span className="addr-search-text">{p.display_name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="line1">Address Line 1</label>
            <input type="text" id="line1" name="line1" value={form.line1}
              onChange={handleChange} placeholder="House number, building, street" required />
          </div>

          <div className="form-group">
            <label htmlFor="line2">Address Line 2 <span className="optional">(optional)</span></label>
            <input type="text" id="line2" name="line2" value={form.line2}
              onChange={handleChange} placeholder="Area, landmark" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input type="text" id="city" name="city" value={form.city}
                onChange={handleChange} placeholder="Hyderabad" required />
            </div>
            <div className="form-group">
              <label htmlFor="state">State</label>
              <input type="text" id="state" name="state" value={form.state}
                onChange={handleChange} placeholder="Telangana" />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="pincode">Pincode / ZIP</label>
              <input type="text" id="pincode" name="pincode" value={form.pincode}
                onChange={handleChange} placeholder="500001" required />
            </div>
            <div className="form-group">
              <label htmlFor="country">Country</label>
              <select id="country" name="country" value={form.country} onChange={handleChange}>
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-btn" disabled={loading}>
            {loading ? 'Creating Account…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register;
