import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

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

  useEffect(() => {
    const token = localStorage.getItem('akf_token');
    const savedUser = localStorage.getItem('akf_user');
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      refreshUser();
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('akf_token', data.token);
    localStorage.setItem('akf_user', JSON.stringify(data.user));
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password, phone, address) => {
    const { data } = await api.post('/auth/register', { name, email, password, phone, address });
    localStorage.setItem('akf_token', data.token);
    localStorage.setItem('akf_user', JSON.stringify(data.user));
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    refreshUser(); // pull the address created during registration
    return data;
  };

  const logout = () => {
    localStorage.removeItem('akf_token');
    localStorage.removeItem('akf_user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
