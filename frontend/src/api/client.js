import axios from 'axios';

// Derive the org slug from the subdomain.
// Only extracts a slug when the hostname ends with the configured APP_DOMAIN
// (e.g. "sunshine.myapp.com" → "sunshine" when VITE_APP_DOMAIN=myapp.com).
// Falls back to 'default' for direct platform URLs and local dev.
function getOrgSlug() {
  const appDomain = import.meta.env.VITE_APP_DOMAIN; // e.g. "myapp.com"
  const hostname = window.location.hostname;
  if (appDomain && hostname.endsWith('.' + appDomain)) {
    const prefix = hostname.slice(0, hostname.length - appDomain.length - 1);
    if (prefix && !prefix.includes('.')) return prefix; // single-level subdomain only
  }
  return 'default';
}

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  config.headers['X-Org-Slug'] = getOrgSlug();
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
