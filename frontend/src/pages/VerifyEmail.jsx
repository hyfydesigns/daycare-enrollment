import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function VerifyEmail() {
  const appDomain = import.meta.env.VITE_APP_DOMAIN || 'enrollpack.com';

  const [status,   setStatus]   = useState('verifying'); // verifying | success | expired | error
  const [slug,     setSlug]     = useState('');
  const [orgName,  setOrgName]  = useState('');
  const [email,    setEmail]    = useState('');
  const [resent,   setResent]   = useState(false);
  const [resending,setResending]= useState(false);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) { setStatus('error'); return; }

    api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(({ data }) => {
        setSlug(data.slug || '');
        setOrgName(data.org_name || '');
        setStatus('success');
      })
      .catch(err => {
        const data = err.response?.data || {};
        if (data.expired) {
          setEmail(data.email || '');
          setStatus('expired');
        } else {
          setStatus('error');
        }
      });
  }, []);

  const resendVerification = async () => {
    setResending(true);
    try {
      await api.post('/auth/resend-verification', { email });
      setResent(true);
    } catch {
      // still show success to prevent enumeration
      setResent(true);
    } finally {
      setResending(false);
    }
  };

  const loginUrl = slug ? `https://${slug}.${appDomain}/login` : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base bg-primary-500">EP</div>
            <span className="font-bold text-gray-800 text-xl">EnrollPack</span>
          </Link>
        </div>

        <div className="card text-center">

          {/* Verifying */}
          {status === 'verifying' && (
            <>
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 mb-1">Verifying your email…</h1>
              <p className="text-gray-500 text-sm">This will only take a moment.</p>
            </>
          )}

          {/* Success */}
          {status === 'success' && (
            <>
              <div className="text-5xl mb-4">🎉</div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Email verified!</h1>
              <p className="text-gray-500 mb-6">
                {orgName ? <><strong>{orgName}</strong> is ready. </> : ''}
                You can now log in to your admin dashboard. Check your email for the welcome message — it has everything you need to get started.
              </p>
              {loginUrl ? (
                <a
                  href={loginUrl}
                  className="btn-primary block text-center py-3 text-base"
                >
                  Go to {orgName || 'My'} Dashboard →
                </a>
              ) : (
                <p className="text-sm text-gray-400">Log in at your portal URL to get started.</p>
              )}
              {loginUrl && (
                <p className="text-xs text-gray-400 mt-3 font-mono">{loginUrl}</p>
              )}
            </>
          )}

          {/* Expired */}
          {status === 'expired' && (
            <>
              <div className="text-5xl mb-4">⏰</div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Link expired</h1>
              <p className="text-gray-500 text-sm mb-6">
                This verification link is more than 24 hours old. Request a new one below.
              </p>
              {resent ? (
                <div className="bg-green-50 border border-green-100 text-green-700 rounded-xl p-3 text-sm font-medium">
                  ✓ A new verification email is on its way.
                </div>
              ) : (
                <button
                  onClick={resendVerification}
                  className="btn-primary w-full"
                  disabled={resending}
                >
                  {resending ? 'Sending…' : 'Resend Verification Email'}
                </button>
              )}
            </>
          )}

          {/* Generic error */}
          {status === 'error' && (
            <>
              <div className="text-5xl mb-4">🔗</div>
              <h1 className="text-xl font-bold text-gray-900 mb-2">Invalid link</h1>
              <p className="text-gray-500 text-sm mb-6">
                This verification link is invalid or has already been used. If you've already verified your email, go ahead and log in at your portal URL.
              </p>
              <Link to="/" className="btn-secondary block text-center">
                Back to Home
              </Link>
            </>
          )}

        </div>

        <p className="text-center mt-6">
          <Link to="/" className="text-sm text-gray-400 hover:text-gray-600">← Back to EnrollPack</Link>
        </p>

      </div>
    </div>
  );
}
