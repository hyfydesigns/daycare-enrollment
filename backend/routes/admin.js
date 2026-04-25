const express = require('express');
const db = require('../database');
const { authenticate, requireAdmin } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate, requireAdmin);

// Resolve which org_id to scope queries to.
// Superadmin can pass ?org_id=X to see any org; regular admin is locked to their own.
function scopeOrgId(req) {
  if (req.user.role === 'superadmin' && req.query.org_id) {
    return parseInt(req.query.org_id, 10);
  }
  return req.user.org_id;
}

// All enrollments with parent info — scoped to org
router.get('/enrollments', (req, res) => {
  const { search, status, sort = 'updated_at', order = 'desc' } = req.query;
  const orgId = scopeOrgId(req);

  let query = `
    SELECT e.id, e.child_name, e.status, e.submitted_at, e.created_at, e.updated_at, e.admin_notes,
           u.full_name AS parent_name, u.email AS parent_email
    FROM enrollments e
    JOIN users u ON e.user_id = u.id
    WHERE e.org_id = ?
  `;
  const params = [orgId];

  if (search) {
    query += ` AND (e.child_name LIKE ? OR u.full_name LIKE ? OR u.email LIKE ?)`;
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (status && status !== 'all') {
    query += ` AND e.status = ?`;
    params.push(status);
  }

  const allowedSort = ['child_name', 'updated_at', 'submitted_at', 'created_at', 'status'];
  const safeSort = allowedSort.includes(sort) ? sort : 'updated_at';
  query += ` ORDER BY e.${safeSort} ${order === 'asc' ? 'ASC' : 'DESC'}`;

  res.json(db.prepare(query).all(...params));
});

// Single enrollment — must belong to admin's org
router.get('/enrollments/:id', (req, res) => {
  const orgId = scopeOrgId(req);
  const enrollment = db.prepare(`
    SELECT e.*, u.full_name AS parent_name, u.email AS parent_email, u.phone AS parent_phone
    FROM enrollments e
    JOIN users u ON e.user_id = u.id
    WHERE e.id = ? AND e.org_id = ?
  `).get(req.params.id, orgId);

  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
  enrollment.form_data = JSON.parse(enrollment.form_data || '{}');
  res.json(enrollment);
});

// Update enrollment status
router.patch('/enrollments/:id/status', (req, res) => {
  const { status, admin_notes } = req.body;
  const orgId = scopeOrgId(req);
  const allowed = ['submitted', 'printed', 'signed', 'approved', 'needs_correction'];

  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const enrollment = db.prepare('SELECT id FROM enrollments WHERE id = ? AND org_id = ?').get(req.params.id, orgId);
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

  db.prepare(`
    UPDATE enrollments
    SET status = ?, admin_notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(status, admin_notes || null, req.params.id);

  res.json({ success: true });
});

// Reopen for correction
router.patch('/enrollments/:id/reopen', (req, res) => {
  const { admin_notes } = req.body;
  const orgId = scopeOrgId(req);

  const enrollment = db.prepare('SELECT id FROM enrollments WHERE id = ? AND org_id = ?').get(req.params.id, orgId);
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });

  db.prepare(`
    UPDATE enrollments
    SET status = 'needs_correction', admin_notes = ?, updated_at = datetime('now')
    WHERE id = ?
  `).run(admin_notes || null, req.params.id);

  res.json({ success: true });
});

// Dashboard stats — scoped to org
router.get('/stats', (req, res) => {
  const orgId = scopeOrgId(req);
  const stats = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN status = 'draft'            THEN 1 ELSE 0 END) AS draft,
      SUM(CASE WHEN status = 'submitted'        THEN 1 ELSE 0 END) AS submitted,
      SUM(CASE WHEN status = 'printed'          THEN 1 ELSE 0 END) AS printed,
      SUM(CASE WHEN status = 'signed'           THEN 1 ELSE 0 END) AS signed,
      SUM(CASE WHEN status = 'approved'         THEN 1 ELSE 0 END) AS approved,
      SUM(CASE WHEN status = 'needs_correction' THEN 1 ELSE 0 END) AS needs_correction
    FROM enrollments WHERE org_id = ?
  `).get(orgId);
  res.json(stats);
});

module.exports = router;
