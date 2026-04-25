import React from 'react';

export default function Step1({ data, onChange }) {
  const set = (section, key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    onChange(section, { ...data[section], [key]: val });
  };

  const setPickup = (index, key, value) => {
    const updated = data.authorizedPickup.map((p, i) => i === index ? { ...p, [key]: value } : p);
    onChange('authorizedPickup', updated);
  };

  return (
    <div className="space-y-6">
      {/* General Info */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-4">General Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Operation's Name <span className="required-star">*</span></label>
            <input className="form-input" value={data.general.operationName} onChange={set('general','operationName')} placeholder="Little Stars Daycare" />
          </div>
          <div>
            <label className="form-label">Director's Name</label>
            <input className="form-input" value={data.general.directorName} onChange={set('general','directorName')} />
          </div>
          <div>
            <label className="form-label">Child's Full Name <span className="required-star">*</span></label>
            <input className="form-input" value={data.general.childFullName} onChange={set('general','childFullName')} placeholder="First Middle Last" />
          </div>
          <div>
            <label className="form-label">Child's Date of Birth <span className="required-star">*</span></label>
            <input type="date" className="form-input" value={data.general.childDOB} onChange={set('general','childDOB')} />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Child Lives With</label>
            <div className="flex flex-wrap gap-4 mt-1">
              {['Both parents', 'Mom', 'Dad', 'Guardian'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="childLivesWith" value={opt} checked={data.general.childLivesWith === opt}
                    onChange={set('general','childLivesWith')} className="accent-primary-500" />
                  {opt}
                </label>
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Child's Home Address <span className="required-star">*</span></label>
            <input className="form-input" value={data.general.childHomeAddress} onChange={set('general','childHomeAddress')} placeholder="123 Main St, City, TX 12345" />
          </div>
          <div>
            <label className="form-label">Date of Admission</label>
            <input type="date" className="form-input" value={data.general.dateOfAdmission} onChange={set('general','dateOfAdmission')} />
          </div>
          <div>
            <label className="form-label">Date of Withdrawal</label>
            <input type="date" className="form-input" value={data.general.dateOfWithdrawal} onChange={set('general','dateOfWithdrawal')} />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Name of Parent or Guardian Completing Form <span className="required-star">*</span></label>
            <input className="form-input" value={data.general.parentGuardianName} onChange={set('general','parentGuardianName')} />
          </div>
          <div className="sm:col-span-2">
            <label className="form-label">Address of Parent or Guardian <span className="text-gray-400 font-normal">(if different from child's)</span></label>
            <input className="form-input" value={data.general.parentGuardianAddress} onChange={set('general','parentGuardianAddress')} />
          </div>
          <div>
            <label className="form-label">Parent 1 Phone</label>
            <input type="tel" className="form-input" value={data.general.parent1Phone} onChange={set('general','parent1Phone')} placeholder="(555) 000-0000" />
          </div>
          <div>
            <label className="form-label">Parent 2 Phone</label>
            <input type="tel" className="form-input" value={data.general.parent2Phone} onChange={set('general','parent2Phone')} placeholder="(555) 000-0000" />
          </div>
          <div>
            <label className="form-label">Guardian's Phone</label>
            <input type="tel" className="form-input" value={data.general.guardianPhone} onChange={set('general','guardianPhone')} placeholder="(555) 000-0000" />
          </div>
          <div>
            <label className="form-label">Custody Documents on File?</label>
            <div className="flex gap-4 mt-1">
              {['Yes', 'No'].map((opt) => (
                <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="custodyDocs" value={opt} checked={data.general.custodyDocumentsOnFile === opt}
                    onChange={set('general','custodyDocumentsOnFile')} className="accent-primary-500" />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      <div className="form-section">
        <h3 className="text-base font-semibold text-gray-800 mb-4">Emergency Contact</h3>
        <p className="text-sm text-gray-500 mb-3">In case of an emergency, call:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="form-label">Name <span className="required-star">*</span></label>
            <input className="form-input" value={data.emergency.contactName} onChange={(e) => onChange('emergency', { ...data.emergency, contactName: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Relationship</label>
            <input className="form-input" value={data.emergency.contactRelationship} onChange={(e) => onChange('emergency', { ...data.emergency, contactRelationship: e.target.value })} />
          </div>
          <div>
            <label className="form-label">Phone Number</label>
            <input type="tel" className="form-input" value={data.emergency.contactPhone} onChange={(e) => onChange('emergency', { ...data.emergency, contactPhone: e.target.value })} placeholder="(555) 000-0000" />
          </div>
          <div>
            <label className="form-label">Address</label>
            <input className="form-input" value={data.emergency.contactAddress} onChange={(e) => onChange('emergency', { ...data.emergency, contactAddress: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Authorized Pickup */}
      <div className="form-section">
        <h3 className="text-base font-semibold text-gray-800 mb-2">Authorized Pickup Persons</h3>
        <p className="text-sm text-gray-500 mb-4">
          I authorize the child care operation to release my child ONLY to the following persons.
          Children will only be released after verification of ID.
        </p>
        <div className="space-y-3">
          {data.authorizedPickup.map((p, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-orange-50/60 rounded-xl border border-orange-100">
              <div>
                <label className="form-label">Person {i + 1} Name</label>
                <input className="form-input bg-white" value={p.name} onChange={(e) => setPickup(i, 'name', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Phone Number</label>
                <input type="tel" className="form-input bg-white" value={p.phone} onChange={(e) => setPickup(i, 'phone', e.target.value)} placeholder="(555) 000-0000" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
