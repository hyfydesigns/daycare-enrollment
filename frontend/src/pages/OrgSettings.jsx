import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import Navbar from '../components/Navbar';
import { useOrg } from '../contexts/OrgContext';

export default function OrgSettings() {
  const { org, setOrg } = useOrg();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name:          org.name          || '',
    tagline:       org.tagline       || '',
    primary_color: org.primary_color || '#f97316',
    accent_color:  org.accent_color  || '#1f2937',
    logo_url:      org.logo_url      || '',
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState('');

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const payload = {
        name:          form.name          || undefined,
        tagline:       form.tagline       || undefined,
        primary_color: form.primary_color || undefined,
        accent_color:  form.accent_color  || undefined,
        logo_url:      form.logo_url      || undefined,
      };
      const { data } = await api.patch('/org', payload);
      setOrg(prev => ({ ...prev, ...data }));
      // Apply updated brand colors immediately
      document.documentElement.style.setProperty('--color-primary', data.primary_color);
      document.documentElement.style.setProperty('--color-accent',  data.accent_color);
      if (data.name) document.title = `${data.name} — Enrollment`;
      setSaved(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">

        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate('/admin')} className="text-gray-400 hover:text-gray-600 text-sm">
            ← Back
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Organization Settings</h1>
            <p className="text-gray-500 text-sm">Update your daycare's name, branding, and appearance.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Identity */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-800 text-base">Identity</h2>

            <div>
              <label className="form-label">Daycare Name</label>
              <input
                className="form-input"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="Sunshine Daycare"
                required
              />
            </div>

            <div>
              <label className="form-label">Tagline <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                className="form-input"
                value={form.tagline}
                onChange={e => set('tagline', e.target.value)}
                placeholder="Where little ones grow"
              />
            </div>

            <div>
              <label className="form-label">Logo URL <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                className="form-input"
                value={form.logo_url}
                onChange={e => set('logo_url', e.target.value)}
                placeholder="https://yourdaycare.com/logo.png"
              />
              {form.logo_url && (
                <div className="mt-2">
                  <img
                    src={form.logo_url}
                    alt="Logo preview"
                    className="h-12 w-auto object-contain rounded-lg border border-gray-100"
                    onError={e => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Paste a public image URL. Your logo appears in the navigation bar.
              </p>
            </div>
          </div>

          {/* Colors */}
          <div className="card space-y-4">
            <h2 className="font-semibold text-gray-800 text-base">Brand Colors</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="h-10 w-14 rounded-lg border border-gray-200 cursor-pointer p-1 flex-shrink-0"
                    value={form.primary_color}
                    onChange={e => set('primary_color', e.target.value)}
                  />
                  <input
                    className="form-input font-mono text-sm"
                    value={form.primary_color}
                    onChange={e => set('primary_color', e.target.value)}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    placeholder="#f97316"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Used for buttons, links, and highlights.</p>
              </div>

              <div>
                <label className="form-label">Accent Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    className="h-10 w-14 rounded-lg border border-gray-200 cursor-pointer p-1 flex-shrink-0"
                    value={form.accent_color}
                    onChange={e => set('accent_color', e.target.value)}
                  />
                  <input
                    className="form-input font-mono text-sm"
                    value={form.accent_color}
                    onChange={e => set('accent_color', e.target.value)}
                    pattern="^#[0-9A-Fa-f]{6}$"
                    placeholder="#1f2937"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Used for headings and secondary elements.</p>
              </div>
            </div>

            {/* Live preview */}
            <div className="rounded-xl border border-gray-100 p-4 bg-gray-50">
              <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">Preview</p>
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: form.primary_color }}
                >
                  {form.name ? form.name[0].toUpperCase() : '?'}
                </div>
                <div>
                  <span className="font-bold text-sm" style={{ color: form.accent_color }}>
                    {form.name || 'Your Daycare Name'}
                  </span>
                  {form.tagline && (
                    <p className="text-xs text-gray-400">{form.tagline}</p>
                  )}
                </div>
                <button
                  type="button"
                  className="ml-auto text-sm px-4 py-1.5 rounded-lg text-white font-medium"
                  style={{ background: form.primary_color }}
                >
                  Sample Button
                </button>
              </div>
            </div>
          </div>

          {/* Errors / Success */}
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-3 text-sm">{error}</div>
          )}
          {saved && (
            <div className="bg-green-50 border border-green-100 text-green-700 rounded-xl p-3 text-sm font-medium">
              ✓ Settings saved successfully.
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => navigate('/admin')} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
