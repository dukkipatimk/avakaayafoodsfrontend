import api from './api';

const SESSION_KEY = 'akf_tracking_session';
const STAFF_ROLES = new Set(['admin', 'store_manager']);

const isStaffViewer = () => {
  try {
    const user = JSON.parse(localStorage.getItem('akf_user') || 'null');
    return STAFF_ROLES.has(user?.role);
  } catch {
    return false;
  }
};

export const getTrackingSessionId = () => {
  let sessionId = localStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `visitor-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
    localStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
};

export const trackEvent = (eventType, payload = {}) => {
  if (window.location.pathname.startsWith('/admin') || isStaffViewer()) return;
  api.post('/tracking/event', {
    sessionId: getTrackingSessionId(),
    eventType,
    path: `${window.location.pathname}${window.location.search}`,
    ...payload,
  }).catch(() => {
    // Tracking must never interrupt browsing or checkout.
  });
};
