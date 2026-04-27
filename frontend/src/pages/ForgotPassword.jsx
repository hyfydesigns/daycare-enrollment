import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useOrg } from '../contexts/OrgContext';

export default function ForgotPassword() {
  const { org } = useOrg();
  const [email,       setEmail]       = useState('');
  const [submitted,   setSubmitted]   = useState(false);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Forgot your password?</h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <div className="card">
          {submitted ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📬</div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">Check your inbox</h2>
              <p className="text-gray-500 text-sm mb-6">
                If <strong>{email}</strong> is registered, you'll receive a password reset link shortly. The link expires in 1 hour.
              </p>
              <Link to="/login" className="btn-primary block text-center">
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    className="form-input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoFocus
                  />
                </div>
                <button type="submit" className="btn-primary w-full" disabled={loading}>
                  {loading ? 'Sending…' : 'Send Reset Link'}
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
