# Daycare Enrollment App — Quick Start

## Requirements
- Node.js 22+ (uses built-in `node:sqlite`)

## 1. Start the Backend API
```bash
cd backend
npm install
npm run dev          # development (auto-restart)
# or
npm start            # production
```
API runs at **http://localhost:3007**

Default admin login: `admin@daycare.com` / `Admin1234!`

## 2. Start the Frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
App runs at **http://localhost:5173**

## Roles

| Role | Login | Access |
|------|-------|--------|
| Parent | Register at `/register` | Own enrollments only |
| Staff/Admin | `admin@daycare.com` / `Admin1234!` | All submissions, status changes, print |

## Workflow
1. Parent registers and logs in
2. Fills out the 5-step Texas Form 2935 online
3. Saves progress at any step (auto-saves on "Continue")
4. Reviews and submits the form
5. Admin logs in → Dashboard → clicks "Review →"
6. Admin marks as **Printed**, prints the form (Print / Download PDF)
7. Parent visits daycare and physically signs the printed form
8. Admin marks as **Signed** → **Approved**

## Changing the Admin Password
Log into the DB directly or add a `/change-password` endpoint.
The DB file is stored at `backend/data/enrollment.db`.
