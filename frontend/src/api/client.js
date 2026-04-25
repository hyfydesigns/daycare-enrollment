import axios from 'axios';

// Derive the org slug from the subdomain (e.g. "sunshine" from "sunshine.app.com").
// Falls back to 'default' in local development (localhost has no subdomain).
function getOrgSlug() {
  const parts = window.location.hostname.split('.');
  return parts.length >= 3 ? parts[0] : 'default';
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
