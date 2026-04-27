import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOrg } from '../contexts/OrgContext';
import api from '../api/client';

export default function Login() {
  const [params] = useSearchParams();
  const isStaff = params.get('role') === 'staff';
  const { login } = useAuth();
  const { org } = useOrg();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: isStaff ? 'admin@daycare.com' : '', password: '' });
  const [error,          setError]          = useState('');
  const [unverified,     setUnverified]     = useState(false);
  const [resendEmail,    setResendEmail]    = useState('');
  const [resent,         setResent]         = useState(false);
  const [resending,      setResending]      = useState(false);
  const [loading,        setLoading]        = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUnverified(false);
    setResent(false);
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      if (user.role === 'superadmin') navigate('/superadmin');
      else if (user.role === 'admin') navigate('/admin');
      else navigate('/dashboard');
    } catch (err) {
      const data = err.response?.data || {};
      if (data.email_unverified) {
        setUnverified(true);
        setResendEmail(data.email || form.email);
        setError(data.error);
      } else {
        setError(data.error || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email: resendEmail });
      setResent(true);
    } catch {
      setResent(true); // still show success to prevent enumeration
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
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
          <h1 className="text-2xl font-bold text-gray-900">
            {isStaff ? 'Staff Login' : 'Parent Login'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isStaff ? 'Access the enrollment dashboard' : 'View and manage your enrollment forms'}
          </p>
        </div>

        <div className="card">
          {isStaff && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
              Default credentials: <strong>admin@daycare.com</strong> / <strong>Admin1234!</strong>
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
              {error}
              {unverified && (
                <div className="mt-2 pt-2 border-t border-red-100">
                  {resent ? (
                    <p className="text-green-700 font-medium">✓ Verification email sent — check your inbox.</p>
                  ) : (
                    <button
                      type="button"
                      onClick={resendVerification}
                      disabled={resending}
                      className="text-red-700 font-semibold underline hover:no-underline"
                    >
                      {resending ? 'Sending…' : 'Resend verification email'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Email Address</label>
              <input type="email" className="form-input" value={form.email} onChange={set('email')} required autoFocus />
            </div>
            <div>
              <label className="form-label">Password</label>
              <input type="password" className="form-input" value={form.password} onChange={set('password')} required />
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {!isStaff && (
            <p className="text-center text-sm text-gray-500 mt-4">
              New parent?{' '}
              <Link to="/register" className="text-primary-600 font-medium hover:underline">
                Create an account
              </Link>
            </p>
          )}
          {isStaff && (
            <p className="text-center text-sm text-gray-500 mt-4">
              <Link to="/login" className="text-primary-600 hover:underline">← Parent Login</Link>
            </p>
          )}
        </div>

        <p className="text-center mt-4">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
