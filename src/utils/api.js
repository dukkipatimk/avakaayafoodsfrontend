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

// ── Global loading state ──────────────────────────────────────────────
// Tracks in-flight requests so a single global loader can show automatically.
// Background/analytics calls (tracking) are excluded so they don't flash the bar.
let pending = 0;
const loadingListeners = new Set();
const notifyLoading = () => loadingListeners.forEach(fn => fn(pending));
const isSilent = (url = '') => url.includes('/tracking');

export const onLoadingChange = (fn) => {
  loadingListeners.add(fn);
  return () => loadingListeners.delete(fn);
};

// Auto-attach JWT token + count the request
api.interceptors.request.use(config => {
  const token = localStorage.getItem('akf_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (!isSilent(config.url)) {
    config._counted = true;
    pending += 1;
    notifyLoading();
  }
  return config;
});

const releaseRequest = (config) => {
  if (config?._counted) {
    pending = Math.max(0, pending - 1);
    notifyLoading();
  }
};

api.interceptors.response.use(
  res => {
    releaseRequest(res.config);
    return res;
  },
  err => {
    releaseRequest(err.config);
    if (err.response?.status === 401) {
      localStorage.removeItem('akf_token');
      localStorage.removeItem('akf_user');
    }
    return Promise.reject(err);
  }
);

export default api;
