// Development-only proxy allows reviewing the admin UI on another local port.
// Set DEV_API_TARGET to the API origin and REACT_APP_API_URL to /api.
const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  if (!process.env.DEV_API_TARGET) return;
  app.use('/api', createProxyMiddleware({
    target: process.env.DEV_API_TARGET,
    changeOrigin: true,
    onProxyReq(proxyReq) {
      proxyReq.removeHeader('origin');
    },
  }));
};
