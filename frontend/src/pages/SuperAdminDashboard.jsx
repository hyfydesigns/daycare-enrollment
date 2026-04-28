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

function EditOrgModal({ org, onClose, onUpdated }) {
  const [form, setForm] = useState({
    name:          org.name          || '',
    slug:          org.slug          || '',
    owner_email:   org.owner_email   || '',
    tagline:       org.tagline       || '',
    primary_color: org.primary_color || '#f97316',
    accent_color:  org.accent_color  || '#1f2937',
    logo_url:      org.logo_url      || '',
    plan:          org.plan          || 'trial',
  });
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await api.patch(`/superadmin/orgs/${org.id}`, form);
      onUpdated(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update organization');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg my-4">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Edit Organization</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
              <input className="form-input" required value={form.name}
                onChange={e => set('name', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
              <input className="form-input" type="email" value={form.owner_email}
                onChange={e => set('owner_email', e.target.value)} placeholder="admin@daycare.com" />
              <p className="text-xs text-gray-400 mt-1">Contact email for this organization's administrator.</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
              <input className="form-input font-mono text-sm" required value={form.slug}
                onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} />
              <p className="text-xs text-gray-400 mt-1">Used in the subdomain URL</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
              <select className="form-input" value={form.plan} onChange={e => set('plan', e.target.value)}>
                {PLAN_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tagline <span className="text-gray-400 font-normal">(optional)</span></label>
              <input className="form-input" value={form.tagline}
                onChange={e => set('tagline', e.target.value)} placeholder="Where little ones grow" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL <span className="text-gray-400 font-normal">(optional)</span></label>
              <input className="form-input" value={form.logo_url}
                onChange={e => set('logo_url', e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
              <div className="flex items-center gap-2">
                <input type="color" className="h-9 w-12 rounded-lg border border-gray-200 cursor-pointer p-1 flex-shrink-0"
                  value={form.primary_color} onChange={e => set('primary_color', e.target.value)} />
                <input className="form-input font-mono text-sm" value={form.primary_color}
                  onChange={e => set('primary_color', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Accent Color</label>
              <div className="flex items-center gap-2">
                <input type="color" className="h-9 w-12 rounded-lg border border-gray-200 cursor-pointer p-1 flex-shrink-0"
                  value={form.accent_color} onChange={e => set('accent_color', e.target.value)} />
                <input className="form-input font-mono text-sm" value={form.accent_color}
                  onChange={e => set('accent_color', e.target.value)} />
              </div>
            </div>
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

function ImportOrgModal({ onClose, onImported }) {
  const [step,    setStep]    = useState('upload');  // 'upload' | 'preview' | 'success'
  const [bundle,  setBundle]  = useState(null);
  const [result,  setResult]  = useState(null);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [copied,  setCopied]  = useState(false);

  const handleFile = (e) => {
    setError('');
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.organization || !parsed.users || !parsed.enrollments) {
          setError('This file doesn\'t look like an EnrollPack export. Make sure you upload the correct file.');
          return;
        }
        setBundle(parsed);
        setStep('preview');
      } catch {
        setError('Could not parse the file. Make sure it\'s a valid JSON export from EnrollPack.');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/superadmin/orgs/import', bundle);
      setResult(data);
      onImported(data.org);
      setStep('success');
    } catch (err) {
      setError(err.response?.data?.error || 'Import failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const copyPassword = () => {
    navigator.clipboard.writeText(result.temp_password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const org = bundle?.organization;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {step === 'upload'  && '📥 Reinstate Organization'}
            {step === 'preview' && '🔍 Review Import'}
            {step === 'success' && '✅ Organization Reinstated'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">{error}</div>}

          {/* Step 1: Upload */}
          {step === 'upload' && (
            <>
              <p className="text-sm text-gray-600">
                Upload a JSON export file to reinstate a deleted organization. All users and enrollments will be restored.
              </p>
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-primary-300 hover:bg-primary-50/30 transition-colors">
                <div className="text-3xl mb-2">📂</div>
                <p className="text-sm font-medium text-gray-700">Click to choose export file</p>
                <p className="text-xs text-gray-400 mt-1">enrollpack-export-*.json</p>
                <input type="file" accept=".json,application/json" className="hidden" onChange={handleFile} />
              </label>
              <button onClick={onClose} className="btn-secondary w-full">Cancel</button>
            </>
          )}

          {/* Step 2: Preview */}
          {step === 'preview' && org && (
            <>
              <p className="text-sm text-gray-600">
                Review the data below before importing. This will create a new organization and restore all records.
              </p>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Organization</span>
                  <span className="font-medium text-gray-800">{org.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subdomain</span>
                  <span className="font-mono text-xs text-gray-700">{org.slug}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Plan</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[org.plan] || 'bg-gray-100'}`}>{org.plan}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Users to restore</span>
                  <span className="font-medium text-gray-800">{bundle.users.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Enrollments to restore</span>
                  <span className="font-medium text-gray-800">{bundle.enrollments.length}</span>
                </div>
                {bundle.export_metadata?.exported_at && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Exported on</span>
                    <span className="text-gray-700">{fmt(bundle.export_metadata.exported_at)}</span>
                  </div>
                )}
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs text-amber-700">
                  <strong>Passwords were not exported.</strong> Admin accounts will receive a temporary password that you'll see after import. Parents will need to reset their passwords via "Forgot password."
                </p>
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => { setBundle(null); setStep('upload'); setError(''); }} className="btn-secondary flex-1">
                  ← Back
                </button>
                <button onClick={handleImport} disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Importing…' : 'Reinstate Organization'}
                </button>
              </div>
            </>
          )}

          {/* Step 3: Success */}
          {step === 'success' && result && (
            <>
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-green-700 mb-1">Organization reinstated successfully</p>
                <p className="text-sm text-green-600">
                  Restored {result.imported.users} user{result.imported.users !== 1 ? 's' : ''} and{' '}
                  {result.imported.enrollments} enrollment{result.imported.enrollments !== 1 ? 's' : ''}.
                  {result.imported.skipped > 0 && ` (${result.imported.skipped} enrollment${result.imported.skipped !== 1 ? 's' : ''} skipped — user not found.)`}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Temporary Admin Credentials</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Email</span>
                  <span className="font-mono text-gray-800">{result.admin_email}</span>
                </div>
                <div className="flex items-center justify-between text-sm gap-2">
                  <span className="text-gray-500 flex-shrink-0">Password</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono bg-white border border-gray-200 px-2 py-1 rounded-lg text-gray-800 text-xs tracking-wider">
                      {result.temp_password}
                    </span>
                    <button
                      onClick={copyPassword}
                      className="flex-shrink-0 text-xs px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
                    >
                      {copied ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs text-amber-700">
                  Send these credentials to the daycare admin. They should log in and change their password immediately.
                  Parent accounts need to reset their passwords via <strong>Forgot Password</strong> on their login page.
                </p>
              </div>

              <button onClick={onClose} className="btn-primary w-full">Done</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DeleteOrgModal({ org, onClose, onDeleted }) {
  const [step,        setStep]        = useState('export');   // 'export' | 'confirm'
  const [exported,    setExported]    = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [deleting,    setDeleting]    = useState(false);
  const [error,       setError]       = useState('');

  const handleExport = async () => {
    try {
      const res = await api.get(`/superadmin/orgs/${org.id}/export`, { responseType: 'blob' });
      const url  = URL.createObjectURL(new Blob([res.data], { type: 'application/json' }));
      const filename = `enrollpack-export-${org.slug}-${new Date().toISOString().slice(0,10)}.json`;
      const a = document.createElement('a');
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      setExported(true);
    } catch {
      setError('Export failed. Please try again.');
    }
  };

  const handleDelete = async () => {
    if (confirmName.trim() !== org.name.trim()) {
      setError('Organization name does not match.');
      return;
    }
    setDeleting(true);
    setError('');
    try {
      await api.delete(`/superadmin/orgs/${org.id}`, { data: { confirm_name: confirmName } });
      onDeleted(org.id);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Deletion failed. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {step === 'export' ? '📦 Export Data' : '⚠️ Delete Organization'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="bg-red-50 text-red-600 rounded-lg p-3 text-sm">{error}</div>}

          {step === 'export' && (
            <>
              <p className="text-sm text-gray-600">
                Before deleting <strong>{org.name}</strong>, download a full export of their data.
                You'll need this file to reinstate them later.
              </p>

              {/* Org summary */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Organization</span>
                  <span className="font-medium text-gray-800">{org.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subdomain</span>
                  <span className="font-mono text-xs text-gray-700">{org.slug}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Plan</span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PLAN_COLORS[org.plan] || 'bg-gray-100'}`}>{org.plan}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Users</span>
                  <span className="font-medium text-gray-800">{org.user_count ?? 0}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Enrollments</span>
                  <span className="font-medium text-gray-800">{org.enrollment_count ?? 0}</span>
                </div>
              </div>

              <button
                onClick={handleExport}
                className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${
                  exported
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'btn-secondary'
                }`}
              >
                {exported ? '✓ Export Downloaded' : '⬇ Download Data Export'}
              </button>

              {!exported && (
                <p className="text-xs text-gray-400 text-center">
                  You must download the export before you can delete this organization.
                </p>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
                <button
                  onClick={() => { setError(''); setStep('confirm'); }}
                  disabled={!exported}
                  className="btn-primary flex-1 disabled:opacity-40 disabled:cursor-not-allowed bg-red-500 hover:bg-red-600 border-red-500 focus:ring-red-400"
                >
                  Continue to Delete →
                </button>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <>
              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-700 mb-1">⚠️ This action is permanent</p>
                <p className="text-sm text-red-600">
                  Deleting <strong>{org.name}</strong> will permanently remove their organization,
                  all {org.user_count ?? 0} user accounts, and all {org.enrollment_count ?? 0} enrollment
                  records. This cannot be undone — only the downloaded export can restore their data.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-gray-800">{org.name}</span> to confirm
                </label>
                <input
                  className="form-input"
                  placeholder={org.name}
                  value={confirmName}
                  onChange={e => { setConfirmName(e.target.value); setError(''); }}
                  autoFocus
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button onClick={() => { setStep('export'); setError(''); setConfirmName(''); }} className="btn-secondary flex-1">
                  ← Back
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting || confirmName.trim() !== org.name.trim()}
                  className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Deleting…' : 'Delete Organization'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewOrg,    setShowNewOrg]    = useState(false);
  const [showImport,    setShowImport]    = useState(false);
  const [editOrg,       setEditOrg]       = useState(null);
  const [deleteOrg,     setDeleteOrg]     = useState(null);

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

  const handleCreated  = (org)     => setOrgs(prev => [org, ...prev]);
  const handleUpdated  = (updated) => setOrgs(prev => prev.map(o => o.id === updated.id ? { ...o, ...updated } : o));
  const handleDeleted  = (orgId)   => setOrgs(prev => prev.filter(o => o.id !== orgId));
  const handleImported = (org)     => setOrgs(prev => [org, ...prev]);

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
          <div className="flex items-center gap-2">
            <button onClick={() => setShowImport(true)} className="btn-secondary text-sm">
              📥 Reinstate Org
            </button>
            <button onClick={() => setShowNewOrg(true)} className="btn-primary">
              + Add Organization
            </button>
          </div>
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
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditOrg(org)}
                            className="btn-secondary text-xs py-1.5 px-3 whitespace-nowrap"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setDeleteOrg(org)}
                            className="text-xs py-1.5 px-3 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors whitespace-nowrap"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showNewOrg  && <NewOrgModal    onClose={() => setShowNewOrg(false)}  onCreated={handleCreated} />}
      {showImport  && <ImportOrgModal onClose={() => setShowImport(false)}  onImported={handleImported} />}
      {editOrg     && <EditOrgModal   org={editOrg}   onClose={() => setEditOrg(null)}   onUpdated={handleUpdated} />}
      {deleteOrg   && <DeleteOrgModal org={deleteOrg} onClose={() => setDeleteOrg(null)} onDeleted={handleDeleted} />}
    </div>
  );
}
