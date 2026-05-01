# EnrollPack — CLAUDE.md

> Context file for AI-assisted development. Keep this up to date as the project evolves.

---

## Project Overview

**EnrollPack** is a multi-tenant SaaS platform for Texas licensed daycare operations. It replaces paper-based enrollment packets with a branded online portal where parents complete **Texas HHSC Form 2935** digitally. Each daycare gets its own subdomain portal; admins review, print, and approve submissions from a dashboard.

**Plans:** Trial (free, 30 days, 5 enrollments), Starter ($19/mo), Pro ($49/mo)

---

## Architecture

```
monorepo/
├── backend/          Express API + SQLite database
└── frontend/         React + Vite SPA
```

### Multi-Tenant Subdomain Routing

- Root domain (e.g. `enrollpack.com`) → **Platform Landing** + org signup
- Daycare subdomain (e.g. `sunshine.enrollpack.com`) → **Daycare Portal** (parent enrollment + staff login)
- The `isRootDomain()` helper in `App.jsx` detects which context is active:
  ```js
  hostname === appDomain || hostname === `www.${appDomain}`
  ```
- OrgContext fetches `/api/org` on mount to load the current tenant's settings.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router v6, Tailwind CSS |
| Backend | Node.js, Express |
| Database | SQLite via **`node:sqlite` (`DatabaseSync`)** — NOT `better-sqlite3` |
| Auth | JWT (jsonwebtoken), bcryptjs |
| Email | Resend |
| SMS | Twilio (Pro plan only) |
| Deployment | Railway (backend serves built frontend from `backend/public/`) |

### Critical SQLite Note

The project uses **Node.js built-in `node:sqlite` (`DatabaseSync`)**. This does **not** have `db.transaction()` like `better-sqlite3`. Always use manual transactions:

```js
try {
  db.exec('BEGIN');
  // ... queries ...
  db.exec('COMMIT');
} catch (err) {
  db.exec('ROLLBACK');
  throw err;
}
```

---

## Backend

### Entry Point: `backend/server.js`

- Port: `3007` (default)
- Middleware: `helmet`, `cors` (subdomain-aware), `express-rate-limit`
  - Auth endpoints: 20 req / 15 min
  - General API: 120 req / min
- In production: serves built frontend from `backend/public/`

### Database: `backend/database.js`

SQLite file at `backend/data/enrollment.db`. Migrations tracked in `schema_migrations` table.

| Migration | Change |
|---|---|
| 1 | Multi-tenant schema — `organizations`, `users` (with `org_id`), `enrollments` |
| 2 | Remove `growth` plan, normalize to `trial/starter/pro/inactive` |
| 3 | Rename default org to "EnrollPack" |
| 4 | Add `trial_ends_at` to organizations |
| 5 | Email verification — `email_verified`, `verification_token`, `verification_token_expires_at` on users |
| 6 | Password reset — `reset_token`, `reset_token_expires_at` on users |
| 7 | Force password change — `force_password_change INTEGER DEFAULT 0` on users |
| 8 | Director's name — `directors_name TEXT` on organizations |

**Always add new schema changes as a new numbered migration** — never modify existing ones.

### Database Schema Summary

```sql
organizations (id, name, slug, logo_url, primary_color, accent_color, tagline,
               plan, stripe_customer_id, stripe_subscription_id, owner_email,
               trial_ends_at, directors_name, created_at)

users (id, org_id, email, password_hash, full_name, role, phone,
       email_verified, verification_token, verification_token_expires_at,
       reset_token, reset_token_expires_at, force_password_change, created_at)
  role CHECK: 'parent' | 'admin' | 'superadmin'

enrollments (id, org_id, user_id, child_name, status, form_data, submitted_at,
             created_at, updated_at, admin_notes)
  status CHECK: 'draft' | 'submitted' | 'printed' | 'signed' | 'approved' | 'needs_correction'
  form_data: JSON blob (the full Texas Form 2935 data)
```

**Default seeds** (created on first boot if missing):
- `admin@daycare.com` / `Admin1234!` — org admin for the default org
- `superadmin@platform.com` / `SuperAdmin1234!` — platform superadmin

Override with env vars `DEFAULT_ADMIN_EMAIL`, `DEFAULT_ADMIN_PASSWORD`, `SUPERADMIN_EMAIL`, `SUPERADMIN_PASSWORD`.

### API Routes

All routes prefixed with `/api`.

#### `/api/org` — `routes/org.js`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/org` | — | Get current tenant org settings |
| PATCH | `/org` | admin | Update org settings (name, tagline, logo_url, colors, directors_name) |

#### `/api/auth` — `routes/auth.js`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Parent self-registration + sends verification email |
| POST | `/auth/login` | — | Login; returns JWT + user with `force_password_change` flag |
| GET | `/auth/me` | JWT | Returns current user including `force_password_change` |
| POST | `/auth/change-password` | JWT | Change password, clears `force_password_change` |
| POST | `/auth/verify-email` | — | Verify email via token |
| POST | `/auth/resend-verification` | — | Resend verification email |
| POST | `/auth/forgot-password` | — | Send password reset link |
| POST | `/auth/reset-password` | — | Reset password via token |
| POST | `/auth/superadmin-login` | — | Superadmin-only login |

**JWT payload:** `{ id, org_id, role }`

Login response always includes `force_password_change` — if `true`, frontend redirects to `/change-password` before any other route.

#### `/api/enrollments` — `routes/enrollments.js`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/enrollments` | parent | List parent's own enrollments |
| POST | `/enrollments` | parent | Create new enrollment (draft) |
| GET | `/enrollments/:id` | parent | Get enrollment (own only) |
| PUT | `/enrollments/:id` | parent | Update enrollment form data |
| POST | `/enrollments/:id/submit` | parent | Submit enrollment to daycare |
| DELETE | `/enrollments/:id` | parent | Delete draft or needs_correction enrollment |

#### `/api/admin` — `routes/admin.js`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/admin/enrollments` | admin | List all org enrollments |
| GET | `/admin/enrollments/:id` | admin | Get any enrollment in org |
| PATCH | `/admin/enrollments/:id/status` | admin | Update status (printed/signed/approved/needs_correction) + admin_notes |

#### `/api/superadmin` — `routes/superadmin.js`
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/superadmin/orgs` | superadmin | List all orgs |
| POST | `/superadmin/orgs` | superadmin | Create new org + admin user |
| PATCH | `/superadmin/orgs/:id` | superadmin | Update org fields including directors_name |
| DELETE | `/superadmin/orgs/:id` | superadmin | Delete org (requires `confirm_name` match; blocks slug=`default`) |
| GET | `/superadmin/orgs/:id/export` | superadmin | Export org bundle as JSON |
| POST | `/superadmin/orgs/import` | superadmin | Reinstate org from export bundle; generates temp password for admin; sets `force_password_change = 1` |

---

## Frontend

### Key Files

```
frontend/src/
├── App.jsx                    # Router, ProtectedRoute, isRootDomain()
├── api/client.js              # Axios instance (attaches JWT from localStorage)
├── contexts/
│   ├── AuthContext.jsx        # User state, login/logout, updateUser()
│   └── OrgContext.jsx         # Current tenant org, loaded from /api/org
├── components/
│   ├── Navbar.jsx
│   ├── Footer.jsx             # Shared footer (Privacy/Terms/Contact links)
│   └── StatusBadge.jsx
└── pages/
    ├── Landing.jsx            # Daycare subdomain landing (parent-facing)
    ├── PlatformLanding.jsx    # Root domain landing (B2B marketing + pricing)
    ├── Login.jsx
    ├── Register.jsx
    ├── VerifyEmail.jsx
    ├── ForgotPassword.jsx
    ├── ResetPassword.jsx
    ├── ChangePassword.jsx     # Forced password change on first login
    ├── ParentDashboard.jsx    # Parent's enrollment list + delete + new enrollment
    ├── EnrollmentForm/        # Multi-step Texas Form 2935
    │   ├── index.jsx          # Form shell, step nav, save/auto-populate logic
    │   ├── formDefaults.js    # DEFAULT_FORM shape
    │   ├── Step1_ChildFamily.jsx   # Child info, parent info, emergency contact, pickup
    │   ├── Step2_Consents.jsx
    │   ├── Step3_HealthNeeds.jsx
    │   ├── Step4_Emergency.jsx     # Medical authorization, exclusions, admission
    │   └── Step5_Vaccines.jsx
    ├── ReviewSubmit.jsx       # Read-only review + submit button
    ├── PrintView.jsx          # Print-formatted Texas Form 2935
    ├── AdminDashboard.jsx     # Staff enrollment queue
    ├── AdminFormReview.jsx    # Staff form detail + status actions
    ├── OrgSettings.jsx        # Admin org settings (name, logo, colors, directors_name)
    ├── SuperAdminLogin.jsx    # Platform superadmin login (served at /admin on root domain)
    ├── SuperAdminDashboard.jsx # Platform org management
    ├── OrgSignup.jsx          # New daycare signup (root domain only)
    ├── Help.jsx               # Help & instructions (parents + staff + plans + FAQ)
    ├── Privacy.jsx            # Privacy Policy
    └── Terms.jsx              # Terms of Service
```

### Routing Logic (`App.jsx`)

React Router v6 — **first matching route wins**. Key rules:
- `/` → `PlatformLanding` (root domain) or `Landing` (subdomain)
- `/admin` → `SuperAdminLogin` (root domain) or `AdminDashboard` (subdomain, protected)
- `/signup` → `OrgSignup` (root domain only)
- `/login`, `/register`, `/forgot-password`, `/reset-password` → subdomain only

`ProtectedRoute` accepts a `role` prop and a `skipForceCheck` prop:
- If `user.force_password_change` is true and `skipForceCheck` is not set → redirects to `/change-password`
- If `role` is set and user doesn't match → redirects to their home page

### Auth Context (`contexts/AuthContext.jsx`)

```js
const { user, login, logout, updateUser, loading } = useAuth();
```

`updateUser(partialObject)` — merges updates into user state AND localStorage. Used after forced password change to clear the flag without requiring a full re-login.

### Org Context (`contexts/OrgContext.jsx`)

```js
const { org, loading } = useOrg();
```

`org` initializes with defaults (`name: 'EnrollPack'`, etc.) before the API call returns. Always check `loading` before using `org` values for anything that needs real data (e.g., auto-populating form fields).

---

## Enrollment Form

### Flow

1. Parent clicks "+ New Enrollment" on dashboard → navigates to `/enrollment/new` (no ID yet)
2. Enrollment is created in the DB on the **first save** (not upfront)
3. Steps 1–5 auto-save on "Save & Continue"; "Save for Later" saves and goes to dashboard
4. After Step 5 → "Review & Submit" page → parent clicks Submit
5. Staff sees it as `submitted` → marks `printed` → parent visits to sign → `signed` → `approved`

### Auto-Population (Step 1)

`index.jsx` seeds Operation Name and Director's Name from OrgContext **once**, when org finishes loading, and only for new enrollments (no `id` param):

```js
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
}, [orgLoading]);
```

### Step-Level Validation

`validateStep(stepIndex)` in `index.jsx` runs before advancing to the next step.

**Step 1 checks:**
- Emergency contact **name** must not match parent/guardian name (case-insensitive)
- Emergency contact **phone** must not match any of: Parent 1 Phone, Parent 2 Phone, Guardian Phone (digits-only comparison, format-agnostic)

Errors are passed as `errors` prop to `Step1`, which renders them in a red banner above the Emergency Contact section and highlights the conflicting fields with a red border. Errors clear on any field edit.

### Enrollment Deletion

Parents can delete enrollments with status `draft` or `needs_correction` from the dashboard. A two-step inline confirm UX prevents accidents. `submitted` and beyond cannot be deleted by the parent — they must contact staff.

---

## Staff Workflow

```
Submitted → Printed → Signed → Approved
```

- **Request Correction** can be used at any point before approval; sends the form back to the parent (status → `needs_correction`); parent is notified by email (and SMS on Pro plan).
- Status transitions are done by admin via `PATCH /api/admin/enrollments/:id/status`.

---

## Org Reinstatement (Import/Export)

Superadmins can export any org as a JSON bundle and re-import it later (e.g., after deletion or to migrate).

On import:
- A new org row is inserted with a new ID
- All users are re-inserted; the admin user gets a random 12-char hex **temp password** and `force_password_change = 1`
- All enrollments are re-inserted with remapped user IDs
- Old user IDs in the export are remapped to new IDs during insert

The temp password is shown once in the UI with a copy button. On first login with the temp password, the admin is forced to set a new password before accessing the dashboard.

---

## Environment Variables

### Backend

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | API port (default: 3007) |
| `NODE_ENV` | No | Set to `production` for prod mode |
| `JWT_SECRET` | **Yes (prod)** | Secret for signing JWTs |
| `APP_DOMAIN` | **Yes (prod)** | Root domain, e.g. `enrollpack.com` |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins |
| `DEFAULT_ADMIN_EMAIL` | Yes (prod) | Default org admin email |
| `DEFAULT_ADMIN_PASSWORD` | Yes (prod) | Default org admin password |
| `SUPERADMIN_EMAIL` | Yes (prod) | Platform superadmin email |
| `SUPERADMIN_PASSWORD` | Yes (prod) | Platform superadmin password |
| `RESEND_API_KEY` | No | Email sending via Resend |
| `RESEND_FROM` | No | Sender address for emails |
| `TWILIO_ACCOUNT_SID` | No | SMS (Pro plan) |
| `TWILIO_AUTH_TOKEN` | No | SMS (Pro plan) |
| `TWILIO_FROM` | No | Twilio sender number |

### Frontend

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL |
| `VITE_APP_DOMAIN` | Root domain (used by `isRootDomain()` and portal finder) |

---

## Common Gotchas

1. **`node:sqlite` has no `.transaction()` helper** — always use `db.exec('BEGIN')` / `COMMIT` / `ROLLBACK` manually in a try/catch.

2. **React Router v6 — first route wins** — never define two `<Route path="/admin">` entries. Merge them into one with conditional rendering based on `isRootDomain()`.

3. **OrgContext initializes with defaults** — `org.name` is `'EnrollPack'` before the API returns. For auto-population logic, depend on `orgLoading` (the boolean), not on specific `org` field values.

4. **Enrollment creation is lazy** — the enrollment row is created on first save, not when the parent clicks "+ New Enrollment". The URL changes from `/enrollment/new` to `/enrollment/:id/edit` after the first save.

5. **`force_password_change` must be in every login/me response** — if it's missing, the forced redirect won't fire and the user will appear to log in normally.

6. **Backend restart required for migrations** — SQLite migrations run at startup. After adding a new migration, restart the backend process for it to apply.

7. **Phone comparison is format-agnostic** — strip all non-digits before comparing phone numbers (e.g. `(555) 123-4567` == `5551234567`).

---

## Development

```bash
# Backend
cd backend
npm install
node server.js          # or: npx nodemon server.js

# Frontend
cd frontend
npm install
npm run dev             # Vite dev server on :5173 (or :5174)
```

Build for production:
```bash
cd frontend && npm run build
# copy dist/ → backend/public/
cp -r dist/* ../backend/public/
```

The backend serves `backend/public/` as static files in production, so all requests fall through to `index.html` for client-side routing.
