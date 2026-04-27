/**
 * Email service powered by Resend.
 *
 * All public functions accept an `org` object (the full organizations row)
 * so callers just pass `org` from the DB and get the right template tier
 * automatically.
 *
 * Plan tiers:
 *   starter / trial → branded but shows "Powered by EnrollPack"
 *   pro             → white-label: logo, tagline, accent color, no EP branding
 *   inactive        → same as starter (failsafe)
 *
 * All sends are fire-and-forget — errors are logged but never thrown.
 */

'use strict';

const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM   = process.env.EMAIL_FROM || 'EnrollPack <no-reply@enrollpack.com>';

// ─── Plan helpers ────────────────────────────────────────────────────────────

function isPro(org) {
  return org && org.plan === 'pro';
}

// ─── Shared primitives ───────────────────────────────────────────────────────

function p(text, style = '') {
  return `<p style="margin:0 0 14px;font-size:15px;color:#374151;line-height:1.65;${style}">${text}</p>`;
}

function h2(text, color = '#111827') {
  return `<p style="margin:0 0 20px;font-size:21px;font-weight:700;color:${color};line-height:1.3;">${text}</p>`;
}

function divider(color = '#f3f4f6') {
  return `<hr style="border:none;border-top:1px solid ${color};margin:24px 0;" />`;
}

function btn(text, url, bg = '#f97316', fg = '#ffffff') {
  return `<a href="${url}"
    style="display:inline-block;margin-top:22px;padding:13px 30px;background:${bg};color:${fg};font-weight:700;font-size:14px;border-radius:10px;text-decoration:none;letter-spacing:0.01em;"
  >${text}</a>`;
}

function statusBadge(status) {
  const MAP = {
    submitted:        { label: 'Submitted',        bg: '#dbeafe', fg: '#1d4ed8' },
    approved:         { label: 'Approved ✓',       bg: '#d1fae5', fg: '#065f46' },
    needs_correction: { label: 'Needs Correction', bg: '#fef3c7', fg: '#92400e' },
    printed:          { label: 'Printed',           bg: '#ede9fe', fg: '#5b21b6' },
    signed:           { label: 'Signed',            bg: '#ede9fe', fg: '#5b21b6' },
  };
  const s = MAP[status] || { label: status, bg: '#f3f4f6', fg: '#374151' };
  return `<span style="display:inline-block;padding:5px 14px;border-radius:999px;font-size:13px;font-weight:700;background:${s.bg};color:${s.fg};">${s.label}</span>`;
}

// Key/value detail row used in tables
function detailRow(label, value, accentColor = '#f97316') {
  return `
    <tr>
      <td style="padding:10px 14px;font-size:13px;color:#6b7280;white-space:nowrap;width:130px;">${label}</td>
      <td style="padding:10px 14px;font-size:14px;color:#111827;font-weight:600;">${value || '—'}</td>
    </tr>`;
}

// ─── Platform wrapper ────────────────────────────────────────────────────────
// EnrollPack-branded emails sent FROM the platform TO daycare admins.
// Always uses EnrollPack orange — independent of any org's branding.

function wrapPlatform(body) {
  const EP_COLOR = '#f97316';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>EnrollPack</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <!-- Header -->
        <tr>
          <td style="background:${EP_COLOR};padding:24px 36px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;padding-right:10px;">
                  <div style="width:36px;height:36px;background:rgba(255,255,255,0.25);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;">
                    <span style="color:#fff;font-size:16px;font-weight:900;line-height:1;">EP</span>
                  </div>
                </td>
                <td style="vertical-align:middle;">
                  <p style="margin:0;color:#ffffff;font-size:20px;font-weight:800;letter-spacing:-0.3px;">EnrollPack</p>
                  <p style="margin:2px 0 0;color:rgba(255,255,255,0.75);font-size:12px;">Daycare enrollment, simplified.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style="padding:36px;">${body}</td></tr>

        <!-- Footer -->
        <tr>
          <td style="padding:16px 36px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
              <a href="https://enrollpack.com" style="color:${EP_COLOR};text-decoration:none;font-weight:600;">EnrollPack</a>
              &nbsp;·&nbsp;
              <a href="mailto:hello@enrollpack.com" style="color:#9ca3af;text-decoration:none;">hello@enrollpack.com</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Starter wrapper ─────────────────────────────────────────────────────────
// Simple solid-color header + "Powered by EnrollPack" footer

function wrapStarter(org, body) {
  const color = org.primary_color || '#f97316';
  const name  = org.name;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${name}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">

        <!-- Header: solid brand color -->
        <tr>
          <td style="background:${color};padding:28px 36px;">
            <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">${name}</p>
          </td>
        </tr>

        <!-- Body -->
        <tr><td style="padding:36px;">${body}</td></tr>

        <!-- Footer: EnrollPack attribution -->
        <tr>
          <td style="padding:16px 36px 24px;border-top:1px solid #f3f4f6;">
            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
              Sent by ${name} via <a href="https://enrollpack.com" style="color:${color};text-decoration:none;font-weight:600;">EnrollPack</a>
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Pro wrapper ─────────────────────────────────────────────────────────────
// Logo (if set) + org name + tagline, accent color accents, white-label footer

function wrapPro(org, body) {
  const primary = org.primary_color || '#f97316';
  const accent  = org.accent_color  || '#1f2937';
  const name    = org.name;
  const tagline = org.tagline || '';

  // Header block: if logo exists, show logo + name side by side on white bg
  // with a colored top border stripe; otherwise fallback to the initials avatar
  const logoBlock = org.logo_url
    ? `<img src="${org.logo_url}" alt="${name}" style="max-height:48px;max-width:160px;object-fit:contain;display:block;" />`
    : `<div style="width:44px;height:44px;border-radius:12px;background:${primary};display:inline-flex;align-items:center;justify-content:center;">
         <span style="color:#fff;font-size:20px;font-weight:800;line-height:1;">${name.charAt(0).toUpperCase()}</span>
       </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <title>${name}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:580px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.10);">

        <!-- Accent stripe -->
        <tr><td style="background:${primary};height:5px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Header: white background with logo/name/tagline -->
        <tr>
          <td style="background:#ffffff;padding:28px 36px 24px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="vertical-align:middle;padding-right:14px;">${logoBlock}</td>
                <td style="vertical-align:middle;">
                  <p style="margin:0;font-size:18px;font-weight:800;color:${accent};letter-spacing:-0.3px;">${name}</p>
                  ${tagline ? `<p style="margin:3px 0 0;font-size:13px;color:#6b7280;font-style:italic;">${tagline}</p>` : ''}
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Thin divider below header -->
        <tr><td style="background:#f9fafb;height:1px;font-size:0;line-height:0;">&nbsp;</td></tr>

        <!-- Body -->
        <tr><td style="padding:36px;">${body}</td></tr>

        <!-- Footer: white-label — org name only, no EnrollPack mention -->
        <tr>
          <td style="padding:16px 36px 24px;border-top:2px solid ${primary}08;">
            <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">&copy; ${new Date().getFullYear()} ${name} &mdash; All rights reserved.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// Select the correct wrapper based on plan
function wrap(org, body) {
  return isPro(org) ? wrapPro(org, body) : wrapStarter(org, body);
}

// ─── Send helper ─────────────────────────────────────────────────────────────

async function send({ to, subject, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping email to', to);
    return;
  }
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) console.error('[email] Resend error:', error);
    else        console.log('[email] Sent:', subject, '→', to);
  } catch (err) {
    console.error('[email] Unexpected error:', err.message);
  }
}

// ─── Public email functions ───────────────────────────────────────────────────

/**
 * Welcome email after a parent registers.
 *
 * @param {object} opts
 * @param {string} opts.to           Parent email address
 * @param {string} opts.parentName   Parent full name
 * @param {object} opts.org          Full organizations DB row
 * @param {string} opts.dashboardUrl https://<slug>.enrollpack.com/dashboard
 */
async function sendWelcome({ to, parentName, org, dashboardUrl }) {
  const firstName = parentName.split(' ')[0];
  const color     = org.primary_color || '#f97316';
  const pro       = isPro(org);

  const body = pro
    ? `
      ${h2(`Welcome to ${org.name}, ${firstName}! 👋`, org.accent_color || '#111827')}
      ${p("We're excited to have you. Your parent account is ready and you can begin your child's enrollment application right now.")}
      ${p("Our team reviews every application personally. Once submitted, we'll keep you updated every step of the way.")}
      ${divider(color + '22')}
      ${p('Click below to access your dashboard and start a new enrollment.', 'color:#6b7280;font-size:13px;')}
      ${btn('Go to My Dashboard →', dashboardUrl, color)}
    `
    : `
      ${h2(`Welcome to ${org.name}! 👋`)}
      ${p(`Hi ${firstName}, your parent account has been created. You can now start an enrollment application for your child.`)}
      ${p('Click the button below to go to your dashboard and begin the process.')}
      ${btn('Go to My Dashboard', dashboardUrl, color)}
    `;

  const subject = pro
    ? `Welcome, ${firstName} — your ${org.name} account is ready`
    : `Welcome to ${org.name} — start your enrollment`;

  await send({ to, subject, html: wrap(org, body) });
}

/**
 * Confirmation to a parent after they submit an enrollment.
 *
 * @param {object} opts
 * @param {string} opts.to           Parent email
 * @param {string} opts.parentName   Parent full name
 * @param {string} opts.childName    Child's name from form_data
 * @param {object} opts.org          Full organizations DB row
 * @param {string} opts.dashboardUrl
 */
async function sendSubmissionConfirmation({ to, parentName, childName, org, dashboardUrl }) {
  const firstName = parentName.split(' ')[0];
  const color     = org.primary_color || '#f97316';
  const pro       = isPro(org);
  const child     = childName || 'your child';

  const body = pro
    ? `
      ${h2("Enrollment Received ✅", org.accent_color || '#111827')}
      ${p(`Hi ${firstName}, thank you for submitting the enrollment application for <strong>${child}</strong>.`)}
      ${p(`The ${org.name} team will carefully review it and reach out if anything else is needed. You can track the status of the application from your dashboard at any time.`)}
      ${divider(color + '22')}
      <table cellpadding="0" cellspacing="0" style="width:100%;background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;margin-bottom:4px;">
        ${detailRow('Child', child, color)}
        ${detailRow('Submitted to', org.name, color)}
        ${detailRow('Status', 'Under Review')}
      </table>
      ${btn('Track Application Status →', dashboardUrl, color)}
    `
    : `
      ${h2('Enrollment Submitted ✅')}
      ${p(`Hi ${firstName}, we've received the enrollment application for <strong>${child}</strong>.`)}
      ${p(`The ${org.name} team will review it and be in touch. You can check the status at any time from your dashboard.`)}
      ${btn('View Application Status', dashboardUrl, color)}
    `;

  const subject = pro
    ? `Application received for ${child} — ${org.name}`
    : `Enrollment received — ${child} at ${org.name}`;

  await send({ to, subject, html: wrap(org, body) });
}

/**
 * Notification to the daycare admin when a new enrollment is submitted.
 *
 * @param {object} opts
 * @param {string} opts.to          Admin email
 * @param {string} opts.childName
 * @param {string} opts.parentName
 * @param {string} opts.parentEmail
 * @param {object} opts.org         Full organizations DB row
 * @param {string} opts.reviewUrl   https://<slug>.enrollpack.com/admin/enrollment/:id
 */
async function sendAdminNewEnrollment({ to, childName, parentName, parentEmail, org, reviewUrl }) {
  const color = org.primary_color || '#f97316';
  const pro   = isPro(org);
  const child = childName || 'Unnamed child';

  const body = pro
    ? `
      ${h2('New Enrollment Awaiting Review 📋', org.accent_color || '#111827')}
      ${p('A new enrollment application has been submitted and is waiting for your review.')}
      <table cellpadding="0" cellspacing="0" style="width:100%;background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;margin:20px 0;">
        ${detailRow('Child', child, color)}
        ${detailRow('Parent', parentName, color)}
        ${detailRow('Email', `<a href="mailto:${parentEmail}" style="color:${color};text-decoration:none;">${parentEmail}</a>`, color)}
        ${detailRow('Submitted', new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }), color)}
      </table>
      ${p('Log in to your admin dashboard to review the application, add notes, or request corrections.', 'font-size:13px;color:#6b7280;')}
      ${btn('Review Application →', reviewUrl, color)}
    `
    : `
      ${h2('New Enrollment Submitted 📋')}
      ${p('A new enrollment has been submitted and is waiting for your review.')}
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px 0;font-size:14px;color:#6b7280;width:120px;">Child</td><td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${child}</td></tr>
        <tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Parent</td><td style="padding:8px 0;font-size:14px;color:#111827;">${parentName}</td></tr>
        <tr><td style="padding:8px 0;font-size:14px;color:#6b7280;">Email</td><td style="padding:8px 0;font-size:14px;color:#111827;">${parentEmail}</td></tr>
      </table>
      ${btn('Review Enrollment', reviewUrl, color)}
    `;

  const subject = pro
    ? `[Action Required] New enrollment: ${child}`
    : `New enrollment: ${child} — action required`;

  await send({ to, subject, html: wrap(org, body) });
}

/**
 * Status update email sent to a parent when an admin changes enrollment status.
 *
 * @param {object} opts
 * @param {string} opts.to           Parent email
 * @param {string} opts.parentName
 * @param {string} opts.childName
 * @param {string} opts.status       New enrollment status
 * @param {string|null} opts.adminNotes
 * @param {object} opts.org          Full organizations DB row
 * @param {string} opts.dashboardUrl
 */
async function sendStatusUpdate({ to, parentName, childName, status, adminNotes, org, dashboardUrl }) {
  const firstName = parentName.split(' ')[0];
  const color     = org.primary_color || '#f97316';
  const pro       = isPro(org);
  const child     = childName || 'your child';

  // Status-specific copy — pro gets warmer, more personal messaging
  const MESSAGES = {
    approved: {
      starter: `Great news! The enrollment for <strong>${child}</strong> has been <strong>approved</strong> by ${org.name}.`,
      pro:     `Wonderful news, ${firstName}! We're thrilled to let you know that <strong>${child}</strong>'s enrollment application has been <strong>approved</strong>. Welcome to the ${org.name} family!`,
      emoji:   '🎉',
    },
    needs_correction: {
      starter: `The enrollment for <strong>${child}</strong> needs some corrections. Please log in, review the notes, and resubmit.`,
      pro:     `Hi ${firstName}, we've reviewed <strong>${child}</strong>'s application and have a few items that need your attention before we can move forward. Please log in to see the details and resubmit at your convenience.`,
      emoji:   '📝',
    },
    printed: {
      starter: `The enrollment for <strong>${child}</strong> has been printed and is being processed.`,
      pro:     `Good progress, ${firstName}! <strong>${child}</strong>'s enrollment forms have been printed and are currently being processed by our team.`,
      emoji:   '🖨️',
    },
    signed: {
      starter: `The enrollment for <strong>${child}</strong> has been signed. You're almost done!`,
      pro:     `You're nearly there, ${firstName}! <strong>${child}</strong>'s enrollment forms have been signed. We'll be in touch shortly with the final confirmation.`,
      emoji:   '✍️',
    },
  };

  const msg   = MESSAGES[status];
  const emoji = msg?.emoji || '📋';
  const text  = pro ? (msg?.pro || '') : (msg?.starter || `The status of the enrollment for <strong>${child}</strong> has been updated.`);

  const SUBJECTS = {
    approved:         pro ? `${emoji} ${child} is approved — welcome to ${org.name}!` : `Enrollment approved — ${child} at ${org.name}`,
    needs_correction: pro ? `${emoji} Action needed on ${child}'s application` : `Action required — enrollment needs correction`,
    printed:          pro ? `${emoji} ${child}'s enrollment is being processed` : `Enrollment update — ${child}`,
    signed:           pro ? `${emoji} ${child}'s enrollment has been signed` : `Enrollment update — ${child}`,
  };

  const notesBlock = adminNotes
    ? `<div style="margin:20px 0;padding:16px 18px;background:#f9fafb;border-left:4px solid ${color};border-radius:6px;">
         <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#9ca3af;">Note from ${org.name}</p>
         <p style="margin:0;font-size:14px;color:#374151;line-height:1.6;">${adminNotes}</p>
       </div>`
    : '';

  const body = pro
    ? `
      ${h2(`${emoji} Enrollment Update`, org.accent_color || '#111827')}
      ${p(text)}
      ${notesBlock}
      ${divider(color + '22')}
      <table cellpadding="0" cellspacing="0" style="width:100%;background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;margin-bottom:4px;">
        ${detailRow('Child', child, color)}
        ${detailRow('Current Status', statusBadge(status), color)}
      </table>
      ${btn('View My Dashboard →', dashboardUrl, color)}
    `
    : `
      ${h2('Enrollment Update')}
      ${p(`Hi ${firstName},`)}
      ${p(text)}
      ${notesBlock}
      <p style="margin:16px 0 4px;font-size:13px;color:#6b7280;">Current status</p>
      ${statusBadge(status)}
      ${btn('View My Dashboard', dashboardUrl, color)}
    `;

  const subject = SUBJECTS[status] || `Enrollment update — ${org.name}`;
  await send({ to, subject, html: wrap(org, body) });
}

/**
 * Welcome email sent to a daycare admin when their org is first created.
 * Uses EnrollPack platform branding (not org branding).
 *
 * @param {object} opts
 * @param {string} opts.to          Admin email
 * @param {string} opts.adminName   Admin full name
 * @param {object} opts.org         Full organizations DB row
 * @param {string} opts.loginUrl    https://<slug>.enrollpack.com/login
 */
async function sendOrgWelcome({ to, adminName, org, loginUrl }) {
  const EP_COLOR  = '#f97316';
  const firstName = adminName ? adminName.split(' ')[0] : 'there';
  const isTrial   = org.plan === 'trial';

  const trialNote = isTrial
    ? `<div style="margin:24px 0;padding:16px 18px;background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;">
         <p style="margin:0 0 4px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#c2410c;">Free Trial — 30 Days</p>
         <p style="margin:0;font-size:14px;color:#7c2d12;line-height:1.6;">
           Your trial includes up to 5 enrollments. <a href="mailto:hello@enrollpack.com?subject=Upgrade from Trial" style="color:${EP_COLOR};font-weight:600;">Contact us to upgrade</a> whenever you're ready.
         </p>
       </div>`
    : '';

  const planLabel = { trial: 'Free Trial', starter: 'Starter', pro: 'Pro', inactive: 'Inactive' }[org.plan] || org.plan;

  const body = `
    ${h2(`Welcome to EnrollPack, ${firstName}! 🎉`)}
    ${p(`Your <strong>${org.name}</strong> enrollment portal is ready. Parents can now register and submit forms online — no more paper packets.`)}

    ${trialNote}

    <table cellpadding="0" cellspacing="0" style="width:100%;background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;margin:20px 0;">
      ${detailRow('Portal URL', `<a href="${loginUrl}" style="color:${EP_COLOR};text-decoration:none;font-weight:600;">${loginUrl.replace('/login','')}</a>`)}
      ${detailRow('Your login', to)}
      ${detailRow('Plan', planLabel)}
    </table>

    ${p('Here\'s how to get started:', 'font-weight:600;color:#111827;margin-bottom:8px;')}
    <table cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
      <tr>
        <td style="padding:8px 0;vertical-align:top;">
          <span style="display:inline-block;width:24px;height:24px;background:${EP_COLOR};border-radius:50%;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:24px;flex-shrink:0;">1</span>
        </td>
        <td style="padding:8px 0 8px 10px;font-size:14px;color:#374151;">Log in to your admin dashboard and review your settings.</td>
      </tr>
      <tr>
        <td style="padding:8px 0;vertical-align:top;">
          <span style="display:inline-block;width:24px;height:24px;background:${EP_COLOR};border-radius:50%;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:24px;flex-shrink:0;">2</span>
        </td>
        <td style="padding:8px 0 8px 10px;font-size:14px;color:#374151;">Share your portal link with parents so they can register and enroll.</td>
      </tr>
      <tr>
        <td style="padding:8px 0;vertical-align:top;">
          <span style="display:inline-block;width:24px;height:24px;background:${EP_COLOR};border-radius:50%;color:#fff;font-size:12px;font-weight:700;text-align:center;line-height:24px;flex-shrink:0;">3</span>
        </td>
        <td style="padding:8px 0 8px 10px;font-size:14px;color:#374151;">Review and approve submissions from your dashboard.</td>
      </tr>
    </table>

    ${btn('Go to My Dashboard →', loginUrl, EP_COLOR)}
    ${p('Questions? Reply to this email or reach us at <a href="mailto:hello@enrollpack.com" style="color:' + EP_COLOR + ';">hello@enrollpack.com</a>.', 'font-size:13px;color:#6b7280;margin-top:20px;')}
  `;

  await send({
    to,
    subject: `Your ${org.name} portal is live on EnrollPack 🎉`,
    html: wrapPlatform(body),
  });
}

/**
 * Plan upgrade email sent to the daycare admin when their plan is upgraded.
 * Uses EnrollPack platform branding.
 *
 * @param {object} opts
 * @param {string} opts.to          Admin email
 * @param {string} opts.adminName   Admin full name
 * @param {object} opts.org         Full organizations DB row (after update)
 * @param {string} opts.oldPlan     Previous plan slug
 * @param {string} opts.loginUrl    https://<slug>.enrollpack.com/login
 */
async function sendPlanUpgrade({ to, adminName, org, oldPlan, loginUrl }) {
  const EP_COLOR  = '#f97316';
  const firstName = adminName ? adminName.split(' ')[0] : 'there';

  const PLAN_FEATURES = {
    starter: [
      'Unlimited enrollments — no cap',
      'Custom daycare name & tagline',
      'Custom brand colors & logo',
      'Branded parent portal',
      'Email support',
    ],
    pro: [
      'Everything in Starter',
      'White-label emails — your branding, no EnrollPack mention',
      'Custom logo in email headers',
      'Personalised email copy for parents',
      'Priority support',
      'Multiple staff accounts',
    ],
  };

  const PLAN_LABELS = { trial: 'Free Trial', starter: 'Starter', pro: 'Pro' };
  const newLabel = PLAN_LABELS[org.plan] || org.plan;
  const oldLabel = PLAN_LABELS[oldPlan]  || oldPlan;

  const features = PLAN_FEATURES[org.plan] || [];

  const body = `
    ${h2(`You've upgraded to ${newLabel}! 🚀`)}
    ${p(`Great news, ${firstName} — <strong>${org.name}</strong> has been upgraded from <strong>${oldLabel}</strong> to the <strong>${newLabel}</strong> plan. Your new features are active right now.`)}

    ${features.length > 0 ? `
      <p style="margin:20px 0 10px;font-size:14px;font-weight:700;color:#111827;">What's now unlocked:</p>
      <table cellpadding="0" cellspacing="0" style="width:100%;background:#f9fafb;border-radius:10px;border:1px solid #e5e7eb;margin-bottom:20px;">
        ${features.map(f => `
          <tr>
            <td style="padding:10px 14px;width:24px;vertical-align:top;">
              <span style="color:${EP_COLOR};font-weight:700;font-size:15px;">✓</span>
            </td>
            <td style="padding:10px 14px 10px 4px;font-size:14px;color:#111827;">${f}</td>
          </tr>`).join('')}
      </table>
    ` : ''}

    ${org.plan === 'starter'
      ? p('Head to <strong>Settings → Organization Settings</strong> in your dashboard to upload your logo and customize your brand colors.', 'font-size:14px;color:#374151;')
      : ''}
    ${org.plan === 'pro'
      ? p('Your email templates are now fully white-labelled. Parents will see your daycare\'s branding throughout — not EnrollPack\'s.', 'font-size:14px;color:#374151;')
      : ''}

    ${btn('Go to My Dashboard →', loginUrl, EP_COLOR)}
    ${p('Thank you for choosing EnrollPack. Questions? <a href="mailto:hello@enrollpack.com" style="color:' + EP_COLOR + ';">hello@enrollpack.com</a>', 'font-size:13px;color:#6b7280;margin-top:20px;')}
  `;

  await send({
    to,
    subject: `${org.name} is now on the ${newLabel} plan 🚀`,
    html: wrapPlatform(body),
  });
}

/**
 * Email verification sent to a new daycare admin after self-service signup.
 * Uses EnrollPack platform branding. Must be clicked before they can log in.
 *
 * @param {object} opts
 * @param {string} opts.to          Admin email
 * @param {string} opts.adminName   Admin full name
 * @param {object} opts.org         Full organizations DB row
 * @param {string} opts.verifyUrl   https://enrollpack.com/verify-email?token=xxx
 */
async function sendEmailVerification({ to, adminName, org, verifyUrl }) {
  const EP_COLOR  = '#f97316';
  const firstName = adminName ? adminName.split(' ')[0] : 'there';

  const body = `
    ${h2(`Verify your email address ✉️`)}
    ${p(`Hi ${firstName}, thanks for signing up! You're almost ready to start using EnrollPack for <strong>${org.name}</strong>.`)}
    ${p('Click the button below to verify your email address and activate your account. This link expires in <strong>24 hours</strong>.')}

    <div style="text-align:center;margin:32px 0;">
      <a href="${verifyUrl}"
        style="display:inline-block;padding:14px 36px;background:${EP_COLOR};color:#ffffff;font-weight:700;font-size:15px;border-radius:12px;text-decoration:none;letter-spacing:0.01em;"
      >Verify My Email →</a>
    </div>

    ${divider()}
    ${p('If the button doesn\'t work, copy and paste this link into your browser:', 'font-size:13px;color:#6b7280;')}
    <p style="margin:0 0 20px;font-size:12px;color:#9ca3af;word-break:break-all;">
      <a href="${verifyUrl}" style="color:${EP_COLOR};">${verifyUrl}</a>
    </p>
    ${p('If you didn\'t sign up for EnrollPack, you can safely ignore this email.', 'font-size:12px;color:#9ca3af;')}
  `;

  await send({
    to,
    subject: `Verify your email to activate ${org.name} on EnrollPack`,
    html: wrapPlatform(body),
  });
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  sendWelcome,
  sendSubmissionConfirmation,
  sendAdminNewEnrollment,
  sendStatusUpdate,
  sendOrgWelcome,
  sendPlanUpgrade,
  sendEmailVerification,
};
