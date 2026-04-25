import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Section = ({ title, children }) => (
  <div className="mb-8">
    <h2 className="text-lg font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">{title}</h2>
    {children}
  </div>
);

const Step = ({ number, text }) => (
  <div className="flex gap-3 mb-3">
    <div className="w-7 h-7 rounded-full bg-primary-500 text-white text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
      {number}
    </div>
    <p className="text-gray-700 text-sm leading-relaxed">{text}</p>
  </div>
);

export default function Help() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Help &amp; Instructions</h1>
          <p className="text-gray-500 text-sm">Everything you need to know about using the Little Stars Daycare Enrollment App.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">

          <Section title="Getting Started">
            <Step number="1" text="Create an account or log in using your email and password." />
            <Step number="2" text="From your dashboard, click 'Start New Enrollment' to begin filling out the Texas HHSC Form 2935 for your child." />
            <Step number="3" text="Complete all sections across the multi-step form. Your progress is saved automatically as you move between steps." />
            <Step number="4" text="On the final review page, confirm all information is correct, then submit the form." />
          </Section>

          <Section title="Printing or Saving the Form as a PDF">
            <p className="text-gray-700 text-sm leading-relaxed mb-4">
              Once your enrollment form is submitted, you can generate a print-ready copy of the completed Texas HHSC Form 2935.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-blue-800 text-sm font-semibold mb-1">How to Print or Save as PDF</p>
              <ol className="list-decimal list-inside text-blue-700 text-sm space-y-2">
                <li>Open your enrollment from the dashboard and click <strong>View / Print Form</strong>.</li>
                <li>The completed Form 2935 will open in a new tab.</li>
                <li>Click the <strong>"Print / Save as PDF"</strong> button in the toolbar at the top of the page.</li>
                <li>Your browser's print dialog will open. To <strong>print</strong>, select your printer and click Print.</li>
                <li>To <strong>save as a PDF</strong>, choose <strong>"Save as PDF"</strong> (or "Microsoft Print to PDF" on Windows) as the destination, then click Save.</li>
              </ol>
            </div>
            <p className="text-gray-500 text-xs">
              Tip: In the browser print dialog, make sure "Background graphics" is enabled so the form's colored sections and checkboxes print correctly.
            </p>
          </Section>

          <Section title="Frequently Asked Questions">
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">Can I edit my form after submitting?</p>
                <p className="text-sm text-gray-600">You can edit a form as long as it has not been approved by the daycare administrator. Open the enrollment from your dashboard and click Edit.</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">What does my form status mean?</p>
                <p className="text-sm text-gray-600"><strong>Draft</strong> — the form has been started but not yet submitted. <strong>Submitted</strong> — the form is under review by staff. <strong>Approved</strong> — your enrollment has been accepted.</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-1">Who do I contact for help?</p>
                <p className="text-sm text-gray-600">Please contact Little Stars Daycare directly for questions about your child's enrollment status or required documents.</p>
              </div>
            </div>
          </Section>

          <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
            <Link to="/dashboard" className="btn-primary text-sm px-5 py-2">Back to Dashboard</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
