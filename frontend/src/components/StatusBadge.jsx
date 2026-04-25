import React from 'react';

const CONFIG = {
  draft:            { label: 'Draft',            cls: 'bg-gray-100 text-gray-600' },
  submitted:        { label: 'Submitted',        cls: 'bg-blue-100 text-blue-700' },
  printed:          { label: 'Printed',          cls: 'bg-purple-100 text-purple-700' },
  signed:           { label: 'Signed',           cls: 'bg-teal-100 text-teal-700' },
  approved:         { label: 'Approved',         cls: 'bg-green-100 text-green-700' },
  needs_correction: { label: 'Needs Correction', cls: 'bg-red-100 text-red-700' },
};

export default function StatusBadge({ status }) {
  const cfg = CONFIG[status] || CONFIG.draft;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}
