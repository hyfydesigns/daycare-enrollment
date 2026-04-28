import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';

function Section({ title, icon, children }) {
  return (
    <div className="mb-10">
      <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-200 flex items-center gap-2">
        {icon && <span>{icon}</span>}
        {title}
      </h2>
      {children}
    </div>
  );
}

function Step({ number, title, text }) {
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-7 h-7 rounded-full bg-primary-500 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
        {number}
      </div>
      <div>
        {title && <p className="text-sm font-semibold text-gray-800 mb-0.5">{title}</p>}
        <p className="text-gray-600 text-sm leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

function FAQ({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full text-left px-4 py-3 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-gray-800">{q}</span>
        <span className="text-gray-400 flex-shrink-0">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
          {a}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ label, color }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>
      {label}
    </span>
  );
}

export default function Help() {
  const { user } = useAuth();
  const backPath = user?.role === 'admin' ? '/admin' : user?.role === 'superadmin' ? '/superadmin' : '/dashboard';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Help &amp; Instructions</h1>
          <p className="text-gray-500 text-sm">Everything you need to know about using EnrollPack.</p>
        </div>

        {/* Tab navigation */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">

          {/* ── PARENTS ─────────────────────────────────────────────────────── */}
          <Section title="For Parents" icon="👨‍👩‍👧">

            <Step number="1" title="Create an account"
              text="Click 'Parent Login' on your daycare's page, then 'Create an account'. Enter your name, email, and a password of at least 8 characters." />
            <Step number="2" title="Start a new enrollment"
              text="From your dashboard click '+ New Enrollment'. The form will open with your daycare's name and director already filled in. Complete all steps at your own pace." />
            <Step number="3" title="Save your progress"
              text="Click 'Save for Later' in the bottom bar at any time to save and return to your dashboard. Your form is also auto-saved each time you click 'Save & Continue' between steps." />
            <Step number="4" title="Review and submit"
              text="On the last step click 'Review & Submit'. Check everything looks correct on the review page, then click Submit. You'll receive a confirmation email." />
            <Step number="5" title="Visit the daycare to sign"
              text="After staff reviews and prints your form, visit the daycare in person to physically sign the printed copy. Once signed, staff will mark your enrollment as Approved." />

            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mt-4 mb-6">
              <p className="text-sm font-semibold text-amber-800 mb-2">What do the statuses mean?</p>
              <div className="space-y-2">
                {[
                  { label: 'Draft',            color: 'bg-gray-100 text-gray-600',    desc: 'Started but not yet submitted. Only you can see it.' },
                  { label: 'Submitted',        color: 'bg-blue-100 text-blue-700',    desc: 'Sent to the daycare for review.' },
                  { label: 'Needs Correction', color: 'bg-red-100 text-red-700',      desc: 'Staff found an issue. Edit your form and resubmit.' },
                  { label: 'Printed',          color: 'bg-purple-100 text-purple-700',desc: 'Staff has printed your form. Visit the daycare to sign.' },
                  { label: 'Signed',           color: 'bg-indigo-100 text-indigo-700',desc: 'Physical signature recorded. Awaiting final approval.' },
                  { label: 'Approved',         color: 'bg-green-100 text-green-700',  desc: 'Enrollment complete! Your child is enrolled.' },
                ].map(s => (
                  <div key={s.label} className="flex items-start gap-2">
                    <StatusBadge label={s.label} color={s.color} />
                    <span className="text-xs text-gray-600 mt-0.5">{s.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-2">
              <p className="text-blue-800 text-sm font-semibold mb-2">How to print or save your form as a PDF</p>
              <ol className="list-decimal list-inside text-blue-700 text-sm space-y-1.5">
                <li>Open your submitted enrollment from the dashboard and click <strong>View</strong>.</li>
                <li>Click <strong>"Print / Save as PDF"</strong> in the toolbar.</li>
                <li>To print, select your printer and click Print.</li>
                <li>To save as PDF, choose <strong>"Save as PDF"</strong> as the destination.</li>
              </ol>
              <p className="text-xs text-blue-600 mt-2">Tip: enable "Background graphics" in the print dialog so checkboxes and colored sections print correctly.</p>
            </div>
          </Section>

          {/* ── STAFF / ADMIN ────────────────────────────────────────────────── */}
          <Section title="For Daycare Staff" icon="🏫">

            <Step number="1" title="Log in as staff"
              text="On your daycare's page click 'Staff Login'. Use the admin email and password provided when your account was created. Contact your administrator if you need a password reset." />
            <Step number="2" title="Review new submissions"
              text="New enrollments appear on your dashboard with a 'Submitted' status. Click any row to open the full form and review all fields." />
            <Step number="3" title="Request a correction if needed"
              text="If something is wrong or missing, click 'Request Correction' and add a note explaining what needs to be fixed. The parent will be notified by email and SMS and can resubmit." />
            <Step number="4" title="Print the form"
              text="Once the form is complete, click the Print button on the enrollment detail page to generate the formatted Texas Form 2935. Then click 'Printed' to update the status." />
            <Step number="5" title="Record the in-person signature"
              text="When the parent visits and signs the printed copy, click 'Signed' to record it." />
            <Step number="6" title="Approve the enrollment"
              text="Click 'Approved' to finalize the enrollment. The parent receives a confirmation notification." />

            <div className="bg-gray-50 rounded-xl p-4 mt-2 mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">Enrollment workflow at a glance</p>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {[
                  { label: 'Submitted',  color: 'bg-blue-100 text-blue-700' },
                  { label: '→', color: '' },
                  { label: 'Printed',    color: 'bg-purple-100 text-purple-700' },
                  { label: '→', color: '' },
                  { label: 'Signed',     color: 'bg-indigo-100 text-indigo-700' },
                  { label: '→', color: '' },
                  { label: 'Approved',   color: 'bg-green-100 text-green-700' },
                ].map((s, i) =>
                  s.label === '→'
                    ? <span key={i} className="text-gray-400 font-bold">→</span>
                    : <StatusBadge key={i} label={s.label} color={s.color} />
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                <strong>Request Correction</strong> can be used at any point before approval to send the form back to the parent.
              </p>
            </div>
          </Section>

          {/* ── ORG SETTINGS ─────────────────────────────────────────────────── */}
          <Section title="Organization Settings" icon="⚙️">
            <p className="text-sm text-gray-600 mb-4">
              Admins can customize their daycare's portal from <strong>Admin → Settings</strong>.
            </p>
            <div className="space-y-3">
              {[
                { field: 'Daycare Name',    desc: 'Displayed on the parent portal and auto-filled on new enrollment forms as the Operation Name.' },
                { field: "Director's Name", desc: 'Auto-filled in the Director\'s Name field on all new enrollment forms.' },
                { field: 'Tagline',         desc: 'A short description shown on the parent-facing landing page.' },
                { field: 'Logo',            desc: 'Shown in the header of your portal. Starter and Pro plans only.' },
                { field: 'Brand Colors',    desc: 'Primary and accent colors applied across your portal. Starter and Pro plans only.' },
              ].map(item => (
                <div key={item.field} className="flex gap-3 text-sm">
                  <span className="font-semibold text-gray-700 w-36 shrink-0">{item.field}</span>
                  <span className="text-gray-600">{item.desc}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* ── PLANS ─────────────────────────────────────────────────────────── */}
          <Section title="Plans &amp; Trial" icon="💳">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              {[
                { name: 'Trial',   price: 'Free / 30 days', color: 'border-amber-200 bg-amber-50',  features: ['Up to 5 enrollments', 'Parent portal', 'Admin dashboard', 'No custom branding'] },
                { name: 'Starter', price: '$19 / month',    color: 'border-blue-200 bg-blue-50',    features: ['Unlimited enrollments', 'Custom name & colors', 'Logo upload', 'Email support'] },
                { name: 'Pro',     price: '$49 / month',    color: 'border-green-200 bg-green-50',  features: ['Everything in Starter', 'SMS notifications', 'White-label emails', 'Priority support'] },
              ].map(plan => (
                <div key={plan.name} className={`rounded-xl border p-4 ${plan.color}`}>
                  <p className="font-bold text-gray-800 text-sm mb-0.5">{plan.name}</p>
                  <p className="text-xs text-gray-500 mb-2">{plan.price}</p>
                  <ul className="space-y-1">
                    {plan.features.map(f => (
                      <li key={f} className="text-xs text-gray-700 flex gap-1.5">
                        <span className="text-primary-500 mt-0.5">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              To upgrade from Trial, contact us at{' '}
              <a href="mailto:hello@enrollpack.com" className="text-primary-600 hover:underline">hello@enrollpack.com</a>.
            </p>
          </Section>

          {/* ── FAQ ───────────────────────────────────────────────────────────── */}
          <Section title="Frequently Asked Questions" icon="❓">
            <div className="space-y-2">
              <FAQ
                q="Can I edit my form after submitting?"
                a="You can edit a form if its status is 'Draft' or 'Needs Correction'. Once submitted, contact your daycare staff if you need to make a change — they can send it back to you for correction."
              />
              <FAQ
                q="I didn't receive a verification email."
                a="Check your spam folder first. If it's not there, go back to the login page and click 'Resend verification email'. The link expires after 24 hours."
              />
              <FAQ
                q="I forgot my password."
                a="Click 'Forgot password?' on the login page and enter your email. You'll receive a reset link valid for 1 hour. Check your spam folder if it doesn't arrive."
              />
              <FAQ
                q="Can I delete an enrollment form?"
                a="Yes — you can delete forms that are in Draft or Needs Correction status from your dashboard. Forms that have already been submitted to the daycare cannot be deleted; contact staff to withdraw them."
              />
              <FAQ
                q="Why are Operation Name and Director's Name already filled in?"
                a="These fields are pre-populated from your daycare's settings to save you time. You can still edit them if needed."
              />
              <FAQ
                q="What is the Trial plan limit?"
                a="The free Trial plan allows up to 5 total enrollments and lasts 30 days. Custom branding (logo and colors) is not available on Trial. Ask your daycare administrator to upgrade for unlimited enrollments."
              />
              <FAQ
                q="Who do I contact for help?"
                a="For questions about your child's enrollment status or required documents, contact your daycare directly. For technical issues with the platform, email hello@enrollpack.com."
              />
            </div>
          </Section>

          <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
            <Link to={backPath} className="btn-primary text-sm px-5 py-2">← Back to Dashboard</Link>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
