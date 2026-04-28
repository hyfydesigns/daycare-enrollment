import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const CONTACT_EMAIL = 'hello@enrollpack.com';
const EFFECTIVE_DATE = 'January 1, 2025';

function Section({ title, children }) {
  return (
    <div className="mb-8">
      <h2 className="text-base font-bold text-gray-900 mb-3">{title}</h2>
      <div className="space-y-3 text-sm text-gray-600 leading-relaxed">{children}</div>
    </div>
  );
}

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-10 w-full">

        <div className="mb-8">
          <Link to="/" className="text-sm text-primary-600 hover:underline">← Back</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-3 mb-1">Privacy Policy</h1>
          <p className="text-sm text-gray-400">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">

          <p className="text-sm text-gray-600 leading-relaxed mb-8">
            EnrollPack ("we", "us", or "our") operates the EnrollPack platform, which provides
            online daycare enrollment services to licensed childcare operations and the families
            they serve. This Privacy Policy explains how we collect, use, disclose, and protect
            information when you use our platform. By using EnrollPack, you agree to the terms
            of this policy.
          </p>

          <Section title="1. Information We Collect">
            <p><strong className="text-gray-800">Account information.</strong> When a parent registers or a daycare administrator creates an account, we collect name, email address, and password (stored as a secure hash). Parents may also provide a phone number for SMS notifications.</p>
            <p><strong className="text-gray-800">Enrollment form data.</strong> Parents complete Texas HHSC Form 2935 through our platform. This includes the child's name, date of birth, home address, health information, emergency contacts, vaccination records, and authorized pickup persons.</p>
            <p><strong className="text-gray-800">Organization information.</strong> Daycare operators provide their organization name, subdomain, director's name, logo, and brand colors to configure their portal.</p>
            <p><strong className="text-gray-800">Usage data.</strong> We automatically collect basic server logs including IP addresses, browser type, and pages visited for security and operational purposes. We do not use third-party analytics trackers.</p>
          </Section>

          <Section title="2. How We Use Your Information">
            <p>We use the information we collect to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Provide, operate, and maintain the enrollment platform</li>
              <li>Allow daycare staff to review and process enrollment applications</li>
              <li>Send transactional emails and SMS messages related to your enrollment (submission confirmations, status updates, password resets)</li>
              <li>Verify email addresses and authenticate users</li>
              <li>Comply with applicable laws and regulations</li>
            </ul>
            <p>We do <strong className="text-gray-800">not</strong> sell, rent, or share your personal information with third parties for marketing purposes.</p>
          </Section>

          <Section title="3. Children's Privacy (COPPA)">
            <p>
              EnrollPack handles information about children under 13 as part of the daycare enrollment process.
              This information is submitted by a parent or legal guardian and is used solely to process the child's
              enrollment with the daycare operator. We do not use children's information for any other purpose.
            </p>
            <p>
              Parents and guardians have the right to review the personal information submitted on behalf of their
              child, request corrections, and request deletion. To exercise these rights, contact us at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-600 hover:underline">{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          <Section title="4. Data Sharing">
            <p>We share your information only in the following limited circumstances:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li><strong className="text-gray-800">With your daycare.</strong> Enrollment form data you submit is shared with the daycare operator you are enrolling with. Each daycare's data is fully isolated from other daycares on the platform.</li>
              <li><strong className="text-gray-800">Service providers.</strong> We use Resend to deliver transactional emails and Twilio for SMS notifications (Pro plan daycares only). These providers process data solely on our behalf and are bound by confidentiality obligations.</li>
              <li><strong className="text-gray-800">Legal requirements.</strong> We may disclose information if required by law, court order, or to protect the rights and safety of users or the public.</li>
            </ul>
          </Section>

          <Section title="5. Data Security">
            <p>
              We take reasonable technical and organizational measures to protect your information, including:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Passwords are hashed using bcrypt and never stored in plain text</li>
              <li>All data is transmitted over HTTPS/TLS</li>
              <li>Each daycare's data is scoped to their organization and inaccessible to other operators</li>
              <li>Authentication tokens expire and are invalidated on logout</li>
            </ul>
            <p>
              No method of electronic transmission or storage is 100% secure. While we strive to protect your
              information, we cannot guarantee absolute security.
            </p>
          </Section>

          <Section title="6. Data Retention">
            <p>
              We retain enrollment data for as long as your account is active or as needed to provide services.
              Daycare operators may delete their organization and all associated data at any time, which permanently
              removes all user accounts and enrollment records belonging to that organization.
            </p>
            <p>
              Parents may delete their own draft and needs-correction enrollment forms directly from their dashboard.
              To request deletion of your account or submitted enrollment data, contact your daycare administrator
              or reach us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-600 hover:underline">{CONTACT_EMAIL}</a>.
            </p>
          </Section>

          <Section title="7. Cookies">
            <p>
              EnrollPack uses only essential session-related storage (browser localStorage) to keep you logged in.
              We do not use advertising cookies or cross-site tracking cookies.
            </p>
          </Section>

          <Section title="8. Your Rights">
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal information</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
            <p>To exercise any of these rights, contact us at <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-600 hover:underline">{CONTACT_EMAIL}</a>.</p>
          </Section>

          <Section title="9. Changes to This Policy">
            <p>
              We may update this Privacy Policy from time to time. We will notify users of material changes by
              updating the effective date at the top of this page. Continued use of the platform after changes
              are posted constitutes acceptance of the revised policy.
            </p>
          </Section>

          <Section title="10. Contact Us">
            <p>
              If you have questions or concerns about this Privacy Policy, please contact us at:
            </p>
            <div className="bg-gray-50 rounded-xl p-4 text-sm">
              <p className="font-semibold text-gray-800">EnrollPack</p>
              <p>Email: <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-600 hover:underline">{CONTACT_EMAIL}</a></p>
            </div>
          </Section>

        </div>
      </div>
      <Footer />
    </div>
  );
}
