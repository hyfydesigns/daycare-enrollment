import React from 'react';

const NEEDS = [
  ['environmentalAllergies', 'Environmental allergies'],
  ['activityLimitations', 'Limitations or restrictions on child\'s activities'],
  ['foodIntolerances', 'Food intolerances'],
  ['reasonableAccommodations', 'Reasonable accommodations or modifications'],
  ['existingIllness', 'Existing illness'],
  ['adaptiveEquipment', 'Adaptive equipment (include instructions below)'],
  ['previousSeriousIllness', 'Previous serious illness'],
  ['symptoms', 'Symptoms or indications of complications'],
  ['injuriesHospitalizations', 'Injuries and hospitalizations (past 12 months)'],
  ['longTermMedications', 'Medications prescribed for continuous long-term use'],
];

export default function Step3({ data, onChange }) {
  const sc = data.specialCare;
  const set = (key, val) => onChange('specialCare', { ...sc, [key]: val });

  return (
    <div className="space-y-6">
      {/* Section 8 */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-3">8. Child's Special Care Needs</h3>
        <p className="text-sm text-gray-500 mb-4">Check all that apply:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {NEEDS.map(([k, l]) => (
            <label key={k} className="flex items-start gap-2 text-sm cursor-pointer p-2.5 rounded-xl border border-gray-200 hover:bg-orange-50 hover:border-primary-200 transition-colors">
              <input type="checkbox" className="accent-primary-500 w-4 h-4 mt-0.5 flex-shrink-0" checked={sc[k]} onChange={(e) => set(k, e.target.checked)} />
              <span>{l}</span>
            </label>
          ))}
          <label className="flex items-start gap-2 text-sm cursor-pointer p-2.5 rounded-xl border border-gray-200 hover:bg-orange-50 hover:border-primary-200 transition-colors sm:col-span-2">
            <input type="checkbox" className="accent-primary-500 w-4 h-4 mt-0.5 flex-shrink-0" checked={sc.other} onChange={(e) => set('other', e.target.checked)} />
            <span className="flex-1">
              Other:
              {sc.other && <input className="form-input mt-1" value={sc.otherDescription} onChange={(e) => set('otherDescription', e.target.value)} placeholder="Please describe" />}
            </span>
          </label>
        </div>

        <div className="mt-4">
          <label className="form-label">Explain any needs selected above:</label>
          <textarea className="form-input" rows={4} value={sc.explanationOfNeeds} onChange={(e) => set('explanationOfNeeds', e.target.value)} placeholder="Provide detailed explanation of any checked items above..." />
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-3 bg-orange-50/60 rounded-xl border border-orange-100">
            <p className="text-sm font-medium text-gray-700 mb-2">Does your child have diagnosed food allergies?</p>
            <div className="flex gap-3">
              {['Yes', 'No'].map((v) => (
                <label key={v} className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input type="radio" name="foodAllergies" value={v} className="accent-primary-500" checked={sc.diagnosedFoodAllergies === v} onChange={() => set('diagnosedFoodAllergies', v)} />
                  {v}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">Food Allergy Emergency Plan Submitted Date</label>
            <input type="date" className="form-input" value={sc.foodAllergyEmergencyPlanDate} onChange={(e) => set('foodAllergyEmergencyPlanDate', e.target.value)} />
          </div>
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
          Child day care operations are public accommodations under the Americans with Disabilities Act (ADA), Title III. If you believe that such an operation may be practicing discrimination in violation of Title III, you may call the ADA Information Line at (800) 514-0301 (voice) or (800) 514-0383 (TTY).
        </div>
      </div>

      {/* Section 9: School Age Children */}
      <div className="form-section">
        <h3 className="text-base font-semibold text-gray-800 mb-3">9. School Age Children</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">My child attends the following school:</label>
            <input className="form-input" value={data.school.schoolName} onChange={(e) => onChange('school', { ...data.school, schoolName: e.target.value })} />
          </div>
          <div>
            <label className="form-label">School Phone</label>
            <input type="tel" className="form-input" value={data.school.schoolPhone} onChange={(e) => onChange('school', { ...data.school, schoolPhone: e.target.value })} placeholder="(555) 000-0000" />
          </div>
        </div>

        <div className="mt-3">
          <label className="form-label mb-2 block">My child has permission to:</label>
          <div className="space-y-2">
            {[
              ['walkPermission', 'Walk to or from school or home'],
              ['busPermission', 'Ride a bus'],
              ['siblingPermission', 'Be released to the care of his or her sibling under 18 years old'],
            ].map(([k, l]) => (
              <label key={k} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-orange-50">
                <input type="checkbox" className="accent-primary-500 w-4 h-4" checked={data.school[k]} onChange={(e) => onChange('school', { ...data.school, [k]: e.target.checked })} />
                {l}
              </label>
            ))}
          </div>
        </div>
        <div className="mt-3">
          <label className="form-label">Authorized pick up or drop off locations other than the child's address:</label>
          <textarea className="form-input" rows={2} value={data.school.otherPickupLocations} onChange={(e) => onChange('school', { ...data.school, otherPickupLocations: e.target.value })} />
        </div>
        <p className="text-xs text-gray-500 mt-2 italic">Child's required immunizations, vision and hearing screening, and TB screening are current and on file at their school.</p>
      </div>
    </div>
  );
}
