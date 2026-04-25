import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';

const STATUS_ACTIONS = [
  { value: 'printed',          label: '🖨️ Mark as Printed',           cls: 'bg-purple-100 text-purple-700 hover:bg-purple-200 border-purple-200' },
  { value: 'signed',           label: '✍️ Mark as Signed',            cls: 'bg-teal-100 text-teal-700 hover:bg-teal-200 border-teal-200' },
  { value: 'approved',         label: '✅ Mark as Approved',           cls: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' },
  { value: 'needs_correction', label: '⚠️ Request Corrections',       cls: 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200' },
];

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = { monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday', friday:'Friday', saturday:'Saturday', sunday:'Sunday' };

function fmt(dt) {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function Section({ title, children }) {
  return (
    <div className="mb-5">
      <h3 className="text-xs font-bold text-primary-700 uppercase tracking-widest mb-3 pb-1 border-b border-primary-100">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value }) {
  if (!value && value !== false && value !== 0) return null;
  return (
    <div className="flex gap-2 text-sm py-1 border-b border-gray-50 last:border-0">
      <span className="text-gray-500 w-48 flex-shrink-0 text-xs pt-0.5">{label}</span>
      <span className="text-gray-800">{value === true ? 'Yes' : value === false ? 'No' : String(value)}</span>
    </div>
  );
}

function boolList(obj = {}, labels = {}) {
  return Object.entries(labels).filter(([k]) => obj[k]).map(([,v]) => v).join(', ') || '—';
}

export default function AdminFormReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModal, setStatusModal] = useState(null);
  const [notes, setNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = () => {
    api.get(`/admin/enrollments/${id}`)
      .then((r) => { setEnrollment(r.data); setNotes(r.data.admin_notes || ''); })
      .catch(() => navigate('/admin'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const updateStatus = async (status) => {
    setUpdating(true);
    try {
      await api.patch(`/admin/enrollments/${id}/status`, { status, admin_notes: notes });
      setStatusModal(null);
      load();
    } finally {
      setUpdating(false);
    }
  };

  const reopenForm = async () => {
    if (!window.confirm('Reopen this form for parent editing?')) return;
    setUpdating(true);
    try {
      await api.patch(`/admin/enrollments/${id}/reopen`, { admin_notes: notes });
      load();
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" /></div>;
  if (!enrollment) return null;

  const f = enrollment.form_data;

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div>
            <Link to="/admin" className="text-sm text-gray-400 hover:text-gray-600 mb-2 inline-block">← Dashboard</Link>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{f.general?.childFullName || 'Unnamed Child'}</h1>
              <StatusBadge status={enrollment.status} />
            </div>
            <p className="text-sm text-gray-500">
              Parent: <strong>{enrollment.parent_name}</strong> · {enrollment.parent_email}
              {enrollment.submitted_at && ` · Submitted ${fmt(enrollment.submitted_at)}`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to={`/print/${id}`} target="_blank" className="btn-secondary text-sm">🖨️ Print / PDF</Link>
          </div>
        </div>

        {/* Admin notes */}
        <div className="card mb-6">
          <label className="form-label mb-2">Admin Notes</label>
          <textarea
            className="form-input mb-3"
            rows={3}
            placeholder="Internal notes, correction requests, etc."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            {STATUS_ACTIONS.map((a) => (
              <button key={a.value} onClick={() => setStatusModal(a)}
                className={`text-sm font-medium px-4 py-2 rounded-xl border transition-colors ${a.cls}`}>
                {a.label}
              </button>
            ))}
            {(enrollment.status === 'submitted' || enrollment.status === 'printed' || enrollment.status === 'signed') && (
              <button onClick={reopenForm} disabled={updating}
                className="text-sm font-medium px-4 py-2 rounded-xl border border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                🔓 Reopen for Edits
              </button>
            )}
          </div>
        </div>

        {/* Form Content */}
        <div className="card">
          <Section title="General Information">
            <Field label="Child's Full Name" value={f.general?.childFullName} />
            <Field label="Date of Birth" value={f.general?.childDOB} />
            <Field label="Child Lives With" value={f.general?.childLivesWith} />
            <Field label="Home Address" value={f.general?.childHomeAddress} />
            <Field label="Date of Admission" value={f.general?.dateOfAdmission} />
            <Field label="Date of Withdrawal" value={f.general?.dateOfWithdrawal} />
            <Field label="Operation's Name" value={f.general?.operationName} />
            <Field label="Director's Name" value={f.general?.directorName} />
            <Field label="Parent/Guardian Name" value={f.general?.parentGuardianName} />
            <Field label="Parent/Guardian Address" value={f.general?.parentGuardianAddress} />
            <Field label="Parent 1 Phone" value={f.general?.parent1Phone} />
            <Field label="Parent 2 Phone" value={f.general?.parent2Phone} />
            <Field label="Guardian Phone" value={f.general?.guardianPhone} />
            <Field label="Custody Docs on File" value={f.general?.custodyDocumentsOnFile} />
          </Section>

          <Section title="Emergency Contact">
            <Field label="Name" value={f.emergency?.contactName} />
            <Field label="Relationship" value={f.emergency?.contactRelationship} />
            <Field label="Phone" value={f.emergency?.contactPhone} />
            <Field label="Address" value={f.emergency?.contactAddress} />
          </Section>

          <Section title="Authorized Pickup Persons">
            {(f.authorizedPickup || []).map((p, i) => p.name && (
              <Field key={i} label={`Person ${i+1}`} value={`${p.name}${p.phone ? ' — ' + p.phone : ''}`} />
            ))}
          </Section>

          <Section title="Transportation Consent">
            <Field label="Emergency Care" value={f.consent?.transportation?.emergencyCare} />
            <Field label="Field Trips" value={f.consent?.transportation?.fieldTrips} />
            <Field label="To/From Home" value={f.consent?.transportation?.toFromHome} />
            <Field label="To/From School" value={f.consent?.transportation?.toFromSchool} />
          </Section>

          <Section title="Field Trips">
            <Field label="Consent" value={f.consent?.fieldTripsConsent === 'yes' ? 'Consented' : f.consent?.fieldTripsConsent === 'no' ? 'Not consented' : f.consent?.fieldTripsConsent} />
            <Field label="Comments" value={f.consent?.fieldTripsComments} />
          </Section>

          <Section title="Water Activities">
            <Field label="Activities" value={boolList(f.consent?.waterActivities, { waterTablePlay:'Water table', sprinklerPlay:'Sprinkler', splashingWading:'Wading pools', swimmingPools:'Swimming pools', aquaticPlaygrounds:'Aquatic playgrounds' })} />
            <Field label="Can Swim Unassisted" value={f.consent?.waterActivities?.canSwim} />
            <Field label="Physical Risk for Swimming" value={f.consent?.waterActivities?.hasPhysicalRisk} />
            <Field label="Wants Life Jacket" value={f.consent?.waterActivities?.wantsLifeJacket} />
          </Section>

          <Section title="Operational Policies Received">
            <Field label="Policies acknowledged" value={
              boolList(f.consent?.operationalPolicies, {
                disciplineGuidance:'Discipline', suspensionExpulsion:'Suspension/Expulsion',
                emergencyPlans:'Emergency Plans', healthChecks:'Health Checks', safeSleep:'Safe Sleep',
                parentConcerns:'Parent Concerns', physicalActivity:'Physical Activity',
                parentParticipation:'Parent Participation', releaseOfChildren:'Release of Children',
                illnessExclusion:'Illness/Exclusion', dispensingMedications:'Medications',
                immunizationRequirements:'Immunizations', mealsAndFood:'Meals/Food',
                visitWithoutApproval:'Center Visits', inclusiveServices:'Inclusive Services', contactCCR:'CCR Contact',
              })
            } />
          </Section>

          <Section title="Meals">
            <Field label="Meals served" value={boolList(f.consent?.meals, { breakfast:'Breakfast', morningSnack:'Morning Snack', lunch:'Lunch', afternoonSnack:'Afternoon Snack', supper:'Supper', eveningSnack:'Evening Snack' })} />
          </Section>

          <Section title="Schedule">
            {DAYS.filter(d => f.consent?.schedule?.[d]?.am || f.consent?.schedule?.[d]?.pm).map(d => (
              <Field key={d} label={DAY_LABELS[d]} value={`${f.consent.schedule[d].am || '--'} – ${f.consent.schedule[d].pm || '--'}`} />
            ))}
          </Section>

          <Section title="Special Care Needs">
            <Field label="Needs" value={boolList(f.specialCare, { environmentalAllergies:'Environmental allergies', foodIntolerances:'Food intolerances', existingIllness:'Existing illness', previousSeriousIllness:'Previous illness', injuriesHospitalizations:'Injuries/Hospitalizations', activityLimitations:'Activity limitations', reasonableAccommodations:'Accommodations', adaptiveEquipment:'Adaptive equipment', symptoms:'Symptoms', longTermMedications:'Long-term medications' })} />
            <Field label="Explanation" value={f.specialCare?.explanationOfNeeds} />
            <Field label="Diagnosed Food Allergies" value={f.specialCare?.diagnosedFoodAllergies} />
            <Field label="Food Allergy Plan Date" value={f.specialCare?.foodAllergyEmergencyPlanDate} />
          </Section>

          <Section title="School Age">
            <Field label="School Name" value={f.school?.schoolName} />
            <Field label="School Phone" value={f.school?.schoolPhone} />
            <Field label="Walk Permission" value={f.school?.walkPermission} />
            <Field label="Bus Permission" value={f.school?.busPermission} />
            <Field label="Sibling Permission" value={f.school?.siblingPermission} />
            <Field label="Other Locations" value={f.school?.otherPickupLocations} />
          </Section>

          <Section title="Emergency Medical Authorization">
            <Field label="Physician Name" value={f.emergencyMedical?.physicianName} />
            <Field label="Physician Address" value={f.emergencyMedical?.physicianAddress} />
            <Field label="Physician Phone" value={f.emergencyMedical?.physicianPhone} />
            <Field label="Emergency Facility" value={f.emergencyMedical?.facilityName} />
            <Field label="Facility Address" value={f.emergencyMedical?.facilityAddress} />
            <Field label="Facility Phone" value={f.emergencyMedical?.facilityPhone} />
          </Section>

          <Section title="Compliance & Admission">
            <Field label="Admission Option" value={f.admission?.option} />
            <Field label="Health Care Professional" value={f.admission?.healthCareName} />
            <Field label="Health Care Address" value={f.admission?.healthCareAddress} />
            <Field label="Conscience Affidavit" value={f.exclusion?.conscienceAffidavit} />
            <Field label="Vision/Hearing Affidavit" value={f.exclusion?.visionHearingAffidavit} />
            <Field label="Vision Right Eye" value={f.exclusion?.visionRight ? `20/${f.exclusion.visionRight}` : ''} />
            <Field label="Vision Left Eye" value={f.exclusion?.visionLeft ? `20/${f.exclusion.visionLeft}` : ''} />
            <Field label="Vision Result" value={f.exclusion?.visionResult} />
            <Field label="TB Test Result" value={f.vaccines?.tbResult} />
            <Field label="TB Test Date" value={f.vaccines?.tbDate} />
          </Section>

          <Section title="Immunizations">
            {[
              ['Hepatitis B', f.vaccines?.hepatitisB],
              ['Rotavirus', f.vaccines?.rotavirus],
              ['DTaP', f.vaccines?.dtap],
              ['Hib', f.vaccines?.hib],
              ['Pneumococcal', f.vaccines?.pneumococcal],
              ['IPV', f.vaccines?.ipv],
              ['Influenza', f.vaccines?.influenza],
              ['MMR', f.vaccines?.mmr],
              ['Varicella', f.vaccines?.varicella],
              ['Hepatitis A', f.vaccines?.hepatitisA],
            ].map(([name, doses]) => {
              if (!doses) return null;
              const doseList = Object.entries(doses).filter(([,v]) => v).map(([k,v]) => `${k.replace('d','')}:${v}`).join(' · ');
              return doseList ? <Field key={name} label={name} value={doseList} /> : null;
            })}
            {f.vaccines?.varicellaDisease && <Field label="Varicella (had disease)" value={f.vaccines.varicellaDate || 'Date not specified'} />}
          </Section>
        </div>
      </div>

      {/* Status confirmation modal */}
      {statusModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-bold text-gray-900 mb-2">{statusModal.label}</h3>
            <p className="text-sm text-gray-500 mb-4">
              {statusModal.value === 'needs_correction'
                ? 'The parent will be notified to edit and resubmit. Add a note below to explain what needs to be corrected.'
                : `Confirm changing status to "${statusModal.label}"`
              }
            </p>
            {statusModal.value === 'needs_correction' && (
              <textarea className="form-input mb-4" rows={3} placeholder="Describe what needs to be corrected…" value={notes} onChange={(e) => setNotes(e.target.value)} />
            )}
            <div className="flex gap-2">
              <button onClick={() => setStatusModal(null)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => updateStatus(statusModal.value)} disabled={updating} className="btn-primary flex-1">
                {updating ? 'Updating…' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
