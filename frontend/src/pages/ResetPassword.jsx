import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useOrg } from '../contexts/OrgContext';

export default function ResetPassword() {
  const { org }  = useOrg();
  const navigate = useNavigate();
  const token    = new URLSearchParams(window.location.search).get('token');

  const [form,    setForm]    = useState({ password: '', confirm: '' });
  const [done,    setDone]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 8)       return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password: form.password });
      setDone(true);
    } catch (err) {
      const data = err.response?.data || {};
      setError(data.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-orange-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center card">
          <div className="text-4xl mb-3">🔗</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid link</h1>
          <p className="text-gray-500 text-sm mb-4">This password reset link is missing or invalid.</p>
          <Link to="/forgot-password" className="btn-primary block text-center">Request a new link</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="h-10 w-auto object-contain" />
            ) : (
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0"
                style={{ background: org.primary_color }}
              >
                {org.name ? org.name[0].toUpperCase() : 'E'}
              </div>
            )}
            <span className="font-bold text-gray-800 text-xl">{org.name}</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Set a new password</h1>
          <p className="text-gray-500 text-sm mt-1">Choose something strong and memorable.</p>
        </div>

        <div className="card">
          {done ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Password updated!</h2>
              <p className="text-gray-500 text-sm mb-6">Your password has been changed. You can now log in with your new password.</p>
              <Link to="/login" className="btn-primary block text-center">Go to Login</Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                  {error}
                  {error.toLowerCase().includes('expired') && (
                    <div className="mt-2">
                      <Link to="/forgot-password" className="font-semibold underline">
                        Request a new reset link →
                      </Link>
                    </div>
                  )}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    placeholder="Min. 8 characters"
                    value={form.password}
                    onChange={set('password')}
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={form.confirm}
                    onChange={set('confirm')}
                    required
                  />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? 'Updating…' : 'Update Password'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center mt-4">
          <Link to="/login" className="text-sm text-gray-400 hover:text-gray-600">← Back to Login</Link>
        </p>

      </div>
    </div>
  );
}
