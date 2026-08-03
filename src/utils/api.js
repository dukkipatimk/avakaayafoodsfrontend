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
  // Cache-buster on GETs: the catalog is served no-store, but a browser/CDN may
  // still hold a copy cached under an older header. A unique query param means a
  // stale copy is never reused, so category pages/mega-menus always show current
  // data. (Query params keep this a "simple" CORS request — no preflight.)
  if ((config.method || 'get').toLowerCase() === 'get') {
    config.params = { ...(config.params || {}), _ts: Date.now() };
  }
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
