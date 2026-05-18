import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const AuthContext = createContext();

// Idle session policy — log the user out after 30 minutes of no activity.
const ACTIVITY_KEY = 'akf_last_activity';
const IDLE_LIMIT_MS = 30 * 60 * 1000;     // 30 minutes
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];

const markActivity = () => localStorage.setItem(ACTIVITY_KEY, String(Date.now()));

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pull the full user record (including saved addresses) from the API.
  const refreshUser = async () => {
    try {
      const { data } = await api.get('/auth/me');
      if (data?.success && data.user) {
        localStorage.setItem('akf_user', JSON.stringify(data.user));
        setUser(data.user);
        return data.user;
      }
    } catch (e) {
      // keep existing session/user on failure
    }
  };

  const logout = () => {
    localStorage.removeItem('akf_token');
    localStorage.removeItem('akf_user');
    localStorage.removeItem(ACTIVITY_KEY);
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  // Idle timeout — clears the session and tells the user why.
  const expireSession = () => {
    logout();
    toast('You were logged out after 30 minutes of inactivity.', { icon: '🔒' });
  };

  // Restore a saved session on load — unless it has already gone idle.
  useEffect(() => {
    const token = localStorage.getItem('akf_token');
    const savedUser = localStorage.getItem('akf_user');
    if (token && savedUser) {
      const last = Number(localStorage.getItem(ACTIVITY_KEY) || 0);
      if (last && Date.now() - last > IDLE_LIMIT_MS) {
        // The tab was closed / inactive past the idle limit — drop the session.
        logout();
      } else {
        setUser(JSON.parse(savedUser));
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        markActivity();
        refreshUser();
      }
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // While logged in, track activity and auto-logout once idle past the limit.
  // Activity is stored in localStorage, so it is shared across tabs.
  useEffect(() => {
    if (!user) return;

    markActivity();
    let lastWrite = Date.now();

    const onActivity = () => {
      const now = Date.now();
      if (now - lastWrite > 15000) {        // throttle writes to ~15s
        lastWrite = now;
        localStorage.setItem(ACTIVITY_KEY, String(now));
      }
    };

    ACTIVITY_EVENTS.forEach(e => window.addEventListener(e, onActivity, { passive: true }));

    const timer = setInterval(() => {
      const last = Number(localStorage.getItem(ACTIVITY_KEY) || 0);
      if (last && Date.now() - last > IDLE_LIMIT_MS) {
        expireSession();
      }
    }, 30000);

    return () => {
      ACTIVITY_EVENTS.forEach(e => window.removeEventListener(e, onActivity));
      clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('akf_token', data.token);
    localStorage.setItem('akf_user', JSON.stringify(data.user));
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    markActivity();
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password, phone, address) => {
    const { data } = await api.post('/auth/register', { name, email, password, phone, address });
    localStorage.setItem('akf_token', data.token);
    localStorage.setItem('akf_user', JSON.stringify(data.user));
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    markActivity();
    setUser(data.user);
    refreshUser(); // pull the address created during registration
    return data;
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
