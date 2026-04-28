import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';
import Navbar from '../../components/Navbar';
import { useOrg } from '../../contexts/OrgContext';
import { DEFAULT_FORM } from './formDefaults';
import Step1 from './Step1_ChildFamily';
import Step2 from './Step2_Consents';
import Step3 from './Step3_HealthNeeds';
import Step4 from './Step4_Emergency';
import Step5 from './Step5_Vaccines';

const STEPS = [
  { title: 'Child & Family', short: '1' },
  { title: 'Consents', short: '2' },
  { title: 'Health & Needs', short: '3' },
  { title: 'Emergency & Compliance', short: '4' },
  { title: 'Immunizations', short: '5' },
];

function deepMerge(defaults, saved) {
  const result = { ...defaults };
  for (const key of Object.keys(defaults)) {
    if (saved?.[key] !== undefined && saved[key] !== null) {
      if (Array.isArray(defaults[key])) {
        result[key] = saved[key];
      } else if (typeof defaults[key] === 'object') {
        result[key] = deepMerge(defaults[key], saved[key]);
      } else {
        result[key] = saved[key];
      }
    }
  }
  return result;
}

export default function EnrollmentForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { org, loading: orgLoading } = useOrg();
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState(DEFAULT_FORM);
  const [enrollmentId, setEnrollmentId] = useState(id || null);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('');
  const [loading, setLoading] = useState(!!id);

  // Auto-populate operation name and director name for NEW enrollments.
  // Wait for orgLoading to finish so we seed with real data, not the defaults
  // that OrgContext holds before the API call completes.
  useEffect(() => {
    if (id || orgLoading) return;
    setFormData(prev => ({
      ...prev,
      general: {
        ...prev.general,
        operationName: prev.general.operationName || org.name           || '',
        directorName:  prev.general.directorName  || org.directors_name || '',
      },
    }));
  }, [orgLoading]); // fires exactly once — when org finishes loading

  // Load existing enrollment if editing
  useEffect(() => {
    if (!id) return;
    api.get(`/enrollments/${id}`)
      .then((res) => {
        if (res.data.status === 'submitted' || res.data.status === 'approved') {
          navigate(`/enrollment/${id}/review`);
          return;
        }
        setFormData(deepMerge(DEFAULT_FORM, res.data.form_data));
        setEnrollmentId(res.data.id);
      })
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleChange = useCallback((section, value) => {
    setFormData((prev) => ({ ...prev, [section]: value }));
    setSaveStatus('unsaved');
  }, []);

  const saveProgress = async (data = formData) => {
    setSaving(true);
    setSaveStatus('saving');
    try {
      if (enrollmentId) {
        await api.put(`/enrollments/${enrollmentId}`, { form_data: data });
      } else {
        const res = await api.post('/enrollments', { form_data: data });
        setEnrollmentId(res.data.id);
        navigate(`/enrollment/${res.data.id}/edit`, { replace: true });
      }
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus(''), 2000);
    } catch {
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    await saveProgress();
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setStep((s) => Math.max(s - 1, 0));
    window.scrollTo(0, 0);
  };

  const handleReview = async () => {
    await saveProgress();
    navigate(`/enrollment/${enrollmentId}/review`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-50">
      <Navbar />

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    i === step ? 'bg-primary-500 text-white' :
                    i < step ? 'bg-primary-100 text-primary-700 cursor-pointer hover:bg-primary-200' :
                    'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                  disabled={i > step}
                >
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${i < step ? 'bg-primary-500 text-white' : i === step ? 'bg-white/30 text-white' : 'bg-gray-300 text-gray-500'}`}>
                    {i < step ? '✓' : i + 1}
                  </span>
                  <span className="hidden sm:block">{s.title}</span>
                </button>
                {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 rounded ${i < step ? 'bg-primary-400' : 'bg-gray-200'}`} style={{minWidth:'8px'}} />}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
              {STEPS[step].title}
            </h1>
            <p className="text-xs sm:text-sm text-gray-400">Step {step + 1} of {STEPS.length} — Texas Form 2935</p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {saveStatus === 'saving' && <span className="text-xs text-gray-400 animate-pulse">Saving…</span>}
            {saveStatus === 'saved' && <span className="text-xs text-green-600">✓ Saved</span>}
            {saveStatus === 'unsaved' && <span className="text-xs text-gray-400">Unsaved</span>}
            {saveStatus === 'error' && <span className="text-xs text-red-500">Save failed</span>}
            <button onClick={() => saveProgress()} disabled={saving} className="btn-secondary text-sm py-1.5 px-3">
              Save Draft
            </button>
          </div>
        </div>

        <div className="card">
          {step === 0 && <Step1 data={formData} onChange={handleChange} />}
          {step === 1 && <Step2 data={formData} onChange={handleChange} />}
          {step === 2 && <Step3 data={formData} onChange={handleChange} />}
          {step === 3 && <Step4 data={formData} onChange={handleChange} />}
          {step === 4 && <Step5 data={formData} onChange={handleChange} />}
        </div>

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 z-30" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <button onClick={handleBack} disabled={step === 0} className="btn-secondary text-sm sm:text-base px-4 sm:px-5">
              ← Back
            </button>
            <div className="flex gap-2">
              {step < STEPS.length - 1 ? (
                <button onClick={handleNext} disabled={saving} className="btn-primary text-sm sm:text-base px-4 sm:px-5">
                  {saving ? 'Saving…' : 'Save & Continue →'}
                </button>
              ) : (
                <button onClick={handleReview} disabled={saving} className="btn-primary text-sm sm:text-base px-4 sm:px-5">
                  {saving ? 'Saving…' : 'Review & Submit →'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
