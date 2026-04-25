import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const features = [
  { icon: '📋', title: 'Digital Enrollment Forms', desc: 'Parents complete Texas HHSC Form 2935 online — no paper, no printing, no lost forms.' },
  { icon: '💼', title: 'Admin Dashboard', desc: 'Review submissions, track status, add notes, and approve enrollments in one place.' },
  { icon: '🖨️', title: 'Print-Ready Output', desc: 'Generate perfectly formatted, print-ready forms at the click of a button.' },
  { icon: '🎨', title: 'Your Brand', desc: 'Custom name, logo, and colors on your enrollment portal. Parents see your daycare, not ours.' },
  { icon: '🔒', title: 'Secure & Private', desc: "Each daycare's data is completely isolated. Role-based access for staff and parents." },
  { icon: '📱', title: 'Mobile Friendly', desc: 'Parents can fill out forms on their phone, tablet, or computer — any time, anywhere.' },
];

const plans = [
  {
    name: 'Starter',
    price: '$29',
    period: '/month',
    desc: 'Perfect for small daycares just getting started.',
    features: ['Unlimited enrollments', 'Parent portal', 'Admin dashboard', 'Print-ready forms', 'Email support'],
    cta: 'Get Started',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$79',
    period: '/month',
    desc: 'For growing daycares that want the full experience.',
    features: ['Everything in Starter', 'Custom branding & colors', 'Custom logo', 'Priority support', 'Multiple staff accounts'],
    cta: 'Get Started',
    highlight: true,
  },
];

function FindPortal() {
  const [slug, setSlug] = useState('');
  const appDomain = import.meta.env.VITE_APP_DOMAIN || 'enrollpack.com';

  const go = (e) => {
    e.preventDefault();
    const clean = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
    if (clean) window.location.href = `https://${clean}.${appDomain}`;
  };

  return (
    <form onSubmit={go} className="flex gap-2 max-w-sm mx-auto">
      <input
        className="form-input flex-1 text-sm"
        placeholder="your-daycare-name"
        value={slug}
        onChange={e => setSlug(e.target.value)}
        required
      />
      <button type="submit" className="btn-secondary text-sm px-4 whitespace-nowrap">Go →</button>
    </form>
  );
}

export default function PlatformLanding() {
  const contactEmail = 'hello@enrollpack.com';

  return (
    <div className="min-h-screen bg-white">

      {/* Nav */}
      <header className="border-b border-gray-100 sticky top-0 bg-white/90 backdrop-blur-sm z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-xl flex items-center justify-center text-white font-bold text-sm">EP</div>
            <span className="font-bold text-gray-900 text-lg">EnrollPack</span>
          </div>
          <div className="flex items-center gap-3">
            <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-800 hidden sm:block">Pricing</a>
            <a href={`mailto:${contactEmail}`} className="btn-secondary text-sm py-2 px-4">Contact Us</a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-50 via-orange-50 to-white pt-20 pb-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <span>🌟</span> Built for Texas daycares
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 leading-tight mb-4">
            Daycare enrollment,<br />
            <span className="text-primary-500">simplified.</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-8">
            Replace paper enrollment packets with a branded online portal. Parents fill out Texas Form 2935 digitally — you review and approve from your dashboard.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a href={`mailto:${contactEmail}?subject=EnrollPack Demo Request`} className="btn-primary text-base px-8 py-3">
              Request a Demo
            </a>
            <a href="#pricing" className="btn-secondary text-base px-8 py-3">
              See Pricing
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-20">
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">Everything you need</h2>
        <p className="text-center text-gray-500 mb-12">One platform to handle your entire enrollment process.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <div key={i} className="p-6 rounded-2xl border border-gray-100 hover:border-primary-200 hover:shadow-sm transition-all">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-gray-50 py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">Simple pricing</h2>
          <p className="text-center text-gray-500 mb-12">No setup fees. Cancel any time.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div key={plan.name} className={`rounded-2xl p-8 ${plan.highlight ? 'bg-primary-500 text-white shadow-lg' : 'bg-white border border-gray-200'}`}>
                <div className={`text-sm font-semibold mb-1 ${plan.highlight ? 'text-primary-100' : 'text-gray-500'}`}>{plan.name}</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className={`text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-gray-900'}`}>{plan.price}</span>
                  <span className={`text-sm mb-1 ${plan.highlight ? 'text-primary-100' : 'text-gray-400'}`}>{plan.period}</span>
                </div>
                <p className={`text-sm mb-6 ${plan.highlight ? 'text-primary-100' : 'text-gray-500'}`}>{plan.desc}</p>
                <ul className="space-y-2 mb-8">
                  {plan.features.map((f, i) => (
                    <li key={i} className={`flex items-center gap-2 text-sm ${plan.highlight ? 'text-white' : 'text-gray-700'}`}>
                      <span className={plan.highlight ? 'text-primary-200' : 'text-primary-500'}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <a
                  href={`mailto:${contactEmail}?subject=EnrollPack ${plan.name} Plan`}
                  className={`block text-center py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors ${
                    plan.highlight
                      ? 'bg-white text-primary-600 hover:bg-primary-50'
                      : 'bg-primary-500 text-white hover:bg-primary-600'
                  }`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-400 mt-6">
            All plans include a free trial period. <a href={`mailto:${contactEmail}`} className="text-primary-500 hover:underline">Contact us</a> to get started.
          </p>
        </div>
      </section>

      {/* Existing customer portal finder */}
      <section className="border-t border-gray-100 py-12 px-4">
        <div className="max-w-xl mx-auto text-center">
          <h3 className="font-semibold text-gray-800 mb-1">Already a customer?</h3>
          <p className="text-sm text-gray-500 mb-4">Enter your daycare's portal name to go directly to your enrollment site.</p>
          <FindPortal />
          <p className="text-xs text-gray-400 mt-2">
            e.g. <span className="font-mono">sunshine</span> → sunshine.enrollpack.com
          </p>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} EnrollPack ·{' '}
        <a href={`mailto:${contactEmail}`} className="hover:text-gray-600">{contactEmail}</a>
      </footer>
    </div>
  );
}
