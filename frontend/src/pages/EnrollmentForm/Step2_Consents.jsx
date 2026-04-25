import React from 'react';

const DAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LABELS = { monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday', friday:'Friday', saturday:'Saturday', sunday:'Sunday' };

const POLICIES = [
  ['disciplineGuidance', 'Discipline and guidance'],
  ['releaseOfChildren', 'Procedures for release of children'],
  ['suspensionExpulsion', 'Suspension and expulsion'],
  ['illnessExclusion', 'Illness and exclusion criteria'],
  ['emergencyPlans', 'Emergency plans'],
  ['dispensingMedications', 'Procedures for dispensing medications'],
  ['healthChecks', 'Procedures for conducting health checks'],
  ['immunizationRequirements', 'Immunization requirements for children'],
  ['safeSleep', 'Safe sleep'],
  ['mealsAndFood', 'Meals and food service practices'],
  ['parentConcerns', 'Procedures for parents to discuss concerns with the director'],
  ['visitWithoutApproval', 'Procedures to visit the center without securing prior approval'],
  ['physicalActivity', 'Promotion of indoor and outdoor physical activity including criteria for extreme weather conditions'],
  ['inclusiveServices', 'Procedures for supporting inclusive services'],
  ['parentParticipation', 'Procedures for parents to participate in operation activities'],
  ['contactCCR', 'Procedures for parents to contact Child Care Regulation (CCR), DFPS, Child Abuse Hotline, and CCR website'],
];

export default function Step2({ data, onChange }) {
  const consent = data.consent;

  const setConsent = (key, val) => onChange('consent', { ...consent, [key]: val });
  const setTransport = (key) => (e) => setConsent('transportation', { ...consent.transportation, [key]: e.target.checked });
  const setWater = (key, val) => setConsent('waterActivities', { ...consent.waterActivities, [key]: val });
  const setPolicy = (key) => (e) => setConsent('operationalPolicies', { ...consent.operationalPolicies, [key]: e.target.checked });
  const setMeal = (key) => (e) => setConsent('meals', { ...consent.meals, [key]: e.target.checked });
  const setSchedule = (day, period, val) =>
    setConsent('schedule', { ...consent.schedule, [day]: { ...consent.schedule[day], [period]: val } });

  return (
    <div className="space-y-6">
      {/* 1. Transportation */}
      <div>
        <h3 className="text-base font-semibold text-gray-800 mb-1">1. Transportation Consent</h3>
        <p className="text-sm text-gray-500 mb-3">I give consent for my child to be transported and supervised by the operation's employees:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[['emergencyCare','For emergency care'], ['fieldTrips','On field trips'], ['toFromHome','To and from home'], ['toFromSchool','To and from school']].map(([k,l]) => (
            <label key={k} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-orange-50 transition-colors">
              <input type="checkbox" className="accent-primary-500 w-4 h-4" checked={consent.transportation[k]} onChange={setTransport(k)} />
              {l}
            </label>
          ))}
        </div>
      </div>

      {/* 2. Field Trips */}
      <div className="form-section">
        <h3 className="text-base font-semibold text-gray-800 mb-3">2. Field Trips Consent</h3>
        <div className="flex flex-wrap gap-4">
          {[['yes','I give consent for my child to participate in field trips'], ['no','I do NOT give consent for my child to participate in field trips']].map(([v,l]) => (
            <label key={v} className="flex items-start gap-2 text-sm cursor-pointer max-w-sm">
              <input type="radio" name="fieldTrips" value={v} className="accent-primary-500 mt-0.5" checked={consent.fieldTripsConsent === v} onChange={() => setConsent('fieldTripsConsent', v)} />
              {l}
            </label>
          ))}
        </div>
        <div className="mt-3">
          <label className="form-label">Comments</label>
          <textarea className="form-input" rows={2} value={consent.fieldTripsComments} onChange={(e) => setConsent('fieldTripsComments', e.target.value)} />
        </div>
      </div>

      {/* 3. Water Activities */}
      <div className="form-section">
        <h3 className="text-base font-semibold text-gray-800 mb-3">3. Water Activities Consent</h3>
        <p className="text-sm text-gray-500 mb-3">I give consent for my child to participate in the following water activities:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
          {[
            ['waterTablePlay','Water table play'], ['sprinklerPlay','Sprinkler play'],
            ['splashingWading','Splashing or wading pools'], ['swimmingPools','Swimming pools'],
            ['aquaticPlaygrounds','Aquatic playgrounds'],
          ].map(([k,l]) => (
            <label key={k} className="flex items-center gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-orange-50">
              <input type="checkbox" className="accent-primary-500 w-4 h-4" checked={consent.waterActivities[k]} onChange={(e) => setWater(k, e.target.checked)} />
              {l}
            </label>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            ['canSwim','Is your child able to swim without assistance?'],
            ['hasPhysicalRisk','Does your child have any physical/health/behavioral condition that would put them at risk while swimming?'],
            ['wantsLifeJacket','Do you want your child to wear a life jacket while in or near a swimming pool?'],
          ].map(([k,l]) => (
            <div key={k} className="p-3 bg-orange-50/60 rounded-xl border border-orange-100">
              <p className="text-xs text-gray-600 mb-2">{l}</p>
              <div className="flex gap-3">
                {['Yes','No'].map((v) => (
                  <label key={v} className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input type="radio" name={`water_${k}`} value={v} className="accent-primary-500" checked={consent.waterActivities[k] === v} onChange={() => setWater(k, v)} />
                    {v}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Operational Policies */}
      <div className="form-section">
        <h3 className="text-base font-semibold text-gray-800 mb-3">4. Receipt of Written Operational Policies</h3>
        <p className="text-sm text-gray-500 mb-3">I acknowledge receipt of the facility's operational policies, including those for:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
          {POLICIES.map(([k,l]) => (
            <label key={k} className="flex items-start gap-2 text-sm cursor-pointer p-2 rounded-lg hover:bg-orange-50">
              <input type="checkbox" className="accent-primary-500 w-4 h-4 mt-0.5 flex-shrink-0" checked={consent.operationalPolicies[k]} onChange={setPolicy(k)} />
              <span>{l}</span>
            </label>
          ))}
        </div>
      </div>

      {/* 5. Meals */}
      <div className="form-section">
        <h3 className="text-base font-semibold text-gray-800 mb-3">5. Meals</h3>
        <p className="text-sm text-gray-500 mb-3">I understand that the following meals will be served to my child while in care:</p>
        <div className="flex flex-wrap gap-2">
          {[['none','None'], ['breakfast','Breakfast'], ['morningSnack','Morning Snack'], ['lunch','Lunch'], ['afternoonSnack','Afternoon Snack'], ['supper','Supper'], ['eveningSnack','Evening Snack']].map(([k,l]) => (
            <label key={k} className="flex items-center gap-2 text-sm cursor-pointer px-3 py-2 rounded-lg border border-gray-200 hover:bg-orange-50 hover:border-primary-300 transition-colors">
              <input type="checkbox" className="accent-primary-500" checked={consent.meals[k]} onChange={setMeal(k)} />
              {l}
            </label>
          ))}
        </div>
      </div>

      {/* 6. Schedule */}
      <div className="form-section">
        <h3 className="text-base font-semibold text-gray-800 mb-3">6. Days and Times in Care</h3>
        <p className="text-sm text-gray-500 mb-3">My child is normally in care on the following days and times:</p>
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-orange-50">
              <tr>
                <th className="text-left px-3 py-3 font-medium text-gray-700 text-sm">Day</th>
                <th className="px-3 py-3 font-medium text-gray-700 text-sm">Arrival</th>
                <th className="px-3 py-3 font-medium text-gray-700 text-sm">Departure</th>
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day, i) => (
                <tr key={day} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-3 py-2 font-medium text-gray-700 text-sm">{DAY_LABELS[day]}</td>
                  <td className="px-2 py-2">
                    <input type="time" className="form-input py-2 text-sm" value={consent.schedule[day].am} onChange={(e) => setSchedule(day, 'am', e.target.value)} />
                  </td>
                  <td className="px-2 py-2">
                    <input type="time" className="form-input py-2 text-sm" value={consent.schedule[day].pm} onChange={(e) => setSchedule(day, 'pm', e.target.value)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 7. Parents Rights */}
      <div className="form-section">
        <h3 className="text-base font-semibold text-gray-800 mb-3">7. Receipt of Parent's Rights</h3>
        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-gray-200 hover:bg-orange-50 transition-colors">
          <input type="checkbox" className="accent-primary-500 w-4 h-4 mt-0.5" checked={consent.parentsRightsReceived} onChange={(e) => setConsent('parentsRightsReceived', e.target.checked)} />
          <span className="text-sm text-gray-700">I acknowledge I have received a written copy of my rights as a parent or guardian of a child enrolled at this facility.</span>
        </label>
      </div>
    </div>
  );
}
