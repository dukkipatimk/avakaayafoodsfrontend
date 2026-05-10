import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 15000,
  headers: {
    ...(process.env.REACT_APP_DBSETUP_SECRET && {
      'X-DBSetup-Secret': process.env.REACT_APP_DBSETUP_SECRET,
    }),
  },
});

// Auto-attach JWT token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('akf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('akf_token');
      localStorage.removeItem('akf_user');
    }
    return Promise.reject(err);
  }
);

export default api;
