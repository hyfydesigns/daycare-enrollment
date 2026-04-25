import React from 'react';

const VACCINES = [
  { key: 'hepatitisB', name: 'Hepatitis B', doses: [
    { k: 'd1', label: 'Birth (1st dose)' },
    { k: 'd2', label: '1–2 months (2nd dose)' },
    { k: 'd3', label: '6–18 months (3rd dose)' },
  ]},
  { key: 'rotavirus', name: 'Rotavirus', doses: [
    { k: 'd1', label: '2 months (1st dose)' },
    { k: 'd2', label: '4 months (2nd dose)' },
    { k: 'd3', label: '6 months (3rd dose)' },
  ]},
  { key: 'dtap', name: 'Diphtheria, Tetanus, Pertussis (DTaP)', doses: [
    { k: 'd1', label: '2 months (1st dose)' },
    { k: 'd2', label: '4 months (2nd dose)' },
    { k: 'd3', label: '6 months (3rd dose)' },
    { k: 'd4', label: '15–18 months (4th dose)' },
    { k: 'd5', label: '4–6 years (5th dose)' },
  ]},
  { key: 'hib', name: 'Haemophilus Influenza Type B (Hib)', doses: [
    { k: 'd1', label: '2 months (1st dose)' },
    { k: 'd2', label: '4 months (2nd dose)' },
    { k: 'd3', label: '6 months (3rd dose)' },
    { k: 'd4', label: '12–15 months (4th dose)' },
  ]},
  { key: 'pneumococcal', name: 'Pneumococcal', doses: [
    { k: 'd1', label: '2 months (1st dose)' },
    { k: 'd2', label: '4 months (2nd dose)' },
    { k: 'd3', label: '6 months (3rd dose)' },
    { k: 'd4', label: '12–15 months (4th dose)' },
  ]},
  { key: 'ipv', name: 'Inactivated Poliovirus (IPV)', doses: [
    { k: 'd1', label: '2 months (1st dose)' },
    { k: 'd2', label: '4 months (2nd dose)' },
    { k: 'd3', label: '6–18 months (3rd dose)' },
    { k: 'd4', label: '4–6 years (4th dose)' },
  ]},
  { key: 'influenza', name: 'Influenza', doses: [
    { k: 'd1', label: 'Dose 1 (date)' },
    { k: 'd2', label: 'Dose 2 (date)' },
  ]},
  { key: 'mmr', name: 'Measles, Mumps, Rubella (MMR)', doses: [
    { k: 'd1', label: '12–15 months (1st dose)' },
    { k: 'd2', label: '4–6 years (2nd dose)' },
  ]},
  { key: 'varicella', name: 'Varicella (Chickenpox)', doses: [
    { k: 'd1', label: '12–15 months (1st dose)' },
    { k: 'd2', label: '4–6 years (2nd dose)' },
  ]},
  { key: 'hepatitisA', name: 'Hepatitis A', doses: [
    { k: 'd1', label: '12–23 months (1st dose)' },
    { k: 'd2', label: '6–18 months after 1st dose (2nd dose)' },
  ]},
];

export default function Step5({ data, onChange }) {
  const v = data.vaccines;
  const setVaccine = (vaccine, dose, val) => {
    onChange('vaccines', { ...v, [vaccine]: { ...v[vaccine], [dose]: val } });
  };
  const setField = (key, val) => onChange('vaccines', { ...v, [key]: val });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-2">Vaccine Information</h3>
        <p className="text-sm text-gray-500 mb-4">
          The following vaccines require multiple doses over time. Please provide the date your child received each dose.
        </p>

        <div className="space-y-4">
          {VACCINES.map((vaccine) => (
            <div key={vaccine.key} className="p-4 bg-orange-50/40 rounded-xl border border-orange-100">
              <h4 className="text-sm font-semibold text-gray-800 mb-3">{vaccine.name}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {vaccine.doses.map((dose) => (
                  <div key={dose.k}>
                    <label className="form-label text-xs">{dose.label}</label>
                    <input
                      type="date"
                      className="form-input py-2 text-sm bg-white"
                      value={v[vaccine.key]?.[dose.k] || ''}
                      onChange={(e) => setVaccine(vaccine.key, dose.k, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Varicella Disease Exception */}
      <div className="form-section">
        <h3 className="text-base font-semibold text-gray-800 mb-3">Varicella (Chickenpox) Disease History</h3>
        <div className="p-4 bg-orange-50/60 rounded-xl border border-orange-100">
          <p className="text-sm text-gray-600 mb-3">
            Varicella vaccine is <strong>not required</strong> if your child has had chickenpox disease.
          </p>
          <label className="flex items-start gap-2 text-sm cursor-pointer mb-3">
            <input type="checkbox" className="accent-primary-500 w-4 h-4 mt-0.5" checked={v.varicellaDisease} onChange={(e) => setField('varicellaDisease', e.target.checked)} />
            <span>My child had varicella disease (chickenpox) and does not need varicella vaccine.</span>
          </label>
          {v.varicellaDisease && (
            <div>
              <label className="form-label">Date of chickenpox disease (on or about):</label>
              <input type="date" className="form-input bg-white max-w-xs" value={v.varicellaDate} onChange={(e) => setField('varicellaDate', e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* TB Test */}
      <div className="form-section">
        <h3 className="text-base font-semibold text-gray-800 mb-3">TB Test (If Required)</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="form-label">Result</label>
            <div className="flex gap-4 mt-2">
              {['Positive', 'Negative'].map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="tbResult" value={r} className="accent-primary-500" checked={v.tbResult === r} onChange={() => setField('tbResult', r)} />
                  {r}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="form-label">Date</label>
            <input type="date" className="form-input" value={v.tbDate} onChange={(e) => setField('tbDate', e.target.value)} />
          </div>
        </div>
      </div>

      {/* Notices */}
      <div className="form-section">
        <div className="space-y-3">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-xs text-yellow-800">
            <strong>Gang Free Zone:</strong> Under the Texas Penal Code, any area within 1,000 feet of a child care center is a gang-free zone, where criminal offenses related to organized criminal activity are subject to harsher penalties.
          </div>
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
            <strong>Privacy Statement:</strong> HHSC values your privacy. For more information, read our privacy policy online at: https://hhs.texas.gov/policies-practices-privacy#security
          </div>
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600">
            For additional information regarding immunizations, visit the Texas Department of State Health Services website at www.dshs.state.tx.us/immunize/public.shtm
          </div>
        </div>
      </div>
    </div>
  );
}
