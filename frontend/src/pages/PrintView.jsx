import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../contexts/AuthContext';

/* ─── Style constants matching original PDF measurements ─── */
const FONT   = 'Arial, Helvetica, sans-serif';
const BORDER = '1px solid #000';
const HDR_BG = '#000';    // section headers: BLACK background
const HDR_FG = '#fff';    // section header text: WHITE
const CELL_BG = '#fff';
const PAD    = '0.25in';

/* Cell heights from PDF: data rows = 28.8pt ≈ 0.40in */
const CELL_H = '0.40in';
const SIG_H  = '0.45in';

/* Page style — 8.5in × 11in letter */
const pageStyle = {
  fontFamily: FONT,
  fontSize: '9pt',
  color: '#000',
  background: '#fff',
  width: '8.5in',
  minHeight: '11in',
  padding: PAD,
  boxSizing: 'border-box',
  pageBreakAfter: 'always',
};

/* Shared cell style */
const cell = {
  border: BORDER,
  height: CELL_H,
  padding: '1px 3px',
  position: 'relative',
  verticalAlign: 'top',
  boxSizing: 'border-box',
};

const cellLabel = { fontSize: '7.5pt', color: '#333', display: 'block', lineHeight: '11pt' };
const cellVal   = { fontSize: '9pt',   lineHeight: '13pt', display: 'block' };

/* Full-width table style */
const tbl = {
  width: '100%',
  borderCollapse: 'collapse',
  tableLayout: 'fixed',
  border: BORDER,
};

/* Sub-section heading (grey/light shade, 16.8pt tall from PDF) */
const subHdrStyle = {
  background: '#d7d7d7',
  border: BORDER,
  fontWeight: 'bold',
  fontSize: '8.5pt',
  padding: '2px 4px',
  display: 'block',
  lineHeight: '14pt',
};

/* ────────────────────────────────────────────────
   Sub-components
──────────────────────────────────────────────── */

/** Top-of-page header row: logo (page 1 only) + Form 2935 info */
function PageHdr({ page }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
      {page === 1
        ? <img src="/tx-hhs-logo.png" alt="Texas Health and Human Services" style={{ height: '0.58in', width: 'auto' }} />
        : <div />}
      <div style={{ textAlign: 'right', fontSize: '8pt' }}>
        <div style={{ fontWeight: 'bold' }}>Form 2935</div>
        <div>{page === 1 ? 'October 2023' : `Page ${page} / 04-2023`}</div>
      </div>
    </div>
  );
}

/** Black section header bar with white centered bold text (18pt tall) */
function SHdr({ children }) {
  return (
    <div style={{
      background: HDR_BG,
      color: HDR_FG,
      fontWeight: 'bold',
      fontSize: '10pt',
      textAlign: 'center',
      height: '0.25in',
      lineHeight: '0.25in',
      border: BORDER,
      letterSpacing: '0.02em',
      display: 'block',
      overflow: 'hidden',
    }}>
      {children}
    </div>
  );
}

/** Bordered field cell for use in <td> */
function FC({ label, value, style, children }) {
  return (
    <td style={{ ...cell, ...style }}>
      <span style={cellLabel}>{label}</span>
      {children || <span style={cellVal}>{value || ''}</span>}
    </td>
  );
}

/** 9×9pt checkbox square. top=true aligns to top of text (for multi-line labels). */
function CB({ checked, top }) {
  return (
    <span style={{
      display: 'inline-block',
      width: '9pt',
      height: '9pt',
      border: BORDER,
      background: checked ? '#000' : '#fff',
      verticalAlign: top ? 'top' : 'middle',
      marginRight: '4pt',
      marginTop: top ? '1pt' : 0,
      flexShrink: 0,
    }} />
  );
}

/** 9pt radio circle. top=true aligns to top of text (for multi-line labels). */
function Radio({ checked, top }) {
  return (
    <span style={{
      display: 'inline-block',
      width: '9pt',
      height: '9pt',
      borderRadius: '50%',
      border: BORDER,
      background: checked ? '#000' : '#fff',
      verticalAlign: top ? 'top' : 'middle',
      marginRight: '4pt',
      marginTop: top ? '1pt' : 0,
      flexShrink: 0,
    }} />
  );
}

/** Checkbox + label inline */
function CheckItem({ checked, label }) {
  return (
    <span style={{ display: 'inline-block', marginRight: 10, fontSize: '8.5pt', verticalAlign: 'middle' }}>
      <CB checked={checked} /><span style={{ verticalAlign: 'middle' }}>{label}</span>
    </span>
  );
}

/** Radio circle + label inline */
function RadioItem({ checked, label }) {
  return (
    <span style={{ display: 'inline-block', marginRight: 10, fontSize: '8.5pt', verticalAlign: 'middle' }}>
      <Radio checked={checked} /><span style={{ verticalAlign: 'middle' }}>{label}</span>
    </span>
  );
}

/** Signature line with label and Date Signed */
function SigLine({ label, marginTop, compact }) {
  const h = compact ? '0.32in' : SIG_H;
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: marginTop ?? '4px' }}>
      <tbody>
        <tr>
          <td style={{ width: '66.66%', borderBottom: BORDER, minHeight: h, height: h, paddingBottom: 1, verticalAlign: 'bottom', paddingRight: '12px', boxSizing: 'border-box' }}>
            <span style={{ fontSize: '7pt', color: '#444', lineHeight: '10pt' }}>{label}</span>
          </td>
          <td style={{ width: '33.33%', borderBottom: BORDER, minHeight: h, height: h, paddingBottom: 1, verticalAlign: 'bottom', boxSizing: 'border-box' }}>
            <span style={{ fontSize: '7pt', color: '#444', lineHeight: '10pt' }}>Date Signed</span>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/* ────────────────────────────────────────────────
   Constants
──────────────────────────────────────────────── */
const DAYS    = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'];
const DAY_LBL = { monday:'Monday', tuesday:'Tuesday', wednesday:'Wednesday', thursday:'Thursday', friday:'Friday', saturday:'Saturday', sunday:'Sunday' };

/**
 * VACCINES: exact schedule text from Page 5 of Form 2935
 * Column widths from PDF rects (576pt total):
 *   Vaccine col  x0=18   → x1=202.3  = 184.3pt = 32.0%
 *   Schedule col x0=202.3 → x1=411.6 = 209.3pt = 36.3%
 *   Date col     x0=411.6 → x1=594.2 = 182.6pt = 31.7%
 */
const VACCINES = [
  {
    key: 'hepatitisB',
    name: 'Hepatitis B',
    doses: [
      { k: 'd1', l: 'Birth (first dose)' },
      { k: 'd2', l: '1\u20132 months (second dose)' },
      { k: 'd3', l: '6\u201318 months (third dose)' },
    ],
  },
  {
    key: 'rotavirus',
    name: 'Rotavirus',
    doses: [
      { k: 'd1', l: '2 months (first dose)' },
      { k: 'd2', l: '4 months (second dose)' },
      { k: 'd3', l: '6 months (third dose)' },
    ],
  },
  {
    key: 'dtap',
    name: 'Diphtheria, Tetanus, Pertussis',
    doses: [
      { k: 'd1', l: '2 months (first dose)' },
      { k: 'd2', l: '4 months (second dose)' },
      { k: 'd3', l: '6 months (third dose)' },
      { k: 'd4', l: '15\u201318 months (fourth dose)' },
      { k: 'd5', l: '4\u20136 years (fifth dose)' },
    ],
  },
  {
    key: 'hib',
    name: 'Haemophilus Influenza Type B',
    doses: [
      { k: 'd1', l: '2 months (first dose)' },
      { k: 'd2', l: '4 months (second dose)' },
      { k: 'd3', l: '6 months (third dose)' },
      { k: 'd4', l: '12\u201315 months (fourth dose)' },
    ],
  },
  {
    key: 'pneumococcal',
    name: 'Pneumococcal',
    doses: [
      { k: 'd1', l: '2 months (first dose)' },
      { k: 'd2', l: '4 months (second dose)' },
      { k: 'd3', l: '6 months (third dose)' },
      { k: 'd4', l: '12\u201315 months (fourth dose)' },
    ],
  },
  {
    key: 'ipv',
    name: 'Inactivated Poliovirus',
    doses: [
      { k: 'd1', l: '2 months (first dose)' },
      { k: 'd2', l: '4 months (second dose)' },
      { k: 'd3', l: '6\u201318 months (third dose)' },
      { k: 'd4', l: '4\u20136 years (fourth dose)' },
    ],
  },
  {
    key: 'influenza',
    name: 'Influenza',
    doses: [
      {
        k: 'd1',
        l: 'Yearly, starting at 6 months. Two doses given at least four weeks apart are recommended for children who are getting the vaccine for the first time and for some other children in this age group.',
      },
    ],
  },
  {
    key: 'mmr',
    name: 'Measles, Mumps, Rubella',
    doses: [
      { k: 'd1', l: '12\u201315 months (first dose)' },
      { k: 'd2', l: '4\u20136 years (second dose)' },
    ],
  },
  {
    key: 'varicella',
    name: 'Varicella',
    doses: [
      { k: 'd1', l: '12\u201315 months (first dose)' },
      { k: 'd2', l: '4\u20136 years (second dose)' },
    ],
  },
  {
    key: 'hepatitisA',
    name: 'Hepatitis A',
    doses: [
      { k: 'd1', l: '12\u201323 months (first dose)' },
      { k: 'd2', l: 'The second dose should be given 6 to 18 months after the first dose.' },
    ],
  },
];

/* ────────────────────────────────────────────────
   Main Component
──────────────────────────────────────────────── */
export default function PrintView() {
  const { id }      = useParams();
  const { user }    = useAuth();
  const navigate    = useNavigate();
  const printRef    = useRef();
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    const url = user?.role === 'admin' ? `/admin/enrollments/${id}` : `/enrollments/${id}`;
    api.get(url)
      .then(r => setEnrollment(r.data))
      .catch(() => navigate(user?.role === 'admin' ? '/admin' : '/dashboard'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', fontFamily: FONT }}>
      Loading\u2026
    </div>
  );
  if (!enrollment) return null;

  /* ── Destructure form data ── */
  const f   = enrollment.form_data;
  const g   = f.general              || {};
  const em  = f.emergency            || {};
  const au  = f.authorizedPickup     || [{}, {}, {}];
  const co  = f.consent              || {};
  const tr  = co.transportation      || {};
  const wa  = co.waterActivities     || {};
  const op  = co.operationalPolicies || {};
  const ml  = co.meals               || {};
  const sc  = f.specialCare          || {};
  const sk  = f.school               || {};
  const emd = f.emergencyMedical     || {};
  const ex  = f.exclusion            || {};
  const ad  = f.admission            || {};
  const vc  = f.vaccines             || {};

  /* Shared table header cell style (light grey, matching PDF 0.16 alpha black fill) */
  const th = {
    ...cell,
    background: '#d7d7d7',
    fontWeight: 'bold',
    textAlign: 'left',
    fontSize: '8pt',
  };

  return (
    <>
      {/* ── Print CSS + Toolbar styles ── */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          @page { size: letter; margin: 0; }
          body { margin: 0; }
          .print-page { page-break-after: always; }
          .print-page:last-child { page-break-after: auto; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
        .no-print {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          background: #1f2937; color: white; padding: 8px 16px;
          display: flex; gap: 8px; align-items: center;
          font-family: Arial, sans-serif; font-size: 13px;
        }
        .no-print button {
          background: #f97316; border: none; color: white; padding: 6px 14px;
          border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;
        }
        .no-print button.secondary { background: #374151; }
        .no-print span { color: #9ca3af; margin-left: 8px; }
        body { background: #4b5563; }
        .print-wrapper { padding-top: 52px; }
        .print-page { margin: 12px auto; box-shadow: 0 2px 12px rgba(0,0,0,0.4); }
        @media print {
          .print-wrapper { padding: 0; }
          .print-page { margin: 0; box-shadow: none; }
          body { background: white; }
        }
      `}</style>

      {/* ── Toolbar ── */}
      <div className="no-print">
        <button onClick={handlePrint}>Print / Save as PDF</button>
        <button className="secondary" onClick={() => window.close()}>Close</button>
        <span>Form 2935 &middot; Texas Health and Human Services &middot; {g.childFullName || 'Enrollment Form'}</span>
      </div>

      <div className="print-wrapper">
        <div ref={printRef}>

        {/* ══════════════════════════════════════════════
            PAGE 1
        ══════════════════════════════════════════════ */}
        <div className="print-page" style={pageStyle}>
          <PageHdr page={1} />

          {/* Title */}
          <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '12pt', marginBottom: 2 }}>
            Admission Information
          </div>

          {/* Directions paragraph */}
          <div style={{ fontSize: '9pt', marginBottom: 6, lineHeight: '12pt' }}>
            Use this form to collect all required information about a child enrolling in day care.<br />
            <strong>Directions:</strong> The day care provider gives this form to the child&rsquo;s parent or
            guardian. The parent or guardian completes the form in its entirety and returns it to the day care
            provider before the child&rsquo;s first day of enrollment. The day care provider keeps the form on
            file at the child care facility.
          </div>

          {/* ── GENERAL INFORMATION ── */}
          {/* Black header bar */}
          <SHdr>General Information</SHdr>

          {/* Row 1: Operation's Name (46.875%) | Director's Name (53.125%) */}
          <table style={tbl}>
            <tbody>
              <tr>
                <FC label="Operation's Name:" value={g.operationName} style={{ width: '46.875%' }} />
                <FC label="Director's Name:"  value={g.directorName}  style={{ width: '53.125%' }} />
              </tr>
            </tbody>
          </table>

          {/* Row 2: Child Full Name (46.875%) | DOB (17.1875%) | Child Lives With (35.9375%) */}
          <table style={{ ...tbl, borderTop: 'none' }}>
            <tbody>
              <tr>
                <FC label="Child's Full Name:" value={g.childFullName} style={{ width: '46.875%' }} />
                <FC label="Child's Date of Birth:" value={g.childDOB} style={{ width: '17.1875%' }} />
                <td style={{ ...cell, width: '35.9375%', overflow: 'hidden' }}>
                  <span style={cellLabel}>Child Lives With?</span>
                  <div style={{ marginTop: 2 }}>
                    {['Both parents', 'Mom', 'Dad', 'Guardian'].map(v => (
                      <span key={v} style={{ display: 'inline-block', fontSize: '7.5pt', whiteSpace: 'nowrap', marginRight: '5pt', verticalAlign: 'middle' }}>
                        <Radio checked={g.childLivesWith === v} /><span style={{ verticalAlign: 'middle' }}>{v}</span>
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Row 3: Child Home Address (46.875%) | Date of Admission (26.25%) | Date of Withdrawal (26.875%) */}
          <table style={{ ...tbl, borderTop: 'none' }}>
            <tbody>
              <tr>
                <FC label="Child's Home Address:"  value={g.childHomeAddress}  style={{ width: '46.875%' }} />
                <FC label="Date of Admission:"     value={g.dateOfAdmission}   style={{ width: '26.25%' }} />
                <FC label="Date of Withdrawal:"    value={g.dateOfWithdrawal}  style={{ width: '26.875%' }} />
              </tr>
            </tbody>
          </table>

          {/* Row 4: Parent/Guardian Name (46.875%) | P/G Address (53.125%) */}
          <table style={{ ...tbl, borderTop: 'none' }}>
            <tbody>
              <tr>
                <FC
                  label="Name of Parent or Guardian Completing Form:"
                  value={g.parentGuardianName}
                  style={{ width: '46.875%' }}
                />
                <td style={{ ...cell, width: '53.125%' }}>
                  <span style={cellLabel}>Address of Parent or Guardian <em>(if different from the child&rsquo;s)</em>:</span>
                  <span style={cellVal}>{g.parentGuardianAddress || ''}</span>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Row 5: info text (full width, no bottom border) */}
          <table style={{ ...tbl, borderTop: 'none' }}>
            <tbody>
              <tr>
                <td style={{ ...cell, fontSize: '8pt', color: '#333', borderBottom: 'none', height: 'auto', padding: '2px 3px' }}>
                  List phone numbers below where parents or guardian may be reached while child is in care.
                </td>
              </tr>
            </tbody>
          </table>

          {/* Row 6: Parent 1 (23.958%) | Parent 2 (23.958%) | Guardian (23.959%) | Custody Docs (28.125%) */}
          <table style={{ ...tbl, borderTop: 'none' }}>
            <tbody>
              <tr>
                <FC label="Parent 1 Phone No.:"    value={g.parent1Phone}   style={{ width: '23.958%' }} />
                <FC label="Parent 2 Phone No.:"    value={g.parent2Phone}   style={{ width: '23.958%' }} />
                <FC label="Guardian's Phone No.:"  value={g.guardianPhone}  style={{ width: '23.959%' }} />
                <td style={{ ...cell, width: '28.125%' }}>
                  <span style={cellLabel}>Custody Documents on File?</span>
                  <div style={{ marginTop: 2 }}>
                    <RadioItem checked={g.custodyDocumentsOnFile === 'Yes'} label="Yes" />
                    <RadioItem checked={g.custodyDocumentsOnFile === 'No'}  label="No" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          {/* ── EMERGENCY CONTACT ── */}
          {/* "In case of an emergency, call:" — 16.8pt tall bordered row */}
          <div style={{
            border: BORDER, borderTop: 'none',
            fontSize: '9pt', fontWeight: 'bold',
            padding: '2px 3px',
            lineHeight: '14pt',
          }}>
            In case of an emergency, call:
          </div>

          {/*
            Emergency contact row:
              Name (270pt=46.875%) | Relationship (144pt=25%) | Phone (162pt=28.125%)
            Address row: full width (576pt)
          */}
          <table style={{ ...tbl, borderTop: 'none' }}>
            <tbody>
              <tr>
                <FC label="Name of Emergency Contact:" value={em.contactName}         style={{ width: '46.875%' }} />
                <FC label="Relationship:"              value={em.contactRelationship}  style={{ width: '25%' }} />
                <FC label="Area Code and Phone No.:"   value={em.contactPhone}         style={{ width: '28.125%' }} />
              </tr>
              <tr>
                <FC label="Address:" value={em.contactAddress} colSpan={3} style={{ width: '100%' }} />
              </tr>
            </tbody>
          </table>

          {/* ── AUTHORIZED PICKUP ── */}
          <div style={{
            border: BORDER, borderTop: 'none',
            fontSize: '8.5pt', lineHeight: '13pt',
            padding: '3px 3px',
          }}>
            I authorize the child care operation <strong>to release</strong> my child to leave the child care
            operation <strong>ONLY</strong> with the following persons. Please list name and phone number for
            each. Children will only be released to a parent or guardian or to a person designated by the
            parent or guardian after verification of ID.
          </div>

          {/*
            Authorized pickup rows:
              Name (396pt=68.75%) | Phone (180pt=31.25%)
          */}
          <table style={{ ...tbl, borderTop: 'none' }}>
            <tbody>
              {(au.slice(0, 3)).map((p, i) => (
                <tr key={i}>
                  <FC label="Name:"                  value={p.name}  style={{ width: '68.75%' }} />
                  <FC label="Area Code and Phone No.:" value={p.phone} style={{ width: '31.25%' }} />
                </tr>
              ))}
            </tbody>
          </table>

          {/* ── CONSENT INFORMATION ── */}
          <SHdr>Consent Information</SHdr>

          {/* All consent items live inside one big outer border box */}
          <div style={{ border: BORDER, borderTop: 'none' }}>

            {/* 1. Transportation — grey sub-header */}
            <div style={{ ...subHdrStyle, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
              1. Transportation:
            </div>
            <div style={{ padding: '3px 4px 4px', fontSize: '8.5pt' }}>
              <div style={{ marginBottom: 3 }}>
                I give consent for my child to be transported and supervised by the operation&rsquo;s employees
                (Check all that apply).
              </div>
              <div>
                <CheckItem checked={tr.emergencyCare}  label="for emergency care" />
                <CheckItem checked={tr.fieldTrips}     label="on field trips" />
                <CheckItem checked={tr.toFromHome}     label="to and from home" />
                <CheckItem checked={tr.toFromSchool}   label="to and from school" />
              </div>
            </div>

            {/* 2. Field Trips — grey sub-header */}
            <div style={{ ...subHdrStyle, borderLeft: 'none', borderRight: 'none' }}>
              2. Field Trips:
            </div>
            <div style={{ padding: '3px 4px 4px', fontSize: '8.5pt' }}>
              <div style={{ marginBottom: 3 }}>
                <RadioItem checked={co.fieldTripsConsent === 'yes'} label="I give consent for my child to participate in field trips." />
                <RadioItem checked={co.fieldTripsConsent === 'no'}  label="I do not give consent for my child to participate in field trips." />
              </div>
              <div style={{ fontSize: '8.5pt', marginBottom: 2 }}>Comments:</div>
              <div style={{ border: BORDER, minHeight: '1.56in', padding: 2, fontSize: '9pt' }}>
                {co.fieldTripsComments || ''}
              </div>
            </div>

          </div>{/* end outer consent box */}
        </div>{/* end PAGE 1 */}


        {/* ══════════════════════════════════════════════
            PAGE 2
        ══════════════════════════════════════════════ */}
        <div className="print-page" style={pageStyle}>
          <PageHdr page={2} />

          {/* Big outer border wrapping sections 3–7 on this page */}
          <div style={{ border: BORDER }}>

            {/* 3. Water Activities — grey sub-header */}
            <div style={{ ...subHdrStyle, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
              3. Water Activities:
            </div>
            <div style={{ padding: '3px 4px 4px' }}>
              <div style={{ fontSize: '8.5pt', marginBottom: 3 }}>
                I give consent for my child to participate in the following water activities (Check all that apply).
              </div>
              <div style={{ marginBottom: 5 }}>
                <CheckItem checked={wa.waterTablePlay}     label="water table play" />
                <CheckItem checked={wa.sprinklerPlay}      label="sprinkler play" />
                <CheckItem checked={wa.splashingWading}    label="splashing or wading pools" />
                <CheckItem checked={wa.swimmingPools}      label="swimming pools" />
                <CheckItem checked={wa.aquaticPlaygrounds} label="aquatic playgrounds" />
              </div>
              {/*
                Water risk/swim questions — 2-row, 50/50 layout matching PDF:
                  Row 1: [Swim? x=18-306 (50%)] | [Physical risk? x=306-594 (50%)]
                  Row 2: [Life jacket? x=18-306 (50%)] | [empty]
              */}
              <table style={{ ...tbl, fontSize: '8.5pt' }}>
                <tbody>
                  <tr>
                    <td style={{ ...cell, width: '50%', height: '0.60in' }}>
                      <span style={{ fontSize: '8.5pt', display: 'block', lineHeight: '12pt', marginBottom: 3 }}>
                        Is your child able to swim without assistance?
                      </span>
                      <div>
                        <RadioItem checked={wa.canSwim === 'Yes'} label="Yes" />
                        <RadioItem checked={wa.canSwim === 'No'}  label="No" />
                      </div>
                    </td>
                    <td style={{ ...cell, width: '50%', height: '0.60in' }}>
                      <span style={{ fontSize: '8.5pt', display: 'block', lineHeight: '12pt', marginBottom: 3 }}>
                        Does your child have any physical, health, behavioral or other condition that would put them at risk while swimming?
                      </span>
                      <div>
                        <RadioItem checked={wa.hasPhysicalRisk === 'Yes'} label="Yes" />
                        <RadioItem checked={wa.hasPhysicalRisk === 'No'}  label="No" />
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ ...cell, width: '50%', height: '0.60in' }}>
                      <span style={{ fontSize: '8.5pt', display: 'block', lineHeight: '12pt', marginBottom: 3 }}>
                        Do you want your child to wear a life jacket while in or near a swimming pool?
                      </span>
                      <div>
                        <RadioItem checked={wa.wantsLifeJacket === 'Yes'} label="Yes" />
                        <RadioItem checked={wa.wantsLifeJacket === 'No'}  label="No" />
                      </div>
                    </td>
                    <td style={{ ...cell, width: '50%', height: '0.60in' }}></td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 4. Operational Policies — grey sub-header */}
            <div style={{ ...subHdrStyle, borderLeft: 'none', borderRight: 'none' }}>
              4. Receipt of Written Operational Policies:
            </div>
            <div style={{ padding: '3px 4px 4px' }}>
              <div style={{ fontSize: '8.5pt', marginBottom: 3 }}>
                I acknowledge receipt of the facility&rsquo;s operational policies, including those for
                (Check all that apply).
              </div>
              {/*
                2-column checkbox grid matching PDF layout.
                Left col: x0=20.9, right col: x0=290.9 → roughly 50/50 split.
              */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 0, fontSize: '8.5pt' }}>
                {[
                  [op.disciplineGuidance,       'Discipline and guidance'],
                  [op.releaseOfChildren,         'Procedures for release of children'],
                  [op.suspensionExpulsion,       'Suspension and expulsion'],
                  [op.illnessExclusion,          'Illness and exclusion criteria'],
                  [op.emergencyPlans,            'Emergency plans'],
                  [op.dispensingMedications,     'Procedures for dispensing medications'],
                  [op.healthChecks,              'Procedures for conducting health checks'],
                  [op.immunizationRequirements,  'Immunization requirements for children'],
                  [op.safeSleep,                 'Safe sleep'],
                  [op.mealsAndFood,              'Meals and food service practices'],
                  [op.parentConcerns,            'Procedures for parents to discuss concerns with the director'],
                  [op.visitWithoutApproval,      'Procedures to visit the center without securing prior approval'],
                  [op.physicalActivity,          'Promotion of indoor and outdoor physical activity including criteria for extreme weather conditions'],
                  [op.inclusiveServices,         'Procedures for supporting inclusive services'],
                  [op.parentParticipation,       'Procedures for parents to participate in operation activities'],
                  [op.contactCCR,                'Procedures for parents to contact Child Care Regulation (CCR), DFPS, Child Abuse Hotline, and CCR website'],
                ].map(([chk, lbl], i) => (
                  <span key={i} style={{ display: 'block', paddingBottom: 1 }}>
                    <CB checked={!!chk} top /><span style={{ lineHeight: '11pt', verticalAlign: 'top' }}>{lbl}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* 5. Meals — grey sub-header */}
            <div style={{ ...subHdrStyle, borderLeft: 'none', borderRight: 'none' }}>
              5. Meals:
            </div>
            <div style={{ padding: '3px 4px 4px' }}>
              <div style={{ fontSize: '8.5pt', marginBottom: 3 }}>
                I understand that the following meals will be served to my child while in care (Check all that apply):
              </div>
              <div style={{ fontSize: '8.5pt' }}>
                {[
                  [ml.none,          'None'],
                  [ml.breakfast,     'Breakfast'],
                  [ml.morningSnack,  'Morning snack'],
                  [ml.lunch,         'Lunch'],
                  [ml.afternoonSnack,'Afternoon snack'],
                  [ml.supper,        'Supper'],
                  [ml.eveningSnack,  'Evening snack'],
                ].map(([chk, lbl], i) => <CheckItem key={i} checked={chk} label={lbl} />)}
              </div>
            </div>

            {/* 6. Schedule — grey sub-header */}
            <div style={{ ...subHdrStyle, borderLeft: 'none', borderRight: 'none' }}>
              6. Days and Times in Care:
            </div>
            <div style={{ padding: '3px 4px 4px' }}>
              <div style={{ fontSize: '8.5pt', marginBottom: 3 }}>
                My child is normally in care on the following days and times:
              </div>
              {/*
                Schedule table: Day col x0=18→288 (270pt=46.875%) | AM col (90pt each) | PM col (90pt each)
                From PDF: table spans x0=18 to x1=288 (left half only for the day-time portion)
                Headers filled with alpha=0.10 black
              */}
              <table style={{ ...tbl, fontSize: '8pt', width: '50%' }}>
                <thead>
                  <tr>
                    <th style={{ ...th, width: '55%' }}>Day of the Week</th>
                    <th style={th}>A.M.</th>
                    <th style={th}>P.M.</th>
                  </tr>
                </thead>
                <tbody>
                  {DAYS.map(day => (
                    <tr key={day}>
                      <td style={{ ...cell, fontSize: '8pt' }}>{DAY_LBL[day]}</td>
                      <td style={{ ...cell, fontSize: '8pt' }}>{co.schedule?.[day]?.am || ''}</td>
                      <td style={{ ...cell, fontSize: '8pt' }}>{co.schedule?.[day]?.pm || ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 7. Parent's Rights — grey sub-header */}
            <div style={{ ...subHdrStyle, borderLeft: 'none', borderRight: 'none' }}>
              7. Receipt of Parent&rsquo;s Rights:
            </div>
            <div style={{ padding: '3px 4px 6px' }}>
              <div style={{ fontSize: '8.5pt' }}>
                <CB checked={co.parentsRightsReceived} top /><span style={{ lineHeight: '11pt', verticalAlign: 'top' }}>I acknowledge I have received a written copy of my rights as a parent or guardian of a child
                enrolled at this facility.</span>
              </div>
              <SigLine label="Signature \u2014 Parent or Legal Guardian" />
            </div>

          </div>{/* end outer border */}
        </div>{/* end PAGE 2 */}


        {/* ══════════════════════════════════════════════
            PAGE 3
        ══════════════════════════════════════════════ */}
        <div className="print-page" style={pageStyle}>
          <PageHdr page={3} />

          {/* ── 8. Special Care Needs ── */}
          {/* Grey header bar (alpha=0.16) */}
          <div style={{ border: BORDER }}>
            <div style={{ ...subHdrStyle, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
              8. Child&rsquo;s Special Care Needs (check all that apply)
            </div>
            <div style={{ padding: '3px 4px 4px' }}>
              {/*
                2-column checkbox grid.
                Left col x0=20.9 (offset ~3pt) | right col x0=308.9 (~50% split).
              */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 0, fontSize: '8.5pt', marginBottom: 4 }}>
                {[
                  [sc.environmentalAllergies,   'Environmental allergies'],
                  [sc.activityLimitations,       "Limitations or restrictions on child's activities"],
                  [sc.foodIntolerances,          'Food intolerances'],
                  [sc.reasonableAccommodations,  'Reasonable accommodations or modifications'],
                  [sc.existingIllness,           'Existing illness'],
                  [sc.adaptiveEquipment,         'Adaptive equipment (include instructions below)'],
                  [sc.previousSeriousIllness,    'Previous serious illness'],
                  [sc.symptoms,                  'Symptoms or indications of complications'],
                  [sc.injuriesHospitalizations,  'Injuries and hospitalizations (past 12 months)'],
                  [sc.longTermMedications,       'Medications prescribed for continuous long-term use'],
                ].map(([chk, lbl], i) => (
                  <span key={i} style={{ display: 'block', paddingBottom: 1 }}>
                    <CB checked={!!chk} top /><span style={{ lineHeight: '11pt', verticalAlign: 'top' }}>{lbl}</span>
                  </span>
                ))}
                {/* "Other" spans full width */}
                <span style={{ display: 'block', gridColumn: '1 / -1' }}>
                  <CB checked={!!sc.other} top /><span style={{ lineHeight: '11pt', verticalAlign: 'top' }}>Other: {sc.otherDescription || ''}</span>
                </span>
              </div>

              {/* Explain any needs — bordered text box spanning full width, ~58.5pt tall */}
              <div style={{ fontSize: '8.5pt', marginBottom: 2 }}>Explain any needs selected above:</div>
              <div style={{ border: BORDER, minHeight: '0.75in', padding: 2, fontSize: '9pt', marginBottom: 4 }}>
                {sc.explanationOfNeeds || ''}
              </div>

              {/* Food allergies row */}
              <table style={tbl}>
                <tbody>
                  <tr>
                    <td style={{ ...cell, width: '50%' }}>
                      <span style={cellLabel}>Does your child have diagnosed food allergies?</span>
                      <div style={{ marginTop: 2 }}>
                        <RadioItem checked={sc.diagnosedFoodAllergies === 'Yes'} label="Yes" />
                        <RadioItem checked={sc.diagnosedFoodAllergies === 'No'}  label="No" />
                      </div>
                    </td>
                    <FC label="Food Allergy Emergency Plan Submitted Date:" value={sc.foodAllergyEmergencyPlanDate} style={{ width: '50%' }} />
                  </tr>
                </tbody>
              </table>

              {/* ADA notice */}
              <div style={{ fontSize: '7.5pt', color: '#333', marginTop: 4, lineHeight: '11pt' }}>
                Child day care operations are public accommodations under the Americans with Disabilities Act
                (ADA), Title III. To learn more, visit www.ada.gov/resources/child-care-centers/. If you believe
                that such an operation may be practicing discrimination in violation of Title III, you may call
                the ADA Information Line at (800) 514-0301 (voice) or (800) 514-0383 (TTY).
              </div>

              <SigLine label="Signature \u2014 Parent or Legal Guardian" />
            </div>
          </div>

          {/* ── 9. School Age Children ── */}
          <div style={{ border: BORDER, borderTop: 'none' }}>
            <div style={{ ...subHdrStyle, borderTop: 'none', borderLeft: 'none', borderRight: 'none' }}>
              9. School Age Children
            </div>
            <div style={{ padding: '3px 4px 4px' }}>
              {/*
                School row: school name (414pt=71.875%) | phone (162pt=28.125%)
              */}
              <table style={{ ...tbl, marginBottom: 4 }}>
                <tbody>
                  <tr>
                    <FC label="My child attends the following school:" value={sk.schoolName}  style={{ width: '71.875%' }} />
                    <FC label="School Area Code and Phone No.:"       value={sk.schoolPhone} style={{ width: '28.125%' }} />
                  </tr>
                </tbody>
              </table>

              <div style={{ fontSize: '8.5pt', margin: '3px 0 2px' }}>
                My child has permission to (check all that apply):
              </div>
              <div style={{ fontSize: '8.5pt', marginBottom: 4 }}>
                <CheckItem checked={sk.walkPermission}    label="walk to or from school or home" />
                <CheckItem checked={sk.busPermission}     label="ride a bus" />
                <CheckItem checked={sk.siblingPermission} label="be released to the care of his or her sibling under 18 years old" />
              </div>

              <div style={{ fontSize: '8.5pt', marginBottom: 1 }}>
                Authorized pick up or drop off locations other than the child&rsquo;s address:
              </div>
              {/* Large text area — in PDF this box spans from ~top=434 to ~top=574 (≈140pt ≈ 1.94in) */}
              <div style={{ border: BORDER, minHeight: '1.75in', fontSize: '9pt', padding: 2, marginBottom: 3 }}>
                {sk.otherPickupLocations || ''}
              </div>

              <div style={{ fontSize: '7.5pt', fontStyle: 'italic', color: '#444', lineHeight: '11pt' }}>
                Child&rsquo;s required immunizations, vision and hearing screening, and TB screening are current
                and on file at their school.
              </div>
            </div>
          </div>

          {/* ── Authorization for Emergency Medical Attention ── */}
          <div style={{ marginTop: 2 }}>
            <SHdr>Authorization For Emergency Medical Attention</SHdr>
          </div>
          <div style={{ border: BORDER, borderTop: 'none', padding: '4px' }}>
            <div style={{ fontSize: '8.5pt', marginBottom: 3 }}>
              In the event I cannot be reached to arrange for emergency medical care, I authorize the person in
              charge to take my child to:
            </div>

            {/* Physician table: Name (162pt=28.125%) | Address (288pt=50%) | Phone (126pt=21.875%) */}
            <table style={{ ...tbl, fontSize: '8.5pt' }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: '28.125%' }}>Name of Physician</th>
                  <th style={{ ...th, width: '50%' }}>Address</th>
                  <th style={{ ...th, width: '21.875%' }}>Phone No.</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={cell}>{emd.physicianName    || ''}</td>
                  <td style={cell}>{emd.physicianAddress || ''}</td>
                  <td style={cell}>{emd.physicianPhone   || ''}</td>
                </tr>
              </tbody>
            </table>

            {/* Facility table (same col widths) */}
            <table style={{ ...tbl, fontSize: '8.5pt', borderTop: 'none' }}>
              <thead>
                <tr>
                  <th style={{ ...th, width: '28.125%', borderTop: 'none' }}>Name of Emergency Care Facility</th>
                  <th style={{ ...th, width: '50%',     borderTop: 'none' }}>Address</th>
                  <th style={{ ...th, width: '21.875%', borderTop: 'none' }}>Phone No.</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={cell}>{emd.facilityName    || ''}</td>
                  <td style={cell}>{emd.facilityAddress || ''}</td>
                  <td style={cell}>{emd.facilityPhone   || ''}</td>
                </tr>
              </tbody>
            </table>

            <div style={{ fontSize: '8.5pt', marginTop: 2 }}>
              I give consent for the facility to secure any and all necessary emergency medical care for my child.
            </div>
            <SigLine label="Signature \u2014 Parent or Legal Guardian" marginTop="2px" compact />
          </div>
        </div>{/* end PAGE 3 */}


        {/* ══════════════════════════════════════════════
            PAGE 4
        ══════════════════════════════════════════════ */}
        <div className="print-page" style={pageStyle}>
          <PageHdr page={4} />

          {/* Requirements for Exclusion from Compliance */}
          <SHdr>Requirements for Exclusion from Compliance</SHdr>
          <div style={{ border: BORDER, borderTop: 'none', padding: '4px', marginBottom: 0 }}>
            <div style={{ fontSize: '8.5pt' }}>
              <div style={{ marginBottom: 4 }}>
                <Radio checked={!!ex.conscienceAffidavit} top /><span style={{ lineHeight: '12pt', verticalAlign: 'top' }}>I have attached a signed and dated affidavit stating that I decline immunizations for reason of
                conscience, including religious belief, on the form described by Section 161.0041 Health and
                Safety Code submitted no later than the 90th day after the affidavit is notarized.</span>
              </div>
              <div>
                <Radio checked={!!ex.visionHearingAffidavit} top /><span style={{ lineHeight: '12pt', verticalAlign: 'top' }}>I have attached a signed and dated affidavit stating that the vision or hearing screening
                conflicts with the tenets or practices of a church or religious denomination that I am an
                adherent or member of.</span>
              </div>
            </div>
          </div>

          {/* ── Vision Exam Results ── */}
          <div style={{ marginTop: 6 }}>
            <SHdr>Vision Exam Results</SHdr>
            {/* Original layout: Right Eye 20/ ___ Left Eye 20/ ___ ○Pass ○Fail on one line */}
            <div style={{ border: BORDER, borderTop: 'none', padding: '6px 4px 4px' }}>
              <div style={{ fontSize: '8.5pt', marginBottom: 6 }}>
                <span style={{ marginRight: '24pt', display: 'inline-block', verticalAlign: 'middle' }}>
                  Right Eye 20/{' '}
                  <span style={{ display: 'inline-block', borderBottom: BORDER, minWidth: '1.3in', paddingLeft: 2, verticalAlign: 'middle' }}>
                    {ex.visionRight || ''}
                  </span>
                </span>
                <span style={{ marginRight: '24pt', display: 'inline-block', verticalAlign: 'middle' }}>
                  Left Eye 20/{' '}
                  <span style={{ display: 'inline-block', borderBottom: BORDER, minWidth: '1.3in', paddingLeft: 2, verticalAlign: 'middle' }}>
                    {ex.visionLeft || ''}
                  </span>
                </span>
                <RadioItem checked={ex.visionResult === 'Pass'} label="Pass" />
                <RadioItem checked={ex.visionResult === 'Fail'} label="Fail" />
              </div>
              <SigLine label="Signature" />
            </div>
          </div>

          {/* ── Hearing Exam Results ── */}
          <div style={{ marginTop: 6 }}>
            <SHdr>Hearing Exam Results</SHdr>
            {/*
              Hearing table col widths from PDF rects:
                Ear     x0=18   → x1=72   = 54pt  = 9.375%
                1000Hz  x0=72   → x1=216  = 144pt = 25%
                2000Hz  x0=216  → x1=360  = 144pt = 25%
                4000Hz  x0=360  → x1=486  = 126pt = 21.875%
                P/F     x0=486  → x1=594  = 108pt = 18.75%
            */}
            <div style={{ border: BORDER, borderTop: 'none', padding: '4px' }}>
              <table style={{ ...tbl, fontSize: '8pt' }}>
                <thead>
                  <tr>
                    <th style={{ ...th, width: '9.375%'  }}>Ear</th>
                    <th style={{ ...th, width: '25%'     }}>1000 Hz</th>
                    <th style={{ ...th, width: '25%'     }}>2000 Hz</th>
                    <th style={{ ...th, width: '21.875%' }}>4000 Hz</th>
                    <th style={{ ...th, width: '18.75%'  }}>Pass or Fail</th>
                  </tr>
                </thead>
                <tbody>
                  {[['Right', 'Right'], ['Left', 'Left']].map(([side, label]) => (
                    <tr key={side}>
                      <td style={cell}>{label}</td>
                      <td style={cell}>{ex[`hearing${side}1000`] || ''}</td>
                      <td style={cell}>{ex[`hearing${side}2000`] || ''}</td>
                      <td style={cell}>{ex[`hearing${side}4000`] || ''}</td>
                      <td style={{ ...cell }}>
                        <div>
                          <span style={{ display: 'inline-block', fontSize: '8pt', marginRight: '6pt', verticalAlign: 'middle' }}>
                            <Radio checked={ex[`hearing${side}Result`] === 'Pass'} /><span style={{ verticalAlign: 'middle' }}>Pass</span>
                          </span>
                          <span style={{ display: 'inline-block', fontSize: '8pt', verticalAlign: 'middle' }}>
                            <Radio checked={ex[`hearing${side}Result`] === 'Fail'} /><span style={{ verticalAlign: 'middle' }}>Fail</span>
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <SigLine label="Signature" />
            </div>
          </div>

          {/* ── Admission Requirement ── */}
          <div style={{ marginTop: 6 }}>
            <SHdr>Admission Requirement</SHdr>
            <div style={{ border: BORDER, borderTop: 'none', padding: '4px' }}>
              <div style={{ fontSize: '8.5pt', marginBottom: 4, lineHeight: '12pt' }}>
                If your child does not attend pre-kindergarten or school away from the child care operation,
                one of the following must be presented when your child is admitted to the child care operation
                or within one week of admission. <em>(Select <strong>only one</strong> option.)</em>
              </div>
              <div style={{ fontSize: '8.5pt' }}>
                <div style={{ marginBottom: 4 }}>
                  <Radio checked={ad.option === 'attached'} top /><span style={{ lineHeight: '12pt', verticalAlign: 'top' }}><strong>Health Care Professional&rsquo;s Statement:</strong> I have examined the above named
                    child within the past year and find that he or she is able to take part in the day care
                    program.</span>
                </div>
                <div style={{ marginBottom: 4 }}>
                  <Radio checked={ad.option === 'attached'} top /><span style={{ lineHeight: '12pt', verticalAlign: 'top' }}>A signed and dated copy of a health care professional&rsquo;s statement is attached.</span>
                </div>
                <div style={{ marginBottom: 4 }}>
                  <Radio checked={ad.option === 'religious'} top /><span style={{ lineHeight: '12pt', verticalAlign: 'top' }}>Medical diagnosis and treatment conflict with the tenets and practices of a recognized
                  religious organization, which I adhere to or am a member of. I have attached a signed and
                  dated affidavit stating this.</span>
                </div>
                <div>
                  <Radio checked={ad.option === 'within12months'} top /><span style={{ lineHeight: '12pt', verticalAlign: 'top' }}>My child has been examined within the past year by a health care professional and is able to
                  participate in the day care program. Within 12 months of admission, I will obtain a health
                  care professional&rsquo;s signed statement and submit it to the child care operation.</span>
                </div>
              </div>

              {/* Health care professional name/address row */}
              <table style={{ ...tbl, marginTop: 6 }}>
                <tbody>
                  <tr>
                    <FC label="Name of Health Care Professional, if selected:" value={ad.healthCareName}    style={{ width: '50%' }} />
                    <FC label="Address of Health Care Professional, if selected:" value={ad.healthCareAddress} style={{ width: '50%' }} />
                  </tr>
                </tbody>
              </table>

              <SigLine label="Signature \u2014 Health Care Professional" />
              <SigLine label="Signature \u2014 Parent or Legal Guardian" />
            </div>
          </div>
        </div>{/* end PAGE 4 */}


        {/* ══════════════════════════════════════════════
            PAGE 5
        ══════════════════════════════════════════════ */}
        <div className="print-page" style={pageStyle}>
          <PageHdr page={5} />

          {/* Vaccine Information — black header */}
          <SHdr>Vaccine Information</SHdr>

          {/* Intro text row (18pt cell, borderless) */}
          <div style={{ border: BORDER, borderTop: 'none', padding: '4px', fontSize: '8pt' }}>
            The following vaccines require multiple doses over time. Please provide the date your child
            received each dose.
          </div>

          {/*
            Vaccine table col widths (from PDF rects, 576pt total):
              Vaccine col    x0=18   → x1=202.3  = 184.3pt = 32.0%
              Schedule col   x0=202.3 → x1=411.6 = 209.3pt = 36.3%
              Date col       x0=411.6 → x1=594.2 = 182.6pt = 31.7%
            Header row filled alpha=0.10.
          */}
          <table style={{ ...tbl, fontSize: '7.5pt', borderTop: 'none' }}>
            <thead>
              <tr>
                <th style={{ ...th, width: '32.0%', fontSize: '7.5pt', height: '0.28in', textAlign: 'center', verticalAlign: 'middle' }}>Vaccine</th>
                <th style={{ ...th, width: '36.3%', fontSize: '7.5pt', height: '0.28in', textAlign: 'center', verticalAlign: 'middle' }}>Vaccine Schedule</th>
                <th style={{ ...th, width: '31.7%', fontSize: '7.5pt', height: '0.28in', textAlign: 'center', verticalAlign: 'middle' }}>Dates Child Received Vaccine</th>
              </tr>
            </thead>
            <tbody>
              {VACCINES.map(vac =>
                vac.doses.map((dose, i) => (
                  <tr key={`${vac.key}_${dose.k}`}>
                    {i === 0 && (
                      <td
                        style={{ ...cell, height: 'auto', minHeight: '0.32in', padding: '2px 4px', fontWeight: 'bold', verticalAlign: 'middle', fontSize: '7.5pt' }}
                        rowSpan={vac.doses.length}
                      >
                        {vac.name}
                      </td>
                    )}
                    <td style={{ ...cell, height: 'auto', minHeight: '0.32in', padding: '2px 4px', fontSize: '7.5pt', lineHeight: '11pt', textAlign: 'center', verticalAlign: 'middle' }}>{dose.l}</td>
                    <td style={{ ...cell, height: 'auto', minHeight: '0.32in', padding: '2px 4px', fontSize: '7.5pt', verticalAlign: 'middle' }}>{vc[vac.key]?.[dose.k] || ''}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>{/* end PAGE 5 */}


        {/* ══════════════════════════════════════════════
            PAGE 6
        ══════════════════════════════════════════════ */}
        <div className="print-page" style={{ ...pageStyle, pageBreakAfter: 'auto' }}>
          <PageHdr page={6} />

          {/*
            Page 6 structure (from filled rects):
              top=46.9   BLACK header "Varicella (Chickenpox)"
              top=64.9   bordered box (78.5pt tall) — varicella statement + sig
              top=150.6  BLACK header "Additional Information Regarding Immunizations"
              top=168.6  bordered box (28.8pt) — info text
              top=204.6  BLACK header "TB Test (If required)"
              top=222.6  bordered box (28.8pt) — checkboxes + date
              top=258.6  BLACK header "Gang Free Zone"
              top=276.6  bordered box (28.8pt) — notice text
              top=312.6  BLACK header "Privacy Statement"
              top=330.6  bordered box (25.2pt) — privacy text
              top=363.0  BLACK header "Signatures"
              top=381.0  bordered box (82.8pt) — two sig lines
              top=463.8  BLACK header "Physician or Public Health Personnel Verification"
              top=481.8  bordered box (64.8pt) — sig
          */}

          {/* Varicella (Chickenpox) */}
          <SHdr>Varicella (Chickenpox)</SHdr>
          <div style={{ border: BORDER, borderTop: 'none', padding: '4px 6px', marginBottom: 0 }}>
            <div style={{ fontSize: '8.5pt', lineHeight: '13pt', marginBottom: 4 }}>
              Varicella (chickenpox) vaccine is not required if your child has had chickenpox disease. If your
              child has had chickenpox, please complete the statement: My child had varicella disease
              (chickenpox) on or about{' '}
              <span style={{ borderBottom: BORDER, display: 'inline-block', minWidth: '1.2in', paddingLeft: 2 }}>
                {vc.varicellaDate || ''}
              </span>
              {' '}and does not need varicella vaccine.
            </div>
            <SigLine label="Signature" />
          </div>

          {/* Additional Information Regarding Immunizations */}
          <SHdr>Additional Information Regarding Immunizations</SHdr>
          <div style={{ border: BORDER, borderTop: 'none', padding: '4px' }}>
            <div style={{ fontSize: '8.5pt', lineHeight: '12pt' }}>
              For additional information regarding immunizations, visit the Texas Department of State Health
              Services website at www.dshs.texas.gov/immunize/public.shtm.
            </div>
          </div>

          {/* TB Test */}
          <SHdr>TB Test (If required)</SHdr>
          <div style={{ border: BORDER, borderTop: 'none', padding: '4px' }}>
            <div style={{ fontSize: '8.5pt' }}>
              <RadioItem checked={vc.tbResult === 'Positive'} label="Positive" />
              <RadioItem checked={vc.tbResult === 'Negative'} label="Negative" />
              <span style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 16 }}>
                Date:{' '}
                <span style={{ borderBottom: BORDER, display: 'inline-block', minWidth: '1.5in', verticalAlign: 'middle' }}>
                  {vc.tbDate || ''}
                </span>
              </span>
            </div>
          </div>

          {/* Gang Free Zone */}
          <SHdr>Gang Free Zone</SHdr>
          <div style={{ border: BORDER, borderTop: 'none', padding: '4px' }}>
            <div style={{ fontSize: '8.5pt', lineHeight: '12pt' }}>
              Under the Texas Penal Code, any area within 1,000 feet of a child care center is a gang-free
              zone, where criminal offenses related to organized criminal activity are subject to harsher
              penalties.
            </div>
          </div>

          {/* Privacy Statement */}
          <SHdr>Privacy Statement</SHdr>
          <div style={{ border: BORDER, borderTop: 'none', padding: '4px' }}>
            <div style={{ fontSize: '8.5pt' }}>
              HHSC values your privacy. For more information, read our privacy policy online at:{' '}
              https://hhs.texas.gov/policies-practices-privacy#security
            </div>
          </div>

          {/* Signatures */}
          <SHdr>Signatures</SHdr>
          {/* 82.8pt tall box from PDF */}
          <div style={{ border: BORDER, borderTop: 'none', padding: '4px' }}>
            <SigLine label="Child's Parent or Legal Guardian" />
            <SigLine label="Center Designee" />
          </div>

          {/* Physician or Public Health Personnel Verification */}
          <SHdr>Physician or Public Health Personnel Verification</SHdr>
          {/* 64.8pt tall box from PDF */}
          <div style={{ border: BORDER, borderTop: 'none', padding: '4px' }}>
            <div style={{ fontSize: '8.5pt', marginBottom: 3 }}>
              Signature or stamp of a physician or public health personnel verifying immunization information
              above:
            </div>
            <SigLine label="Signature" />
          </div>

          {/* Footer */}
          <div style={{
            position: 'absolute',
            bottom: '0.15in',
            left: PAD,
            right: PAD,
            borderTop: '1px solid #999',
            paddingTop: 3,
            fontSize: '7pt',
            color: '#666',
            textAlign: 'center',
          }}>
            Form 2935 &middot; Texas Health and Human Services Commission &middot; Printed:{' '}
            {new Date().toLocaleDateString()}
            {g.childFullName ? ` \u00B7 Child: ${g.childFullName}` : ''}
          </div>
        </div>{/* end PAGE 6 */}

        </div>{/* end printRef */}
      </div>
    </>
  );
}
