const express = require('express');
const db = require('../database');
const { authenticate } = require('../middleware/auth');
const { sendSubmissionConfirmation, sendAdminNewEnrollment } = require('../services/email');
const { sendSmsSubmissionConfirmation, sendSmsAdminNewEnrollment } = require('../services/sms');
const { TRIAL_ENROLLMENT_LIMIT } = require('./org');

const router = express.Router();
router.use(authenticate);

// All enrollments for the logged-in parent within their org
router.get('/', (req, res) => {
  const enrollments = db.prepare(`
    SELECT id, child_name, status, submitted_at, created_at, updated_at
    FROM enrollments
    WHERE user_id = ? AND org_id = ?
    ORDER BY updated_at DESC
  `).all(req.user.id, req.user.org_id);
  res.json(enrollments);
});

// Single enrollment — parent can only access their own
router.get('/:id', (req, res) => {
  const enrollment = db.prepare(`
    SELECT * FROM enrollments WHERE id = ? AND user_id = ? AND org_id = ?
  `).get(req.params.id, req.user.id, req.user.org_id);
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
  enrollment.form_data = JSON.parse(enrollment.form_data || '{}');
  res.json(enrollment);
});

// Create new enrollment
router.post('/', (req, res) => {
  if (req.user.role !== 'parent') {
    return res.status(403).json({ error: 'Only parents can create enrollments' });
  }

  // Trial plan: enforce enrollment cap
  const org = db.prepare('SELECT plan, trial_ends_at FROM organizations WHERE id = ?').get(req.user.org_id);
  if (org && org.plan === 'trial') {
    // Check if trial has expired
    if (org.trial_ends_at && new Date(org.trial_ends_at) < new Date()) {
      return res.status(403).json({
        error: 'Your free trial has expired. Contact your daycare administrator to upgrade.',
        trial_expired: true,
      });
    }
    // Check enrollment cap
    const { count } = db.prepare('SELECT COUNT(*) AS count FROM enrollments WHERE org_id = ?').get(req.user.org_id);
    if (count >= TRIAL_ENROLLMENT_LIMIT) {
      return res.status(403).json({
        error: `Your daycare is on the free Trial plan, which is limited to ${TRIAL_ENROLLMENT_LIMIT} enrollments. Contact your administrator to upgrade.`,
        trial_limit_reached: true,
        limit: TRIAL_ENROLLMENT_LIMIT,
        count,
      });
    }
  }

  const { form_data = {} } = req.body;
  const child_name = form_data?.general?.childFullName || null;

  const result = db.prepare(`
    INSERT INTO enrollments (org_id, user_id, child_name, form_data, status)
    VALUES (?, ?, ?, ?, 'draft')
  `).run(req.user.org_id, req.user.id, child_name, JSON.stringify(form_data));

  const enrollment = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(result.lastInsertRowid);
  enrollment.form_data = JSON.parse(enrollment.form_data);
  res.status(201).json(enrollment);
});

// Save progress
router.put('/:id', (req, res) => {
  const existing = db.prepare(`
    SELECT * FROM enrollments WHERE id = ? AND user_id = ? AND org_id = ?
  `).get(req.params.id, req.user.id, req.user.org_id);

  if (!existing) return res.status(404).json({ error: 'Enrollment not found' });
  if (['submitted', 'approved', 'signed'].includes(existing.status)) {
    return res.status(400).json({ error: 'Cannot edit a submitted or approved enrollment' });
  }

  const { form_data = {} } = req.body;
  const child_name = form_data?.general?.childFullName || existing.child_name;

  db.prepare(`
    UPDATE enrollments
    SET form_data = ?, child_name = ?, updated_at = datetime('now')
    WHERE id = ? AND user_id = ? AND org_id = ?
  `).run(JSON.stringify(form_data), child_name, req.params.id, req.user.id, req.user.org_id);

  const updated = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(req.params.id);
  updated.form_data = JSON.parse(updated.form_data);
  res.json(updated);
});

// Delete enrollment — parents may only delete draft or needs_correction forms
router.delete('/:id', (req, res) => {
  const enrollment = db.prepare(`
    SELECT id, status FROM enrollments WHERE id = ? AND user_id = ? AND org_id = ?
  `).get(req.params.id, req.user.id, req.user.org_id);

  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

  const deletable = ['draft', 'needs_correction'];
  if (!deletable.includes(enrollment.status)) {
    return res.status(400).json({
      error: 'Only draft or needs-correction enrollments can be deleted. Contact your daycare to withdraw a submitted form.',
    });
  }

  db.prepare('DELETE FROM enrollments WHERE id = ?').run(enrollment.id);
  res.json({ success: true, deleted_id: enrollment.id });
});

// Submit enrollment
router.post('/:id/submit', (req, res) => {
  const existing = db.prepare(`
    SELECT * FROM enrollments WHERE id = ? AND user_id = ? AND org_id = ?
  `).get(req.params.id, req.user.id, req.user.org_id);

  if (!existing) return res.status(404).json({ error: 'Enrollment not found' });
  if (!['draft', 'needs_correction'].includes(existing.status)) {
    return res.status(400).json({ error: 'Enrollment already submitted' });
  }

  const { form_data } = req.body;
  const finalData = form_data || JSON.parse(existing.form_data || '{}');
  const child_name = finalData?.general?.childFullName || existing.child_name;

  db.prepare(`
    UPDATE enrollments
    SET status = 'submitted', form_data = ?, child_name = ?,
        submitted_at = datetime('now'), updated_at = datetime('now')
    WHERE id = ? AND user_id = ? AND org_id = ?
  `).run(JSON.stringify(finalData), child_name, req.params.id, req.user.id, req.user.org_id);

  const updated = db.prepare('SELECT * FROM enrollments WHERE id = ?').get(req.params.id);
  updated.form_data = JSON.parse(updated.form_data);

  // Fire-and-forget emails: confirmation to parent + notification to admin
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.user.org_id);
  const parent = db.prepare('SELECT full_name, email, phone FROM users WHERE id = ?').get(req.user.id);
  const adminUser = db.prepare("SELECT email, phone FROM users WHERE org_id = ? AND role = 'admin' LIMIT 1").get(req.user.org_id);

  if (org && parent) {
    const appDomain = process.env.APP_DOMAIN || 'enrollpack.com';
    const dashboardUrl = `https://${org.slug}.${appDomain}/dashboard`;
    const reviewUrl = `https://${org.slug}.${appDomain}/admin/enrollment/${updated.id}`;

    sendSubmissionConfirmation({
      to: parent.email,
      parentName: parent.full_name,
      childName: updated.child_name,
      org,
      dashboardUrl,
    });
    sendSmsSubmissionConfirmation({
      org,
      phone:      parent.phone,
      parentName: parent.full_name,
      childName:  updated.child_name,
    });

    if (adminUser) {
      sendAdminNewEnrollment({
        to: adminUser.email,
        childName: updated.child_name,
        parentName: parent.full_name,
        parentEmail: parent.email,
        org,
        reviewUrl,
      });
      sendSmsAdminNewEnrollment({
        org,
        phone:      adminUser.phone,
        childName:  updated.child_name,
        parentName: parent.full_name,
        reviewUrl,
      });
    }
  }

  res.json(updated);
});

module.exports = router;
