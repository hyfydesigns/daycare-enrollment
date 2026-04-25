/**
 * Email service powered by Resend.
 * All functions are fire-and-forget — they log errors but never throw,
 * so a failed email never breaks the HTTP response.
 */

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || 'EnrollPack <no-reply@enrollpack.com>';

// ─── Helpers ────────────────────────────────────────────────────────────────

function wrap(orgName, primaryColor = '#f97316', body) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${orgName}</title>
</head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:${primaryColor};padding:24px 32px;">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">${orgName}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:32px;">
            ${body}
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 32px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;">
              Powered by <a href="https://enrollpack.com" style="color:${primaryColor};text-decoration:none;">EnrollPack</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(text, url, color = '#f97316') {
  return `<a href="${url}" style="display:inline-block;margin-top:20px;padding:12px 28px;background:${color};color:#ffffff;font-weight:600;font-size:14px;border-radius:10px;text-decoration:none;">${text}</a>`;
}

function p(text) {
  return `<p style="margin:0 0 12px;font-size:15px;color:#374151;line-height:1.6;">${text}</p>`;
}

function h2(text) {
  return `<p style="margin:0 0 20px;font-size:20px;font-weight:700;color:#111827;">${text}</p>`;
}

function statusBadge(status) {
  const map = {
    submitted:        { label: 'Submitted',         bg: '#dbeafe', color: '#1d4ed8' },
    approved:         { label: 'Approved ✓',        bg: '#d1fae5', color: '#065f46' },
    needs_correction: { label: 'Needs Correction',  bg: '#fef3c7', color: '#92400e' },
    printed:          { label: 'Printed',            bg: '#ede9fe', color: '#5b21b6' },
    signed:           { label: 'Signed',             bg: '#ede9fe', color: '#5b21b6' },
  };
  const s = map[status] || { label: status, bg: '#f3f4f6', color: '#374151' };
  return `<span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:13px;font-weight:600;background:${s.bg};color:${s.color};">${s.label}</span>`;
}

async function send({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email to', to);
    return;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) console.error('[email] Resend error:', error);
    else console.log('[email] Sent:', subject, '→', to);
  } catch (err) {
    console.error('[email] Unexpected error:', err.message);
  }
}

// ─── Templates ───────────────────────────────────────────────────────────────

/**
 * Welcome email sent to a parent after they register.
 * @param {object} opts
 * @param {string} opts.to           Parent email
 * @param {string} opts.parentName   Parent full name
 * @param {string} opts.orgName      Daycare name
 * @param {string} opts.orgColor     Primary brand color hex
 * @param {string} opts.dashboardUrl e.g. https://sunshine.enrollpack.com/dashboard
 */
async function sendWelcome({ to, parentName, orgName, orgColor, dashboardUrl }) {
  const firstName = parentName.split(' ')[0];
  const html = wrap(orgName, orgColor, `
    ${h2(`Welcome to ${orgName}! 👋`)}
    ${p(`Hi ${firstName}, your parent account has been created. You can now start an enrollment application for your child.`)}
    ${p('Click the button below to go to your dashboard and begin the process.')}
    ${btn('Go to My Dashboard', dashboardUrl, orgColor)}
  `);
  await send({ to, subject: `Welcome to ${orgName} — start your enrollment`, html });
}

/**
 * Confirmation sent to a parent after they submit an enrollment.
 */
async function sendSubmissionConfirmation({ to, parentName, childName, orgName, orgColor, dashboardUrl }) {
  const firstName = parentName.split(' ')[0];
  const html = wrap(orgName, orgColor, `
    ${h2('Enrollment Submitted ✅')}
    ${p(`Hi ${firstName}, we've received the enrollment application for <strong>${childName || 'your child'}</strong>.`)}
    ${p(`The ${orgName} team will review it and be in touch. You can check the status of your application at any time from your dashboard.`)}
    ${btn('View Application Status', dashboardUrl, orgColor)}
  `);
  await send({ to, subject: `Enrollment received — ${childName || 'your child'} at ${orgName}`, html });
}

/**
 * Notification sent to the daycare admin when a new enrollment is submitted.
 */
async function sendAdminNewEnrollment({ to, childName, parentName, parentEmail, orgName, orgColor, reviewUrl }) {
  const html = wrap(orgName, orgColor, `
    ${h2('New Enrollment Submitted 📋')}
    ${p(`A new enrollment has been submitted and is waiting for your review.`)}
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px 0;font-size:14px;color:#6b7280;width:140px;">Child</td><td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${childName || '—'}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Parent</td><td style="padding:8px 0;font-size:14px;color:#111827;">${parentName}</td></tr>
      <tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Email</td><td style="padding:8px 0;font-size:14px;color:#111827;">${parentEmail}</td></tr>
    </table>
    ${btn('Review Enrollment', reviewUrl, orgColor)}
  `);
  await send({ to, subject: `New enrollment: ${childName || 'unnamed'} — action required`, html });
}

/**
 * Status update email sent to a parent when admin changes enrollment status.
 */
async function sendStatusUpdate({ to, parentName, childName, status, adminNotes, orgName, orgColor, dashboardUrl }) {
  const firstName = parentName.split(' ')[0];

  const messages = {
    approved:         `Great news! The enrollment for <strong>${childName || 'your child'}</strong> has been <strong>approved</strong> by ${orgName}.`,
    needs_correction: `The enrollment for <strong>${childName || 'your child'}</strong> needs some corrections before it can be processed. Please log in to review the notes and resubmit.`,
    printed:          `The enrollment for <strong>${childName || 'your child'}</strong> has been printed and is being processed.`,
    signed:           `The enrollment for <strong>${childName || 'your child'}</strong> has been signed. You're almost done!`,
  };

  const message = messages[status] || `The status of the enrollment for <strong>${childName || 'your child'}</strong> has been updated.`;

  const html = wrap(orgName, orgColor, `
    ${h2('Enrollment Update')}
    ${p(`Hi ${firstName},`)}
    ${p(message)}
    ${adminNotes ? `<div style="margin:16px 0;padding:14px 16px;background:#f9fafb;border-left:3px solid ${orgColor};border-radius:4px;font-size:14px;color:#374151;">${adminNotes}</div>` : ''}
    <p style="margin:12px 0 4px;font-size:13px;color:#6b7280;">Current status</p>
    ${statusBadge(status)}
    ${btn('View My Dashboard', dashboardUrl, orgColor)}
  `);

  const subjects = {
    approved:         `Enrollment approved — ${childName || 'your child'} at ${orgName}`,
    needs_correction: `Action required — enrollment needs correction`,
    printed:          `Enrollment update — ${childName || 'your child'}`,
    signed:           `Enrollment update — ${childName || 'your child'}`,
  };

  await send({ to, subject: subjects[status] || `Enrollment update — ${orgName}`, html });
}

module.exports = { sendWelcome, sendSubmissionConfirmation, sendAdminNewEnrollment, sendStatusUpdate };
