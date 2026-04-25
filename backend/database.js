const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'enrollment.db'));

db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = OFF'); // Off during migrations, re-enabled after

// ─── Migration tracker ────────────────────────────────────────────────────────
db.exec(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version    INTEGER PRIMARY KEY,
    applied_at TEXT DEFAULT (datetime('now'))
  )
`);
const schemaVersion = () =>
  db.prepare('SELECT COALESCE(MAX(version), 0) AS v FROM schema_migrations').get().v;

// ─── Migration 1: Multi-tenant schema ────────────────────────────────────────
if (schemaVersion() < 1) {
  // Detect whether this is a fresh install or an existing single-tenant DB
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all().map(r => r.name);
  const hasUsers = tables.includes('users');
  const userCols = hasUsers
    ? db.prepare("PRAGMA table_info('users')").all().map(c => c.name)
    : [];
  const alreadyMultiTenant = userCols.includes('org_id');

  // 1a. Create organizations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      name                   TEXT NOT NULL,
      slug                   TEXT NOT NULL UNIQUE,
      logo_url               TEXT,
      primary_color          TEXT NOT NULL DEFAULT '#f97316',
      accent_color           TEXT NOT NULL DEFAULT '#1f2937',
      tagline                TEXT,
      plan                   TEXT NOT NULL DEFAULT 'trial'
                                 CHECK(plan IN ('trial','starter','pro','inactive')),
      stripe_customer_id     TEXT,
      stripe_subscription_id TEXT,
      owner_email            TEXT,
      created_at             TEXT DEFAULT (datetime('now'))
    )
  `);

  // 1b. Seed the default org so id=1 is always the original daycare
  db.prepare(`
    INSERT OR IGNORE INTO organizations (id, name, slug, tagline, owner_email)
    VALUES (1, 'EnrollPack', 'default', 'Daycare enrollment, simplified.', 'admin@daycare.com')
  `).run();

  if (hasUsers && !alreadyMultiTenant) {
    // Existing single-tenant install — migrate data into new schema
    db.exec(`
      CREATE TABLE users_new (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        org_id        INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        email         TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        full_name     TEXT NOT NULL,
        role          TEXT NOT NULL CHECK(role IN ('parent','admin','superadmin')),
        phone         TEXT,
        created_at    TEXT DEFAULT (datetime('now')),
        UNIQUE(org_id, email)
      );
      INSERT INTO users_new (id, org_id, email, password_hash, full_name, role, phone, created_at)
        SELECT id, 1, email, password_hash, full_name, role, phone, created_at FROM users;
      DROP TABLE users;
      ALTER TABLE users_new RENAME TO users;

      CREATE TABLE enrollments_new (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        org_id       INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        child_name   TEXT,
        status       TEXT NOT NULL DEFAULT 'draft'
                         CHECK(status IN ('draft','submitted','printed','signed','approved','needs_correction')),
        form_data    TEXT NOT NULL DEFAULT '{}',
        submitted_at TEXT,
        created_at   TEXT DEFAULT (datetime('now')),
        updated_at   TEXT DEFAULT (datetime('now')),
        admin_notes  TEXT
      );
      INSERT INTO enrollments_new (id, org_id, user_id, child_name, status, form_data, submitted_at, created_at, updated_at, admin_notes)
        SELECT id, 1, user_id, child_name, status, form_data, submitted_at, created_at, updated_at, admin_notes FROM enrollments;
      DROP TABLE enrollments;
      ALTER TABLE enrollments_new RENAME TO enrollments;
    `);
  } else if (!hasUsers) {
    // Fresh install — create tables from scratch
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        org_id        INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
        email         TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        full_name     TEXT NOT NULL,
        role          TEXT NOT NULL CHECK(role IN ('parent','admin','superadmin')),
        phone         TEXT,
        created_at    TEXT DEFAULT (datetime('now')),
        UNIQUE(org_id, email)
      );

      CREATE TABLE IF NOT EXISTS enrollments (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        org_id       INTEGER NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        child_name   TEXT,
        status       TEXT NOT NULL DEFAULT 'draft'
                         CHECK(status IN ('draft','submitted','printed','signed','approved','needs_correction')),
        form_data    TEXT NOT NULL DEFAULT '{}',
        submitted_at TEXT,
        created_at   TEXT DEFAULT (datetime('now')),
        updated_at   TEXT DEFAULT (datetime('now')),
        admin_notes  TEXT
      );
    `);
  }

  db.prepare('INSERT INTO schema_migrations (version) VALUES (1)').run();
}

// ─── Migration 2: Merge 'growth' plan into 'pro' ─────────────────────────────
if (schemaVersion() < 2) {
  // Promote any existing growth orgs to pro
  db.exec("UPDATE organizations SET plan = 'pro' WHERE plan = 'growth'");

  // Rebuild organizations table without 'growth' in the CHECK constraint
  db.exec(`
    CREATE TABLE organizations_new (
      id                     INTEGER PRIMARY KEY AUTOINCREMENT,
      name                   TEXT NOT NULL,
      slug                   TEXT NOT NULL UNIQUE,
      logo_url               TEXT,
      primary_color          TEXT NOT NULL DEFAULT '#f97316',
      accent_color           TEXT NOT NULL DEFAULT '#1f2937',
      tagline                TEXT,
      plan                   TEXT NOT NULL DEFAULT 'trial'
                                 CHECK(plan IN ('trial','starter','pro','inactive')),
      stripe_customer_id     TEXT,
      stripe_subscription_id TEXT,
      owner_email            TEXT,
      created_at             TEXT DEFAULT (datetime('now'))
    );
    INSERT INTO organizations_new SELECT * FROM organizations;
    DROP TABLE organizations;
    ALTER TABLE organizations_new RENAME TO organizations;
  `);

  db.prepare('INSERT INTO schema_migrations (version) VALUES (2)').run();
}

// ─── Migration 3: Rename default org to EnrollPack ───────────────────────────
if (schemaVersion() < 3) {
  db.exec(`
    UPDATE organizations
    SET name    = 'EnrollPack',
        tagline = 'Daycare enrollment, simplified.'
    WHERE slug = 'default' AND name = 'Little Stars Daycare'
  `);
  db.prepare('INSERT INTO schema_migrations (version) VALUES (3)').run();
}

db.exec('PRAGMA foreign_keys = ON');

const isProd = process.env.NODE_ENV === 'production';

// ─── Seed default org admin ───────────────────────────────────────────────────
const adminExists = db.prepare(
  "SELECT id FROM users WHERE org_id = 1 AND role = 'admin' LIMIT 1"
).get();
if (!adminExists) {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL;
  const adminPass  = process.env.DEFAULT_ADMIN_PASSWORD;

  if (isProd && (!adminEmail || !adminPass)) {
    console.error('FATAL: DEFAULT_ADMIN_EMAIL and DEFAULT_ADMIN_PASSWORD must be set in production.');
    process.exit(1);
  }

  const email = adminEmail || 'admin@daycare.com';
  const pass  = adminPass  || 'Admin1234!';
  const hash  = bcrypt.hashSync(pass, 12);
  db.prepare(`
    INSERT INTO users (org_id, email, password_hash, full_name, role)
    VALUES (1, ?, ?, 'Daycare Administrator', 'admin')
  `).run(email, hash);
  console.log(`Default admin created: ${email}`);
}

// ─── Seed platform superadmin ─────────────────────────────────────────────────
const superExists = db.prepare("SELECT id FROM users WHERE role = 'superadmin' LIMIT 1").get();
if (!superExists) {
  const superEmail = process.env.SUPERADMIN_EMAIL;
  const superPass  = process.env.SUPERADMIN_PASSWORD;

  if (isProd && (!superEmail || !superPass)) {
    console.error('FATAL: SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD must be set in production.');
    process.exit(1);
  }

  const email = superEmail || 'superadmin@platform.com';
  const pass  = superPass  || 'SuperAdmin1234!';
  const hash  = bcrypt.hashSync(pass, 12);
  db.prepare(`
    INSERT INTO users (org_id, email, password_hash, full_name, role)
    VALUES (NULL, ?, ?, 'Platform Administrator', 'superadmin')
  `).run(email, hash);
  console.log(`Superadmin created: ${email}`);
}

module.exports = db;
