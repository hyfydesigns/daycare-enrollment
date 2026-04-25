import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) return setError('Passwords do not match.');
    if (form.password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    try {
      await register(form.email, form.password, form.full_name, form.phone);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-orange-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center text-white font-bold">EP</div>
            <span className="font-bold text-gray-800 text-xl">EnrollPack</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create Parent Account</h1>
          <p className="text-gray-500 text-sm mt-1">Register to begin your child's enrollment</p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Full Name <span className="required-star">*</span></label>
              <input type="text" className="form-input" placeholder="Jane Smith" value={form.full_name} onChange={set('full_name')} required />
            </div>
            <div>
              <label className="form-label">Email Address <span className="required-star">*</span></label>
              <input type="email" className="form-input" placeholder="jane@example.com" value={form.email} onChange={set('email')} required />
            </div>
            <div>
              <label className="form-label">Phone Number</label>
              <input type="tel" className="form-input" placeholder="(555) 000-0000" value={form.phone} onChange={set('phone')} />
            </div>
            <div>
              <label className="form-label">Password <span className="required-star">*</span></label>
              <input type="password" className="form-input" placeholder="Min. 8 characters" value={form.password} onChange={set('password')} required />
            </div>
            <div>
              <label className="form-label">Confirm Password <span className="required-star">*</span></label>
              <input type="password" className="form-input" value={form.confirm} onChange={set('confirm')} required />
            </div>
            <button type="submit" className="btn-primary w-full mt-2" disabled={loading}>
              {loading ? 'Creating Account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 font-medium hover:underline">Sign in</Link>
          </p>
        </div>

        <p className="text-center mt-4">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">← Back to Home</Link>
        </p>
      </div>
    </div>
  );
}
