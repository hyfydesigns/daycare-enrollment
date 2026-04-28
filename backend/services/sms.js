/**
 * SMS service powered by Twilio.
 *
 * - Only sends if TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and
 *   TWILIO_PHONE_NUMBER are all set.
 * - Only sends for Pro plan orgs (SMS is a Pro feature).
 * - Only sends if the recipient has a phone number on file.
 * - All sends are fire-and-forget — errors are logged, never thrown.
 */

'use strict';

let client = null;

function getClient() {
  if (client) return client;
  const sid   = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (!sid || !token) return null;
  client = require('twilio')(sid, token);
  return client;
}

const FROM = () => process.env.TWILIO_PHONE_NUMBER || null;

// ─── Guard helpers ────────────────────────────────────────────────────────────

function isPro(org) {
  return org && org.plan === 'pro';
}

function normalizePhone(raw) {
  if (!raw) return null;
  // Strip everything except digits and leading +
  const digits = raw.replace(/[^\d+]/g, '');
  // Ensure E.164 format for US numbers
  if (digits.startsWith('+')) return digits;
  if (digits.length === 10)   return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  return digits.length >= 7 ? digits : null; // pass through, let Twilio validate
}

// ─── Core send ────────────────────────────────────────────────────────────────

async function send({ to, body }) {
  const twilio = getClient();
  const from   = FROM();

  if (!twilio || !from) {
    console.warn('[sms] Twilio not configured — skipping SMS to', to);
    return;
  }

  const phone = normalizePhone(to);
  if (!phone) {
    console.warn('[sms] Invalid or missing phone number — skipping');
    return;
  }

  try {
    const msg = await twilio.messages.create({ from, to: phone, body });
    console.log(`[sms] Sent to ${phone} — SID: ${msg.sid}`);
  } catch (err) {
    console.error('[sms] Twilio error:', err.message);
  }
}

// ─── Message templates ────────────────────────────────────────────────────────

/**
 * Sent to a parent after they submit an enrollment.
 */
async function smsSubmissionConfirmation({ phone, parentName, childName, orgName }) {
  if (!phone) return;
  const firstName = parentName ? parentName.split(' ')[0] : '';
  const child     = childName  || 'your child';
  await send({
    to:   phone,
    body: `Hi ${firstName}! ✅ We've received the enrollment for ${child} at ${orgName}. We'll review it and be in touch soon.`,
  });
}

/**
 * Sent to the daycare admin when a new enrollment is submitted.
 */
async function smsAdminNewEnrollment({ phone, childName, parentName, orgName, reviewUrl }) {
  if (!phone) return;
  const child = childName || 'a child';
  await send({
    to:   phone,
    body: `📋 ${orgName}: New enrollment submitted for ${child} by ${parentName}. Log in to review: ${reviewUrl}`,
  });
}

/**
 * Sent to a parent when the admin updates enrollment status.
 */
async function smsStatusUpdate({ phone, parentName, childName, status, orgName, dashboardUrl }) {
  if (!phone) return;
  const firstName = parentName ? parentName.split(' ')[0] : '';
  const child     = childName  || 'your child';

  const messages = {
    approved:         `🎉 Great news, ${firstName}! ${child}'s enrollment at ${orgName} has been approved. Welcome!`,
    needs_correction: `📝 Hi ${firstName}, action needed on ${child}'s enrollment at ${orgName}. Log in for details: ${dashboardUrl}`,
    printed:          `🖨️ ${child}'s enrollment at ${orgName} has been printed and is being processed.`,
    signed:           `✍️ ${child}'s enrollment at ${orgName} has been signed. Almost done!`,
  };

  const body = messages[status];
  if (!body) return; // don't send SMS for statuses without a template

  await send({ to: phone, body });
}

// ─── Plan-gated wrappers ──────────────────────────────────────────────────────
// These are what the route files call. They check the org plan so callers
// don't have to.

async function sendSmsSubmissionConfirmation({ org, phone, parentName, childName }) {
  if (!isPro(org)) return;
  await smsSubmissionConfirmation({ phone, parentName, childName, orgName: org.name });
}

async function sendSmsAdminNewEnrollment({ org, phone, childName, parentName, reviewUrl }) {
  if (!isPro(org)) return;
  await smsAdminNewEnrollment({ phone, childName, parentName, orgName: org.name, reviewUrl });
}

async function sendSmsStatusUpdate({ org, phone, parentName, childName, status, dashboardUrl }) {
  if (!isPro(org)) return;
  await smsStatusUpdate({ phone, parentName, childName, status, orgName: org.name, dashboardUrl });
}

module.exports = {
  sendSmsSubmissionConfirmation,
  sendSmsAdminNewEnrollment,
  sendSmsStatusUpdate,
};
