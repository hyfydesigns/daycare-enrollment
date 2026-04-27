import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const EP_COLOR = '#f97316';

function slugify(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export default function OrgSignup() {
  const appDomain = import.meta.env.VITE_APP_DOMAIN || 'enrollpack.com';

  const [form, setForm] = useState({
    org_name:  '',
    slug:      '',
    admin_name:'',
    email:     '',
    password:  '',
    confirm:   '',
  });
  const [slugEdited,    setSlugEdited]    = useState(false);
  const [slugStatus,    setSlugStatus]    = useState(null); // null | 'checking' | 'available' | 'taken' | 'invalid'
  const [submitting,    setSubmitting]    = useState(false);
  const [done,          setDone]          = useState(false);
  const [error,         setError]         = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Auto-generate slug from org name unless user has manually edited it
  useEffect(() => {
    if (!slugEdited && form.org_name) {
      set('slug', slugify(form.org_name).slice(0, 30));
    }
  }, [form.org_name, slugEdited]);

  // Debounced slug availability check
  const checkSlug = useCallback(
    debounce(async (slug) => {
      if (!slug || slug.length < 2) { setSlugStatus('invalid'); return; }
      setSlugStatus('checking');
      try {
        const { data } = await api.get(`/auth/check-slug?slug=${encodeURIComponent(slug)}`);
        setSlugStatus(data.available ? 'available' : 'taken');
      } catch {
        setSlugStatus(null);
      }
    }, 450),
    []
  );

  useEffect(() => {
    if (form.slug) checkSlug(form.slug);
    else setSlugStatus(null);
  }, [form.slug]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 8)       return setError('Password must be at least 8 characters.');
    if (slugStatus !== 'available')      return setError('Please choose an available subdomain.');

    setSubmitting(true);
    try {
      await api.post('/auth/org-signup', {
        org_name:   form.org_name.trim(),
        slug:       form.slug,
        admin_name: form.admin_name.trim(),
        email:      form.email.trim(),
        password:   form.password,
      });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Signup failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-orange-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-4">✉️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h1>
          <p className="text-gray-500 mb-6">
            We sent a verification link to <strong>{form.email}</strong>. Click the link to activate your account, then log in at your new portal.
          </p>
          <div className="card text-left space-y-3 mb-6">
            <p className="text-sm font-semibold text-gray-700">Your portal will be at:</p>
            <div className="bg-gray-50 rounded-xl px-4 py-3 font-mono text-sm text-primary-600 break-all">
              https://{form.slug}.{appDomain}
            </div>
            <p className="text-xs text-gray-400">Bookmark this — you'll share it with parents to enroll their children.</p>
          </div>
          <p className="text-sm text-gray-400">
            Didn't get the email?{' '}
            <button
              className="text-primary-600 hover:underline font-medium"
              onClick={() => api.post('/auth/resend-verification', { email: form.email })}
            >
              Resend verification
            </button>
          </p>
        </div>
      </div>
    );
  }

  const slugIndicator = {
    checking:  { icon: '…', cls: 'text-gray-400', msg: 'Checking…' },
    available: { icon: '✓', cls: 'text-green-600', msg: 'Available' },
    taken:     { icon: '✕', cls: 'text-red-500',   msg: 'Already taken' },
    invalid:   { icon: '–', cls: 'text-gray-400',  msg: 'Min. 2 characters' },
  }[slugStatus];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-orange-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base" style={{ background: EP_COLOR }}>EP</div>
            <span className="font-bold text-gray-800 text-xl">EnrollPack</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Set up your daycare portal</h1>
          <p className="text-gray-500 text-sm mt-1">Free 30-day trial · No credit card required</p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Org details */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Your Daycare</p>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Daycare Name <span className="required-star">*</span></label>
                  <input
                    className="form-input"
                    placeholder="Sunshine Learning Center"
                    value={form.org_name}
                    onChange={e => set('org_name', e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Your Portal URL <span className="required-star">*</span></label>
                  <div className="flex items-center gap-0">
                    <span className="inline-flex items-center px-3 h-10 rounded-l-xl border border-r-0 border-gray-200 bg-gray-50 text-gray-400 text-sm whitespace-nowrap">
                      https://
                    </span>
                    <input
                      className="form-input rounded-none flex-1 text-sm font-mono"
                      placeholder="sunshine"
                      value={form.slug}
                      onChange={e => {
                        setSlugEdited(true);
                        set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 30));
                      }}
                      required
                    />
                    <span className="inline-flex items-center px-3 h-10 rounded-r-xl border border-l-0 border-gray-200 bg-gray-50 text-gray-400 text-sm whitespace-nowrap">
                      .{appDomain}
                    </span>
                  </div>
                  {slugStatus && slugIndicator && (
                    <p className={`text-xs mt-1.5 flex items-center gap-1 ${slugIndicator.cls}`}>
                      <span className="font-bold">{slugIndicator.icon}</span> {slugIndicator.msg}
                      {slugStatus === 'available' && (
                        <span className="text-gray-400 ml-1">— {form.slug}.{appDomain}</span>
                      )}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">This is the link you'll share with parents. Keep it short and memorable.</p>
                </div>
              </div>
            </div>

            <hr className="border-gray-100" />

            {/* Admin account */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Your Admin Account</p>
              <div className="space-y-4">
                <div>
                  <label className="form-label">Full Name <span className="required-star">*</span></label>
                  <input
                    className="form-input"
                    placeholder="Jane Smith"
                    value={form.admin_name}
                    onChange={e => set('admin_name', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Email Address <span className="required-star">*</span></label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="jane@sunshine.com"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">We'll send a verification link to this address.</p>
                </div>
                <div>
                  <label className="form-label">Password <span className="required-star">*</span></label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="form-label">Confirm Password <span className="required-star">*</span></label>
                  <input
                    type="password"
                    className="form-input"
                    value={form.confirm}
                    onChange={e => set('confirm', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary w-full py-3 text-base mt-2"
              disabled={submitting || slugStatus !== 'available'}
            >
              {submitting ? 'Creating your portal…' : 'Create Free Account →'}
            </button>

            <p className="text-center text-xs text-gray-400">
              By signing up you agree to our{' '}
              <a href={`mailto:hello@${appDomain}`} className="text-primary-500 hover:underline">terms of service</a>.
            </p>
          </form>
        </div>

        <p className="text-center text-sm text-gray-400 mt-6">
          Already have an account?{' '}
          <span className="text-gray-500">Log in at your portal URL (e.g. <span className="font-mono">sunshine.{appDomain}</span>)</span>
        </p>

        <p className="text-center mt-3">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">← Back to home</Link>
        </p>

      </div>
    </div>
  );
}

// Simple debounce helper
function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}
