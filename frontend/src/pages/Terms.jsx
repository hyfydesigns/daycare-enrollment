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

export default function Terms() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-3xl mx-auto px-4 py-10 w-full">

        <div className="mb-8">
          <Link to="/" className="text-sm text-primary-600 hover:underline">← Back</Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-3 mb-1">Terms of Service</h1>
          <p className="text-sm text-gray-400">Effective date: {EFFECTIVE_DATE}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">

          <p className="text-sm text-gray-600 leading-relaxed mb-8">
            These Terms of Service ("Terms") govern your use of the EnrollPack platform ("Service"),
            operated by EnrollPack ("we", "us", or "our"). By accessing or using the Service, you
            agree to be bound by these Terms. If you do not agree, do not use the Service.
          </p>

          <Section title="1. Description of Service">
            <p>
              EnrollPack is a software-as-a-service (SaaS) platform that enables licensed childcare
              operations ("Operators") to collect, manage, and process digital enrollment forms from
              parents and guardians ("Parents"). EnrollPack provides each Operator with a branded
              subdomain portal through which Parents complete Texas HHSC Form 2935 and related documents.
            </p>
          </Section>

          <Section title="2. Accounts and Eligibility">
            <p>
              To use the Service you must be at least 18 years old and capable of entering into a
              legally binding agreement. By creating an account, you represent that all information
              you provide is accurate and complete.
            </p>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials
              and for all activity that occurs under your account. Notify us immediately at{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary-600 hover:underline">{CONTACT_EMAIL}</a>{' '}
              if you suspect unauthorized access.
            </p>
          </Section>

          <Section title="3. Plans and Billing">
            <p><strong className="text-gray-800">Trial plan.</strong> New Operator accounts begin on a free 30-day Trial plan limited to 5 enrollment submissions. No credit card is required. The Trial plan does not include custom branding (logo and brand colors).</p>
            <p><strong className="text-gray-800">Paid plans.</strong> Starter ($19/month) and Pro ($49/month) plans are available by contacting EnrollPack. Paid plans provide unlimited enrollments and additional features as described on the pricing page.</p>
            <p><strong className="text-gray-800">Cancellation.</strong> You may cancel your subscription at any time by contacting us. Upon cancellation your account will remain active through the end of the current billing period.</p>
            <p><strong className="text-gray-800">Refunds.</strong> We do not offer refunds for partial billing periods. If you believe you were charged in error, contact us within 30 days.</p>
          </Section>

          <Section title="4. Operator Responsibilities">
            <p>Operators using EnrollPack agree to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Use the Service only for lawful enrollment and record-keeping purposes</li>
              <li>Maintain required licensing and comply with all applicable Texas childcare regulations, including those set by the Texas Health and Human Services Commission (HHSC)</li>
              <li>Obtain any required parental consents before collecting children's information through the platform</li>
              <li>Keep their account credentials secure and not share access with unauthorized persons</li>
              <li>Not use the Service to collect information for purposes unrelated to childcare enrollment</li>
            </ul>
          </Section>

          <Section title="5. Parent Responsibilities">
            <p>Parents using EnrollPack agree to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Provide accurate and complete information on enrollment forms</li>
              <li>Not submit forms on behalf of another person without their knowledge and consent</li>
              <li>Keep their account credentials secure</li>
            </ul>
          </Section>

          <Section title="6. Data Ownership">
            <p>
              Enrollment data submitted through the platform belongs to the Operator and the
              Parent who submitted it. EnrollPack does not claim ownership of your data.
            </p>
            <p>
              Operators may export all of their organization's data at any time from the platform
              dashboard. Upon account termination, Operators are responsible for exporting any
              data they wish to retain prior to deletion.
            </p>
          </Section>

          <Section title="7. Prohibited Uses">
            <p>You may not use the Service to:</p>
            <ul className="list-disc list-inside space-y-1 pl-2">
              <li>Violate any applicable law or regulation</li>
              <li>Submit false, misleading, or fraudulent enrollment information</li>
              <li>Attempt to gain unauthorized access to other users' accounts or data</li>
              <li>Reverse-engineer, copy, or redistribute any part of the platform</li>
              <li>Interfere with the security or performance of the Service</li>
              <li>Use automated scripts or bots to access the Service without written permission</li>
            </ul>
            <p>We reserve the right to suspend or terminate accounts that violate these restrictions.</p>
          </Section>

          <Section title="8. Intellectual Property">
            <p>
              The EnrollPack name, logo, platform software, and all related intellectual property
              are owned by EnrollPack. Nothing in these Terms grants you any right to use our
              trademarks or proprietary materials without prior written consent.
            </p>
            <p>
              Operators retain ownership of their daycare name, logo, and branding assets uploaded
              to the platform.
            </p>
          </Section>

          <Section title="9. Disclaimers">
            <p>
              The Service is provided <strong className="text-gray-800">"as is"</strong> and{' '}
              <strong className="text-gray-800">"as available"</strong> without warranties of any kind,
              express or implied, including warranties of merchantability, fitness for a particular
              purpose, or non-infringement.
            </p>
            <p>
              EnrollPack does not warrant that the Service will be uninterrupted, error-free, or
              free of viruses or other harmful components. We are not responsible for the accuracy
              or completeness of enrollment information submitted by users.
            </p>
          </Section>

          <Section title="10. Limitation of Liability">
            <p>
              To the maximum extent permitted by law, EnrollPack shall not be liable for any
              indirect, incidental, special, consequential, or punitive damages arising out of
              your use of or inability to use the Service, including but not limited to loss of
              data, loss of revenue, or loss of enrollment records.
            </p>
            <p>
              Our total liability to you for any claims arising under these Terms shall not exceed
              the amount you paid to EnrollPack in the 12 months preceding the claim.
            </p>
          </Section>

          <Section title="11. Termination">
            <p>
              We may suspend or terminate your access to the Service at any time for violation of
              these Terms, non-payment, or for any other reason with reasonable notice. You may
              terminate your account at any time by contacting us.
            </p>
            <p>
              Upon termination, your right to use the Service ceases. Provisions that by their
              nature should survive termination (including data ownership, limitation of liability,
              and governing law) will remain in effect.
            </p>
          </Section>

          <Section title="12. Governing Law">
            <p>
              These Terms are governed by and construed in accordance with the laws of the State
              of Texas, without regard to its conflict of law principles. Any disputes arising
              under these Terms shall be resolved in the state or federal courts located in Texas.
            </p>
          </Section>

          <Section title="13. Changes to These Terms">
            <p>
              We may update these Terms from time to time. We will notify Operators of material
              changes by email or by posting a notice on the platform. Continued use of the
              Service after changes take effect constitutes acceptance of the revised Terms.
            </p>
          </Section>

          <Section title="14. Contact Us">
            <p>If you have questions about these Terms, please contact us at:</p>
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
