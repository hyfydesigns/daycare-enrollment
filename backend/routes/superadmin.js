const express = require('express');
const crypto  = require('crypto');
const bcrypt  = require('bcryptjs');
const db      = require('../database');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');
const { sendOrgWelcome, sendPlanUpgrade } = require('../services/email');

const router = express.Router();
router.use(authenticate, requireSuperAdmin);

// List all organizations with enrollment counts
router.get('/orgs', (req, res) => {
  const orgs = db.prepare(`
    SELECT o.*,
      COUNT(DISTINCT e.id) AS enrollment_count,
      COUNT(DISTINCT u.id) AS user_count
    FROM organizations o
    LEFT JOIN enrollments e ON e.org_id = o.id
    LEFT JOIN users u ON u.org_id = o.id
    GROUP BY o.id
    ORDER BY o.created_at DESC
  `).all();
  res.json(orgs);
});

// Get single org
router.get('/orgs/:id', (req, res) => {
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
  if (!org) return res.status(404).json({ error: 'Organization not found' });
  res.json(org);
});

// Create a new org + seed its first admin account
router.post('/orgs', (req, res) => {
  const { name, slug, owner_email, owner_password, owner_name, primary_color, tagline, plan } = req.body;

  if (!name || !slug || !owner_email || !owner_password) {
    return res.status(400).json({ error: 'name, slug, owner_email, and owner_password are required' });
  }

  const existing = db.prepare('SELECT id FROM organizations WHERE slug = ?').get(slug);
  if (existing) return res.status(409).json({ error: 'Slug already taken' });

  const chosenPlan = plan || 'trial';
  const orgResult = db.prepare(`
    INSERT INTO organizations (name, slug, owner_email, primary_color, tagline, plan, trial_ends_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    name,
    slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
    owner_email,
    primary_color || '#f97316',
    tagline || null,
    chosenPlan,
    chosenPlan === 'trial' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null,
  );

  const orgId = orgResult.lastInsertRowid;
  const hash = bcrypt.hashSync(owner_password, 12);
  db.prepare(`
    INSERT INTO users (org_id, email, password_hash, full_name, role)
    VALUES (?, ?, ?, ?, 'admin')
  `).run(orgId, owner_email.toLowerCase().trim(), hash, owner_name || name + ' Admin');

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(orgId);

  // Fire-and-forget welcome email to the new daycare admin
  const appDomain = process.env.APP_DOMAIN || 'enrollpack.com';
  sendOrgWelcome({
    to:        owner_email.toLowerCase().trim(),
    adminName: owner_name || name + ' Admin',
    org,
    loginUrl:  `https://${org.slug}.${appDomain}/login`,
  });

  res.status(201).json(org);
});

// Update org (plan, branding, status)
router.patch('/orgs/:id', (req, res) => {
  const { name, slug, owner_email, primary_color, accent_color, tagline, plan, logo_url } = req.body;

  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
  if (!org) return res.status(404).json({ error: 'Organization not found' });

  // Manage trial_ends_at when plan changes:
  //   trial → paid:  clear it (unlimited time on paid plan)
  //   paid  → trial: set a fresh 14-day window from now
  //   no change:     leave it alone
  let trialEndsAt = undefined; // undefined = don't touch the column
  if (plan && plan !== org.plan) {
    if (plan === 'trial') {
      trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else {
      trialEndsAt = null; // clear for paid / inactive plans
    }
  }

  db.prepare(`
    UPDATE organizations
    SET name          = COALESCE(?, name),
        slug          = COALESCE(?, slug),
        owner_email   = COALESCE(?, owner_email),
        primary_color = COALESCE(?, primary_color),
        accent_color  = COALESCE(?, accent_color),
        tagline       = COALESCE(?, tagline),
        plan          = COALESCE(?, plan),
        logo_url      = COALESCE(?, logo_url),
        trial_ends_at = CASE WHEN ? THEN ? ELSE trial_ends_at END
    WHERE id = ?
  `).run(
    name||null, slug||null, owner_email||null, primary_color||null, accent_color||null,
    tagline||null, plan||null, logo_url||null,
    trialEndsAt !== undefined ? 1 : 0, trialEndsAt !== undefined ? trialEndsAt : null,
    req.params.id,
  );

  const updated = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);

  // Send upgrade email when plan changes from trial/lower to a paid plan
  const PAID_PLANS = ['starter', 'pro'];
  if (plan && plan !== org.plan && PAID_PLANS.includes(plan)) {
    const adminUser = db.prepare(
      "SELECT email, full_name FROM users WHERE org_id = ? AND role = 'admin' LIMIT 1"
    ).get(req.params.id);

    if (adminUser) {
      const appDomain = process.env.APP_DOMAIN || 'enrollpack.com';
      sendPlanUpgrade({
        to:        adminUser.email,
        adminName: adminUser.full_name,
        org:       updated,
        oldPlan:   org.plan,
        loginUrl:  `https://${updated.slug}.${appDomain}/login`,
      });
    }
  }

  res.json(updated);
});

// Export all org data as a JSON bundle (for backup before deletion)
router.get('/orgs/:id/export', (req, res) => {
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
  if (!org) return res.status(404).json({ error: 'Organization not found' });

  // Users — strip password hash and token fields
  const users = db.prepare(`
    SELECT id, org_id, email, full_name, role, phone, email_verified, created_at
    FROM users WHERE org_id = ?
  `).all(org.id);

  // Enrollments — parse form_data back to object for readability
  const enrollments = db.prepare(`
    SELECT e.*, u.full_name AS parent_name, u.email AS parent_email, u.phone AS parent_phone
    FROM enrollments e
    LEFT JOIN users u ON e.user_id = u.id
    WHERE e.org_id = ?
    ORDER BY e.created_at ASC
  `).all(org.id).map(e => ({
    ...e,
    form_data: (() => { try { return JSON.parse(e.form_data || '{}'); } catch { return {}; } })(),
  }));

  const bundle = {
    export_metadata: {
      exported_at:      new Date().toISOString(),
      exported_by:      req.user.email,
      enrollpack_note:  'Keep this file to reinstate the organization if needed.',
    },
    organization: org,
    summary: {
      total_users:       users.length,
      total_enrollments: enrollments.length,
      approved:          enrollments.filter(e => e.status === 'approved').length,
      submitted:         enrollments.filter(e => e.status === 'submitted').length,
      draft:             enrollments.filter(e => e.status === 'draft').length,
    },
    users,
    enrollments,
  };

  const filename = `enrollpack-export-${org.slug}-${new Date().toISOString().slice(0,10)}.json`;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.json(bundle);
});

// Reinstate an org from an export bundle
router.post('/orgs/import', (req, res) => {
  const bundle = req.body;

  // Validate bundle shape
  if (!bundle || !bundle.organization || !Array.isArray(bundle.users) || !Array.isArray(bundle.enrollments)) {
    return res.status(400).json({ error: 'Invalid export bundle. Make sure you upload a file exported from EnrollPack.' });
  }

  const { organization, users, enrollments } = bundle;

  if (!organization.name || !organization.slug) {
    return res.status(400).json({ error: 'Export bundle is missing required organization fields.' });
  }

  // Reject if slug is already taken
  const slugConflict = db.prepare('SELECT id FROM organizations WHERE slug = ?').get(organization.slug);
  if (slugConflict) {
    return res.status(409).json({
      error: `The slug "${organization.slug}" is already in use. Edit the export file to give it a new slug, or delete/rename the conflicting org first.`,
    });
  }

  // Run everything inside a manual transaction (node:sqlite has no .transaction() helper)
  let result;
  try {
    db.exec('BEGIN');

    // 1. Recreate the organization
    const orgResult = db.prepare(`
      INSERT INTO organizations
        (name, slug, owner_email, primary_color, accent_color, tagline, plan, logo_url, trial_ends_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      organization.name,
      organization.slug,
      organization.owner_email   || null,
      organization.primary_color || '#f97316',
      organization.accent_color  || null,
      organization.tagline       || null,
      organization.plan          || 'trial',
      organization.logo_url      || null,
      organization.trial_ends_at || null,
    );

    const newOrgId = orgResult.lastInsertRowid;

    // 2. Generate a temp password for admin accounts
    //    (passwords were not included in the export for security)
    const tempPassword = crypto.randomBytes(6).toString('hex'); // 12-char hex
    const adminHash    = bcrypt.hashSync(tempPassword, 12);

    // 3. Recreate users, mapping old IDs → new IDs for enrollment foreign keys
    const userIdMap = {};
    let   adminEmail = null;

    for (const user of users) {
      const isAdmin = user.role === 'admin';
      if (isAdmin && !adminEmail) adminEmail = user.email;

      const userResult = db.prepare(`
        INSERT INTO users (org_id, email, password_hash, full_name, role, phone, email_verified, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      `).run(
        newOrgId,
        user.email.toLowerCase().trim(),
        isAdmin
          ? adminHash
          : bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 12),
        user.full_name || user.email,
        user.role      || 'parent',
        user.phone     || null,
        user.created_at || new Date().toISOString(),
      );

      userIdMap[user.id] = userResult.lastInsertRowid;
    }

    // 4. Recreate enrollments
    let skipped = 0;
    for (const enrollment of enrollments) {
      const newUserId = userIdMap[enrollment.user_id];
      if (!newUserId) { skipped++; continue; }

      const formDataStr = typeof enrollment.form_data === 'object'
        ? JSON.stringify(enrollment.form_data)
        : (enrollment.form_data || '{}');

      db.prepare(`
        INSERT INTO enrollments
          (org_id, user_id, child_name, status, form_data, admin_notes, submitted_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        newOrgId,
        newUserId,
        enrollment.child_name   || 'Unknown',
        enrollment.status       || 'draft',
        formDataStr,
        enrollment.admin_notes  || null,
        enrollment.submitted_at || null,
        enrollment.created_at   || new Date().toISOString(),
        enrollment.updated_at   || new Date().toISOString(),
      );
    }

    db.exec('COMMIT');
    result = { newOrgId, tempPassword, adminEmail, skipped };
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('[superadmin] Import failed:', err);
    return res.status(500).json({ error: 'Import failed: ' + err.message });
  }

  const newOrg = db.prepare('SELECT * FROM organizations WHERE id = ?').get(result.newOrgId);

  console.log(
    `[superadmin] Org "${newOrg.name}" (id=${newOrg.id}) reinstated by ${req.user.email} ` +
    `— ${bundle.users.length} users, ${bundle.enrollments.length} enrollments` +
    (result.skipped ? `, ${result.skipped} enrollments skipped (missing user)` : '')
  );

  res.status(201).json({
    org:           newOrg,
    admin_email:   result.adminEmail,
    temp_password: result.tempPassword,
    imported: {
      users:       bundle.users.length,
      enrollments: bundle.enrollments.length - result.skipped,
      skipped:     result.skipped,
    },
    note: 'All admin accounts use the temp_password shown. Parent accounts require a password reset. Send the temp password to the daycare admin so they can log in and change it.',
  });
});

// Delete an org and all associated data (cascade via FK)
router.delete('/orgs/:id', (req, res) => {
  const { confirm_name } = req.body;
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
  if (!org) return res.status(404).json({ error: 'Organization not found' });

  // Require the caller to confirm by passing the exact org name
  if (!confirm_name || confirm_name.trim() !== org.name.trim()) {
    return res.status(400).json({
      error: `Confirmation name does not match. Expected: "${org.name}"`,
    });
  }

  // Prevent deleting the default platform org
  if (org.slug === 'default') {
    return res.status(403).json({ error: 'The default organization cannot be deleted.' });
  }

  // Foreign key cascade handles users + enrollments
  db.prepare('DELETE FROM organizations WHERE id = ?').run(org.id);

  console.log(`[superadmin] Org #${org.id} "${org.name}" deleted by ${req.user.email}`);
  res.json({ success: true, deleted: { id: org.id, name: org.name, slug: org.slug } });
});

// Platform-wide stats
router.get('/stats', (req, res) => {
  res.json({
    orgs:        db.prepare("SELECT COUNT(*) AS n FROM organizations").get().n,
    active_orgs: db.prepare("SELECT COUNT(*) AS n FROM organizations WHERE plan != 'inactive'").get().n,
    users:       db.prepare("SELECT COUNT(*) AS n FROM users WHERE role = 'parent'").get().n,
    enrollments: db.prepare("SELECT COUNT(*) AS n FROM enrollments").get().n,
    submitted:   db.prepare("SELECT COUNT(*) AS n FROM enrollments WHERE status = 'submitted'").get().n,
    approved:    db.prepare("SELECT COUNT(*) AS n FROM enrollments WHERE status = 'approved'").get().n,
  });
});

module.exports = router;
