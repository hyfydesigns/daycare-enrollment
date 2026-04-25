import React, { useState, useEffect } from 'react';
import api from '../api/client';
import Navbar from '../components/Navbar';

const PLAN_OPTIONS = ['trial', 'starter', 'pro', 'inactive'];

const PLAN_COLORS = {
  trial:    'bg-yellow-100 text-yellow-700',
  starter:  'bg-blue-100 text-blue-700',
  pro:      'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-500',
};

function fmt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatCard({ label, value, color }) {
  return (
    <div className={`rounded-2xl px-4 py-5 text-center ${color}`}>
      <div className="text-3xl font-bold">{value ?? 0}</div>
      <div className="text-xs font-medium mt-1 opacity-80">{label}</div>
    </div>
  );
}

function NewOrgModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: '', slug: '', owner_email: '', owner_password: '', owner_name: '',
    primary_color: '#f97316', plan: 'trial',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post('/superadmin/orgs', form);
      onCreated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create organization');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Add New Organization</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name *</label>
            <input className="form-input" required value={form.name}
              onChange={e => set('name', e.target.value)} placeholder="Sunshine Daycare" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (subdomain) *</label>
            <input className="form-input" required value={form.slug}
              onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
              placeholder="sunshine" />
            <p className="text-xs text-gray-400 mt-1">Used in the URL: sunshine.yourapp.com</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email *</label>
            <input className="form-input" type="email" required value={form.owner_email}
              onChange={e => set('owner_email', e.target.value)} placeholder="admin@sunshine.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password *</label>
            <input className="form-input" type="password" required value={form.owner_password}
              onChange={e => set('owner_password', e.target.value)} placeholder="Minimum 8 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Full Name</label>
            <input className="form-input" value={form.owner_name}
              onChange={e => set('owner_name', e.target.value)} placeholder="Jane Smith" />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select className="form-input" value={form.plan} onChange={e => set('plan', e.target.value)}>
                {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Brand Color</label>
              <input type="color" className="h-10 w-16 rounded-lg border border-gray-200 cursor-pointer p-1"
                value={form.primary_color} onChange={e => set('primary_color', e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Creating…' : 'Create Organization'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditPlanModal({ org, onClose, onUpdated }) {
  const [plan, setPlan] = useState(org.plan);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await api.patch(`/superadmin/orgs/${org.id}`, { plan });
      onUpdated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update plan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Change Plan</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">{error}</div>}
          <p className="text-sm text-gray-600">Organization: <strong>{org.name}</strong></p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
            <select className="form-input" value={plan} onChange={e => setPlan(e.target.value)}>
              {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewOrg, setShowNewOrg] = useState(false);
  const [editOrg, setEditOrg] = useState(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/superadmin/stats'),
      api.get('/superadmin/orgs'),
    ]).then(([s, o]) => {
      setStats(s.data);
      setOrgs(o.data);
    }).catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreated = (org) => setOrgs(prev => [org, ...prev]);
  const handleUpdated = (updated) => setOrgs(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">⭐ Platform Dashboard</h1>
            <p className="text-gray-500 text-sm">Manage all organizations on the platform.</p>
          </div>
          <button onClick={() => setShowNewOrg(true)} className="btn-primary">
            + Add Organization
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 mb-8">
            <StatCard label="Total Orgs"    value={stats.orgs}        color="bg-gray-100 text-gray-700" />
            <StatCard label="Active Orgs"   value={stats.active_orgs} color="bg-green-100 text-green-700" />
            <StatCard label="Parents"       value={stats.users}       color="bg-blue-100 text-blue-700" />
            <StatCard label="Enrollments"   value={stats.enrollments} color="bg-purple-100 text-purple-700" />
            <StatCard label="Submitted"     value={stats.submitted}   color="bg-yellow-100 text-yellow-700" />
            <StatCard label="Approved"      value={stats.approved}    color="bg-teal-100 text-teal-700" />
          </div>
        )}

        {/* Orgs Table */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
          </div>
        ) : orgs.length === 0 ? (
          <div className="card text-center py-12">
            <div className="text-4xl mb-3">🏢</div>
            <p className="text-gray-500">No organizations yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Organization</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Slug</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Plan</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Users</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Enrollments</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Created</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {orgs.map((org) => (
                    <tr key={org.id} className="hover:bg-orange-50/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md flex-shrink-0"
                            style={{ background: org.primary_color || '#f97316' }} />
                          <span className="font-medium text-gray-800">{org.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{org.slug}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[org.plan] || 'bg-gray-100 text-gray-600'}`}>
                          {org.plan}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{org.user_count ?? 0}</td>
                      <td className="px-4 py-3 text-gray-600">{org.enrollment_count ?? 0}</td>
                      <td className="px-4 py-3 text-gray-500">{fmt(org.created_at)}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setEditOrg(org)}
                          className="btn-secondary text-xs py-1.5 px-3 whitespace-nowrap"
                        >
                          Edit Plan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showNewOrg && <NewOrgModal onClose={() => setShowNewOrg(false)} onCreated={handleCreated} />}
      {editOrg   && <EditPlanModal org={editOrg} onClose={() => setEditOrg(null)} onUpdated={handleUpdated} />}
    </div>
  );
}
