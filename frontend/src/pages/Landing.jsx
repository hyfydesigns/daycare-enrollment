import React from 'react';
import { Link } from 'react-router-dom';
import { useOrg } from '../contexts/OrgContext';

const steps = [
  { icon: '📝', title: 'Register', desc: 'Create your parent account in minutes.' },
  { icon: '📋', title: 'Fill the Form', desc: 'Complete the enrollment form online at your own pace.' },
  { icon: '✅', title: 'Submit', desc: 'Submit your form to the daycare for review.' },
  { icon: '✍️', title: 'Sign In Person', desc: 'Visit us to physically sign the printed form.' },
];

export default function Landing() {
  const { org } = useOrg();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-warm-50 to-orange-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="h-8 w-auto object-contain" />
            ) : (
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                style={{ background: org.primary_color }}
              >
                {org.name ? org.name[0].toUpperCase() : 'E'}
              </div>
            )}
            <span className="font-bold text-gray-800 text-lg">{org.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/login?role=staff" className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              Staff Login
            </Link>
            <Link to="/login" className="btn-secondary text-sm py-2 px-4">
              Parent Login
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          <span>🌟</span> Online Enrollment Now Available
        </div>

        {org.logo_url ? (
          <div className="flex justify-center mb-4">
            <img src={org.logo_url} alt={org.name} className="h-20 w-auto object-contain" />
          </div>
        ) : null}

        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
          Welcome to<br />
          <span className="text-primary-500">{org.name}</span>
        </h1>

        {org.tagline && (
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-2">{org.tagline}</p>
        )}

        <p className="text-base text-gray-400 max-w-xl mx-auto mb-8">
          Fill out the Texas state enrollment form online, save your progress, and submit when you're ready.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/register" className="btn-primary text-base px-8 py-3">
            Start Enrollment
          </Link>
          <Link to="/login" className="btn-secondary text-base px-8 py-3">
            I Have an Account
          </Link>
        </div>
      </section>

      {/* Steps */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-16">
        <h2 className="text-center text-xl font-semibold text-gray-700 mb-8">How It Works</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {steps.map((s, i) => (
            <div key={i} className="card text-center">
              <div className="text-3xl mb-2">{s.icon}</div>
              <div className="font-semibold text-gray-800 text-sm mb-1">{s.title}</div>
              <div className="text-xs text-gray-500">{s.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Staff section */}
      <section className="border-t border-gray-200 bg-white/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">{org.name} Staff?</h3>
            <p className="text-sm text-gray-500">Log in to review submissions, print forms, and manage enrollments.</p>
          </div>
          <Link to="/login?role=staff" className="btn-secondary whitespace-nowrap">
            Staff Login →
          </Link>
        </div>
      </section>

      <footer className="text-center py-6 text-xs text-gray-400">
        © {new Date().getFullYear()} {org.name} · Powered by EnrollPack
      </footer>
    </div>
  );
}
