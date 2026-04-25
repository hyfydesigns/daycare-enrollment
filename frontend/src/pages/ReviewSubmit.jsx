import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = { monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday', friday:'Friday', saturday:'Saturday', sunday:'Sunday' };

function Row({ label, value }) {
  if (!value && value !== false) return null;
  return (
    <div className="flex gap-2 py-1 text-sm border-b border-gray-50 last:border-0">
      <span className="text-gray-500 w-28 sm:w-44 flex-shrink-0">{label}</span>
      <span className="text-gray-800 font-medium">{value === true ? 'Yes' : value === false ? 'No' : String(value)}</span>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-primary-700 uppercase tracking-wide mb-3 pb-1 border-b border-primary-100">{title}</h3>
      {children}
    </div>
  );
}

function boolList(obj, labels) {
  return Object.entries(labels).filter(([k]) => obj[k]).map(([,v]) => v).join(', ') || '—';
}

export default function ReviewSubmit() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    api.get(`/enrollments/${id}`)
      .then((r) => setEnrollment(r.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await api.post(`/enrollments/${id}/submit`, { form_data: enrollment.form_data });
      setSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" /></div>;
  if (!enrollment) return null;

  const f = enrollment.form_data;
  const isReadOnly = enrollment.status !== 'draft' && enrollment.status !== 'needs_correction';

  if (submitted || (enrollment.status === 'submitted' && !isReadOnly)) {
    return (
      <div className="min-h-screen bg-warm-50">
        <Navbar />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Enrollment Submitted!</h1>
          <p className="text-gray-500 mb-6">
            Your enrollment form has been submitted to the daycare. Staff will review it and contact you about the next steps.
          </p>
          <div className="card bg-blue-50 border-blue-100 mb-6 text-left">
            <h3 className="font-semibold text-blue-800 mb-2">What happens next?</h3>
            <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
              <li>Daycare staff reviews your submission</li>
              <li>Staff prints the completed form</li>
              <li>You visit the daycare and physically sign the form</li>
              <li>Your enrollment is approved</li>
            </ol>
          </div>
          <Link to="/dashboard" className="btn-primary">← Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Review Enrollment</h1>
              <StatusBadge status={enrollment.status} />
            </div>
            <p className="text-sm text-gray-400">{f.general?.childFullName || 'Child name not entered'}</p>
          </div>
          {!isReadOnly && (
            <Link to={`/enrollment/${id}/edit`} className="btn-secondary text-sm self-start sm:self-auto">
              ✏️ Edit Form
            </Link>
          )}
        </div>

        {enrollment.status === 'needs_correction' && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm font-semibold text-red-700 mb-1">Corrections Requested</p>
            <p className="text-sm text-red-600">{enrollment.admin_notes || 'Please review and correct your form before resubmitting.'}</p>
          </div>
        )}

        <div className="card mb-6">
          <Section title="General Information">
            <Row label="Child's Full Name" value={f.general?.childFullName} />
            <Row label="Date of Birth" value={f.general?.childDOB} />
            <Row label="Child Lives With" value={f.general?.childLivesWith} />
            <Row label="Home Address" value={f.general?.childHomeAddress} />
            <Row label="Date of Admission" value={f.general?.dateOfAdmission} />
            <Row label="Parent/Guardian Name" value={f.general?.parentGuardianName} />
            <Row label="Parent 1 Phone" value={f.general?.parent1Phone} />
            <Row label="Parent 2 Phone" value={f.general?.parent2Phone} />
            <Row label="Custody Docs on File" value={f.general?.custodyDocumentsOnFile} />
          </Section>

          <Section title="Emergency Contact">
            <Row label="Name" value={f.emergency?.contactName} />
            <Row label="Relationship" value={f.emergency?.contactRelationship} />
            <Row label="Phone" value={f.emergency?.contactPhone} />
            <Row label="Address" value={f.emergency?.contactAddress} />
          </Section>

          <Section title="Authorized Pickup Persons">
            {(f.authorizedPickup || []).filter(p => p.name).map((p, i) => (
              <Row key={i} label={`Person ${i + 1}`} value={`${p.name}${p.phone ? ' — ' + p.phone : ''}`} />
            ))}
            {!(f.authorizedPickup || []).some(p => p.name) && <p className="text-sm text-gray-400">None entered</p>}
          </Section>

          <Section title="Consents">
            <Row label="Transportation" value={boolList(f.consent?.transportation || {}, { emergencyCare:'Emergency care', fieldTrips:'Field trips', toFromHome:'To/from home', toFromSchool:'To/from school' })} />
            <Row label="Field Trips" value={f.consent?.fieldTripsConsent === 'yes' ? 'Consented' : f.consent?.fieldTripsConsent === 'no' ? 'Not consented' : undefined} />
            <Row label="Meals" value={boolList(f.consent?.meals || {}, { breakfast:'Breakfast', morningSnack:'Morning Snack', lunch:'Lunch', afternoonSnack:'Afternoon Snack', supper:'Supper', eveningSnack:'Evening Snack' })} />
            <Row label="Parent's Rights Received" value={f.consent?.parentsRightsReceived} />
          </Section>

          <Section title="Schedule">
            {DAYS.filter(d => f.consent?.schedule?.[d]?.am || f.consent?.schedule?.[d]?.pm).map(d => (
              <Row key={d} label={DAY_LABELS[d]} value={`${f.consent.schedule[d].am || '--'}  to  ${f.consent.schedule[d].pm || '--'}`} />
            ))}
          </Section>

          <Section title="Special Care Needs">
            {f.specialCare?.explanationOfNeeds ? (
              <Row label="Explanation" value={f.specialCare.explanationOfNeeds} />
            ) : <p className="text-sm text-gray-400">None noted</p>}
            <Row label="Food Allergies" value={f.specialCare?.diagnosedFoodAllergies} />
          </Section>

          <Section title="Emergency Medical">
            <Row label="Physician" value={f.emergencyMedical?.physicianName} />
            <Row label="Physician Phone" value={f.emergencyMedical?.physicianPhone} />
            <Row label="Emergency Facility" value={f.emergencyMedical?.facilityName} />
            <Row label="Facility Phone" value={f.emergencyMedical?.facilityPhone} />
          </Section>

          <Section title="Admission Requirement">
            <Row label="Option" value={f.admission?.option} />
            <Row label="Health Care Professional" value={f.admission?.healthCareName} />
          </Section>
        </div>

        {/* Signature Notice */}
        <div className="card bg-yellow-50 border-yellow-200 mb-6">
          <div className="flex gap-3">
            <span className="text-xl">✍️</span>
            <div>
              <p className="font-semibold text-yellow-800 text-sm mb-1">Physical Signature Required</p>
              <p className="text-sm text-yellow-700">
                After submitting this form, daycare staff will print it. You'll sign the printed form in person when you visit the daycare.
              </p>
            </div>
          </div>
        </div>

        {!isReadOnly ? (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to={`/enrollment/${id}/edit`} className="btn-secondary flex-1 text-center">
              ← Back to Edit
            </Link>
            <button onClick={handleSubmit} disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Submitting…' : '✅ Submit Enrollment'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <Link to="/dashboard" className="btn-secondary text-center">← Dashboard</Link>
            {(enrollment.status === 'submitted' || enrollment.status === 'printed' || enrollment.status === 'signed' || enrollment.status === 'approved') && (
              <Link to={`/print/${id}`} target="_blank" className="btn-secondary text-center">🖨️ View Print Version</Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
