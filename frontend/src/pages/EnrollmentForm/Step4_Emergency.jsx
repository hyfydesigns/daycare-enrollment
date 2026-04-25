import React from 'react';

export default function Step4({ data, onChange }) {
  const em = data.emergencyMedical;
  const set = (key) => (e) => onChange('emergencyMedical', { ...em, [key]: e.target.value });

  const ex = data.exclusion;
  const setEx = (key, val) => onChange('exclusion', { ...ex, [key]: val });

  const ad = data.admission;
  const setAd = (key, val) => onChange('admission', { ...ad, [key]: val });

  return (
    <div className="space-y-6">
      {/* Authorization for Emergency Medical Attention */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-2">Authorization For Emergency Medical Attention</h3>
        <p className="text-sm text-gray-500 mb-4">
          In the event I cannot be reached to arrange for emergency medical care, I authorize the person in charge to take my child to:
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-orange-50/60 rounded-xl border border-orange-100">
            <p className="text-sm font-medium text-gray-700 mb-3">Physician</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="form-label">Name of Physician</label>
                <input className="form-input bg-white" value={em.physicianName} onChange={set('physicianName')} />
              </div>
              <div>
                <label className="form-label">Address</label>
                <input className="form-input bg-white" value={em.physicianAddress} onChange={set('physicianAddress')} />
              </div>
              <div>
                <label className="form-label">Phone No.</label>
                <input type="tel" className="form-input bg-white" value={em.physicianPhone} onChange={set('physicianPhone')} placeholder="(555) 000-0000" />
              </div>
            </div>
          </div>

          <div className="p-4 bg-orange-50/60 rounded-xl border border-orange-100">
            <p className="text-sm font-medium text-gray-700 mb-3">Emergency Care Facility</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="form-label">Name of Facility</label>
                <input className="form-input bg-white" value={em.facilityName} onChange={set('facilityName')} />
              </div>
              <div>
                <label className="form-label">Address</label>
                <input className="form-input bg-white" value={em.facilityAddress} onChange={set('facilityAddress')} />
              </div>
              <div>
                <label className="form-label">Phone No.</label>
                <input type="tel" className="form-input bg-white" value={em.facilityPhone} onChange={set('facilityPhone')} placeholder="(555) 000-0000" />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
          I give consent for the facility to secure any and all necessary emergency medical care for my child.
        </div>
      </div>

      {/* Exclusion Requirements */}
      <div className="form-section">
        <h3 className="text-base font-semibold text-gray-800 mb-3">Requirements for Exclusion from Compliance</h3>
        <div className="space-y-3">
          <label className="flex items-start gap-2 text-sm cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-orange-50">
            <input type="checkbox" className="accent-primary-500 w-4 h-4 mt-0.5 flex-shrink-0" checked={ex.conscienceAffidavit} onChange={(e) => setEx('conscienceAffidavit', e.target.checked)} />
            <span>I have attached a signed and dated affidavit stating that I decline immunizations for reason of conscience, including religious belief, on the form described by Section 161.0041 Health and Safety Code submitted no later than the 90th day after the affidavit is notarized.</span>
          </label>
          <label className="flex items-start gap-2 text-sm cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-orange-50">
            <input type="checkbox" className="accent-primary-500 w-4 h-4 mt-0.5 flex-shrink-0" checked={ex.visionHearingAffidavit} onChange={(e) => setEx('visionHearingAffidavit', e.target.checked)} />
            <span>I have attached a signed and dated affidavit stating that the vision or hearing screening conflicts with the tenets or practices of a church or religious denomination that I am an adherent or member of.</span>
          </label>
        </div>

        {/* Vision Exam */}
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Vision Exam Results</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="form-label">Right Eye (20/ ___)</label>
              <input className="form-input" placeholder="e.g. 20" value={ex.visionRight} onChange={(e) => setEx('visionRight', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Left Eye (20/ ___)</label>
              <input className="form-input" placeholder="e.g. 20" value={ex.visionLeft} onChange={(e) => setEx('visionLeft', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <label className="form-label">Result</label>
              <div className="flex gap-4 mt-2">
                {['Pass', 'Fail'].map((v) => (
                  <label key={v} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="visionResult" value={v} className="accent-primary-500" checked={ex.visionResult === v} onChange={() => setEx('visionResult', v)} />
                    {v}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Hearing Exam */}
        <div className="mt-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Hearing Exam Results</h4>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="w-full text-sm">
              <thead className="bg-orange-50">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-gray-700">Ear</th>
                  <th className="px-3 py-2 font-medium text-gray-700">1000 Hz</th>
                  <th className="px-3 py-2 font-medium text-gray-700">2000 Hz</th>
                  <th className="px-3 py-2 font-medium text-gray-700">4000 Hz</th>
                  <th className="px-3 py-2 font-medium text-gray-700">Result</th>
                </tr>
              </thead>
              <tbody>
                {[['Right','Right'], ['Left','Left']].map(([side, label]) => (
                  <tr key={side} className="border-t border-gray-100">
                    <td className="px-3 py-2 font-medium">{label}</td>
                    {['1000','2000','4000'].map((hz) => (
                      <td key={hz} className="px-3 py-2">
                        <input className="form-input py-1.5 text-sm w-full" value={ex[`hearing${side}${hz}`]} onChange={(e) => setEx(`hearing${side}${hz}`, e.target.value)} />
                      </td>
                    ))}
                    <td className="px-3 py-2">
                      <div className="flex gap-2">
                        {['Pass','Fail'].map((v) => (
                          <label key={v} className="flex items-center gap-1.5 text-sm cursor-pointer py-1">
                            <input type="radio" name={`hearing${side}Result`} value={v} className="accent-primary-500 w-4 h-4" checked={ex[`hearing${side}Result`] === v} onChange={() => setEx(`hearing${side}Result`, v)} />
                            {v}
                          </label>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Admission Requirement */}
      <div className="form-section">
        <h3 className="text-base font-semibold text-gray-800 mb-3">Admission Requirement</h3>
        <p className="text-sm text-gray-500 mb-3">
          If your child does not attend pre-kindergarten or school away from the child care operation, one of the following must be presented when your child is admitted or within one week of admission:
        </p>
        <div className="space-y-3">
          {[
            ['attached', 'A signed and dated copy of a health care professional\'s statement is attached.'],
            ['religious', 'Medical diagnosis and treatment conflict with the tenets and practices of a recognized religious organization. I have attached a signed and dated affidavit stating this.'],
            ['within12months', 'My child has been examined within the past year by a health care professional and is able to participate in the day care program. Within 12 months of admission, I will obtain a health care professional\'s signed statement and submit it to the child care operation.'],
          ].map(([v, l]) => (
            <label key={v} className="flex items-start gap-2 text-sm cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-orange-50">
              <input type="radio" name="admissionOption" value={v} className="accent-primary-500 mt-0.5 flex-shrink-0" checked={ad.option === v} onChange={() => setAd('option', v)} />
              <span>{l}</span>
            </label>
          ))}
        </div>

        {ad.option && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Name of Health Care Professional</label>
              <input className="form-input" value={ad.healthCareName} onChange={(e) => setAd('healthCareName', e.target.value)} />
            </div>
            <div>
              <label className="form-label">Address of Health Care Professional</label>
              <input className="form-input" value={ad.healthCareAddress} onChange={(e) => setAd('healthCareAddress', e.target.value)} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
