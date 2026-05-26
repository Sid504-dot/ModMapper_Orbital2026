# ModMapper

> A collaborative timetable planner for NUS students. Search modules, build conflict-free schedules, track your S/U allowance, and sync plans with friends in real time.

**Live app:** [modmapper.vercel.app](https://modmapper.vercel.app/login)  
**Backend:** [modmapperorbital2026-production.up.railway.app](https://modmapperorbital2026-production.up.railway.app/health)

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Repository Structure](#repository-structure)
4. [Getting Started](#getting-started)
5. [Database Schema](#database-schema)
6. [Backend — Authentication](#backend--authentication)
7. [Backend — Module Search & Cache](#backend--module-search--cache)
8. [Backend — Module Refresh & Cron Scheduler](#backend--module-refresh--cron-scheduler)
9. [Backend — Timetable](#backend--timetable)
10. [Backend — S/U Optimizer](#backend--su-optimizer)
11. [Frontend — Pages](#frontend--pages)
12. [Testing](#testing)
13. [CI Pipeline](#ci-pipeline)
14. [Deployment](#deployment)
15. [Upcoming Features](#upcoming-features)

---

## Project Overview

ModMapper is built for NUS students who find semester planning fragmented across too many tools — NUSMods for browsing, spreadsheets for tracking MCs, mental arithmetic for S/U decisions. The goal is a single platform that handles module discovery, timetable building, S/U optimization, and eventually AI-powered planning assistance.

The project is developed as part of **NUS CP2106 (Orbital) 2026**, targeting the **Artemis** level of achievement.

**Current implementation covers:**
- Full user authentication (register, login, forgot password) via Supabase Auth
- A NUSMods-backed module cache with automated refresh
- Timetable persistence per user
- A complete S/U Optimizer backend with academic year classification, policy lookup, and eligibility merging
- A polished React frontend with five live pages
- A Jest + Supertest test suite with 29 tests across four route files
- A GitHub Actions CI pipeline for lint checks

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, React Router v7 |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL via Supabase |
| Auth | Supabase Auth (JWT) |
| External API | NUSMods public API v2 |
| Scheduling | node-cron |
| Testing | Jest 30, Supertest |
| Linting | ESLint 10 (flat config) |
| CI | GitHub Actions |
| Backend hosting | Railway |
| Frontend hosting | Vercel |

---

## Repository Structure

```
ModMapper_Orbital2026/
├── .github/
│   └── workflows/
│       └── lint.yml              # CI: ESLint on push and PR
│
├── client/                       # React + Vite frontend (Shrishti)
│   ├── public/
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ModuleSearch.jsx
│   │   │   └── TimetableBuilder.jsx
│   │   ├── App.jsx               # Router config
│   │   ├── main.jsx              # React entry point
│   │   └── index.css
│   ├── eslint.config.js
│   ├── vite.config.js
│   └── package.json
│
└── server/                       # Express backend (Siddharth)
    ├── __tests__/
    │   └── routes/
    │       ├── auth.test.js
    │       ├── modules.test.js
    │       ├── su.test.js
    │       └── timetable.test.js
    ├── db/
    │   ├── supabase.js           # Supabase client singleton
    │   ├── modules.js            # modules table queries
    │   ├── timetable.js          # user_timetable table queries
    │   ├── userProfile.js        # user_profile table queries
    │   ├── userSuInfo.js         # user_su_info table queries
    │   └── suPolicy.js           # su_policy table queries
    ├── routes/
    │   ├── auth.js               # /auth/*
    │   ├── modules.js            # /modules
    │   ├── timetable.js          # /timetable
    │   └── su.js                 # /su/*
    ├── services/
    │   ├── nusmods.js            # NUSMods API wrapper
    │   ├── refresh.js            # Bulk module cache refresh
    │   └── cron.js               # Scheduled refresh jobs
    ├── eslint.config.js
    ├── index.js                  # Express entry point
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- A Supabase project (free tier is sufficient)
- The five Supabase tables described in [Database Schema](#database-schema)

### Clone

```bash
git clone https://github.com/Sid504-dot/ModMapper_Orbital2026.git
cd ModMapper_Orbital2026
```

### Backend Setup

```bash
cd server
npm install
```

Create `server/.env`:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
PORT=3000
```

> **Why the service role key?** The backend validates each request's JWT itself using `supabase.auth.getUser(token)`. After that validation, it needs to read and write rows on behalf of arbitrary users, which requires the service role key to bypass Supabase's row-level security. The anon key would be blocked by RLS policies. Keep this key server-side only — never expose it to the client.

Start the server:

```bash
node index.js
```

The server starts on port 3000. On startup it immediately triggers a full NUSMods module cache refresh (this is expected and logged). Verify the server is healthy:

```bash
curl http://localhost:3000/health
# → { "status": "ok" }

curl http://localhost:3000/test-supabase
# → { "message": "Supabase connected successfully", ... }
```

### Frontend Setup

Open a new terminal from the project root:

```bash
cd client
npm install
```

Create `client/.env`:

```env
VITE_API_URL=https://modmapperorbital2026-production.up.railway.app
```

Start the dev server:

```bash
npm run dev
```

App runs at `http://localhost:5173`.

### Running Tests

```bash
cd server
npm test
```

Jest discovers all files matching `__tests__/**/*.test.js` and runs them with mocked Supabase — no live database connection required.

---

## Database Schema

Five tables are currently in use in the Supabase project. All user-specific tables use `user_id` as the primary key, which maps to Supabase Auth's `auth.users.id` UUID.

### `modules`

Caches module data fetched from the NUSMods API. Acts as the source of truth for module search and S/U eligibility checks.

| Column | Type | Notes |
|---|---|---|
| `module_code` | `text` | Primary key (e.g. `CS1101S`) |
| `module_name` | `text` | Full title |
| `semesters` | `jsonb` | Full `semesterData` array from NUSMods |
| `cached_at` | `timestamptz` | Last refresh timestamp |
| `is_su_eligible` | `boolean` | Sourced from `attributes.su` in NUSMods |

### `user_timetable`

Stores each user's saved timetable as a single JSON blob. One row per user.

| Column | Type | Notes |
|---|---|---|
| `user_id` | `uuid` | Primary key, FK to `auth.users` |
| `timetable_data` | `jsonb` | `{ addedModules: [...], selectedSlots: {...} }` |

### `user_profile`

Stores academic profile data needed for S/U year classification.

| Column | Type | Notes |
|---|---|---|
| `user_id` | `uuid` | Primary key, FK to `auth.users` |
| `matric_year` | `integer` | Year the student matriculated (e.g. `2024`) |

### `user_su_info`

Tracks the user's personal S/U allowance usage.

| Column | Type | Notes |
|---|---|---|
| `user_id` | `uuid` | Primary key, FK to `auth.users` |
| `total_su` | `integer` | Total S/U units available to the user |
| `used_su` | `integer` | S/U units already consumed |

### `su_policy`

Stores NUS S/U policy rules per admission cohort. Populated manually and updated when NUS revises its policy.

| Column | Type | Notes |
|---|---|---|
| `cohort_start_year` | `integer` | Primary key (= `matric_year`) |
| `total_su` | `integer` | Total S/U units for this cohort |
| `y1y2_cap` | `integer` | Maximum usable in Years 1–2 |
| `y3y4_cap` | `integer` | Maximum usable in Years 3–4 |

---

## Backend — Authentication

**Router file:** `server/routes/auth.js`  
**Mounted at:** `/auth`

All three auth flows are fully implemented and tested. Authentication is handled entirely through Supabase Auth — the backend does not manage passwords or sessions directly.

---

### `POST /auth/register`

**Purpose:** Create a new user account.

**Request body:**
```json
{ "email": "e0123456@u.nus.edu", "password": "yourpassword" }
```

**Validation:** Returns `400` immediately if either `email` or `password` is missing, before touching Supabase.

**Flow:**
1. Validates request body.
2. Calls `supabase.auth.signUp({ email, password })`.
3. On success, returns `201` with `{ message, data }`.
4. On Supabase error (e.g. email already registered), returns `400` with the Supabase error message.

**Response (success):**
```json
{
  "message": "User registered successfully",
  "data": { "user": { "id": "...", "email": "..." }, "session": null }
}
```

> Email confirmation is disabled in the Supabase project settings for development. Users are immediately active after registration.

---

### `POST /auth/login`

**Purpose:** Authenticate an existing user and return a JWT.

**Request body:**
```json
{ "email": "e0123456@u.nus.edu", "password": "yourpassword" }
```

**Validation:** Returns `400` if either field is missing.

**Flow:**
1. Validates request body.
2. Calls `supabase.auth.signInWithPassword({ email, password })`.
3. On success, extracts `data.session.access_token` and returns it.
4. On Supabase error (wrong credentials, user not found), returns `400`.

**Response (success):**
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

The client stores this token in `localStorage` under the key `token`. All subsequent authenticated requests send it as `Authorization: Bearer <token>`.

---

### `POST /auth/forgot-password`

**Purpose:** Send a password reset email.

**Request body:**
```json
{ "email": "e0123456@u.nus.edu" }
```

**Flow:**
1. Validates that `email` is present.
2. Calls `supabase.auth.resetPasswordForEmail(email)`.
3. Returns the same success message regardless of whether the email exists in the system.

**Response:**
```json
{ "message": "If this email is registered, a reset link has been sent." }
```

The deliberately ambiguous message is a security measure to prevent user enumeration — an attacker cannot use this endpoint to discover which email addresses are registered.

---

### Auth Guard Pattern

Every protected route in the backend follows this pattern before executing business logic:

```
Authorization: Bearer <token>   →   token extracted from header
                                →   supabase.auth.getUser(token)
                                →   user.id extracted as userID
                                →   proceed with handler
```

If the header is missing, `split(' ')[1]` throws a `TypeError` which Express catches as a 500. If `getUser` fails or returns no user, a `401` is returned. This is a known PoC-level pattern — proper middleware extraction is planned.

---

## Backend — Module Search & Cache

**Router file:** `server/routes/modules.js`  
**DB layer:** `server/db/modules.js`  
**NUSMods wrapper:** `server/services/nusmods.js`  
**Mounted at:** `/modules`

---

### `GET /modules?module_code=<code>`

**Purpose:** Return full module data for a given module code.

**Query parameter:** `module_code` (e.g. `CS3230`, `GEA1000`)

**Flow (cache-first):**

```
Request arrives
     │
     ▼
Query modules table WHERE module_code = ?
     │
     ├── Found → return cached record immediately
     │
     └── Not found
              │
              ▼
         Fetch from NUSMods API
              │
              ▼
         Upsert into modules table
         (module_code, module_name, semesters, cached_at, is_su_eligible)
              │
              ▼
         Return fresh NUSMods data
```

**DB functions used:**

```js
// db/modules.js

getModuleByCode(moduleCode)
// → supabase.from('modules').select().eq('module_code', moduleCode)

upsertModule(moduleData)
// → supabase.from('modules').upsert(moduleData, { onConflict: 'module_code' })

getAllModules()
// → supabase.from('modules').select()

getSuAbleModulesByCodes(moduleCodes)
// → supabase.from('modules')
//     .select('module_code, is_su_eligible')
//     .in('module_code', moduleCodes)
```

---

### NUSMods API Wrapper — `services/nusmods.js`

Two functions handle all NUSMods communication.

**`moduleGetData(moduleCode)`**

Fetches full module data for one module code. Uses a two-attempt strategy for academic year transitions:

```
Try: api.nusmods.com/v2/{year}-{year+1}/modules/{code}.json
     │
     ├── OK  → return JSON
     │
     └── Error (404, network failure)
              │
              ▼
         api.nusmods.com/v2/{year-1}-{year}/modules/{code}.json
              │
              └── return JSON (or throw if this also fails)
```

This means in July when the upcoming AY's data is still being populated, the service tries next year first and falls back to the current year. The cache stays current across the annual module data migration without any manual intervention.

**`getAllModules()`**

Fetches the full flat module list (`moduleList.json`) — an array of `{ moduleCode, title }` objects. Uses the same two-attempt AY strategy. Used by the bulk refresh service to discover all module codes.

---

## Backend — Module Refresh & Cron Scheduler

**Refresh service:** `server/services/refresh.js`  
**Cron service:** `server/services/cron.js`

This subsystem keeps the `modules` table up to date with NUSMods data without hammering their API. It runs automatically in the background.

---

### `services/refresh.js` — Bulk Cache Refresh

**`refreshModules()`** performs a full incremental sync of all NUSMods modules into the Supabase cache.

**Algorithm:**

```
1. Fetch all modules from NUSMods  →  [{ moduleCode, title }, ...]
2. Fetch all existing rows from modules table
3. Build Map<moduleCode, existingRow> for O(1) lookups
4. For each module in NUSMods list:
     a. Fetch full module data (moduleGetData)
     b. Check if module exists in DB Map
        ├── Exists + data changed (module_name or semesters differ)
        │     → upsertModule with new data + fresh cached_at + is_su_eligible
        ├── Exists + data unchanged
        │     → upsertModule with existing data but fresh cached_at + is_su_eligible
        └── Does not exist
              → upsertModule with all fields
5. Process in batches of 10 (parallel within batch)
6. 1000ms delay between batches
```

**Why batch + delay?** NUSMods is a public API with no published rate limit. Fetching all modules sequentially would take hours; fetching all in parallel risks getting blocked. Ten parallel requests with a one-second pause is a reasonable middle ground that completes a full refresh in roughly 10–15 minutes.

**`is_su_eligible` handling:** The flag is always written as `fullData.attributes?.su ?? null`. If NUSMods does not include the `su` attribute for a module, the field is stored as `null` rather than `false`, preserving the distinction between "definitely not S/U-able" and "eligibility unknown".

---

### `services/cron.js` — Scheduled Refresh

Uses `node-cron` and activates the moment `index.js` requires it.

**On startup:** `refreshModules()` is called immediately, unconditionally. This ensures the cache is populated even on a fresh deployment to Railway.

**Scheduled job:** Runs at `0 2 * * *` (2:00 AM daily). A refresh is triggered only when the current date falls inside one of these windows:

| Window | Dates | Reason |
|---|---|---|
| Sem 1 transition | 15 Jul – 25 Aug | NUSMods publishes new AY data; timetables update |
| Sem 2 transition | 15 Dec – 25 Jan | Same, for Semester 2 |
| Monthly pulse | 1st of any month | Routine check for mid-year corrections |

Outside these windows the cron fires but skips the refresh, keeping Railway compute usage minimal.

---

## Backend — Timetable

**Router file:** `server/routes/timetable.js`  
**DB layer:** `server/db/timetable.js`  
**Mounted at:** `/timetable`

The timetable is stored as a single JSON blob per user. This avoids a complex relational schema for lesson slots at the PoC stage — the entire frontend state (`addedModules` and `selectedSlots`) is serialized and stored, then deserialized on load.

---

### `GET /timetable` (auth required)

**Purpose:** Retrieve the authenticated user's saved timetable.

**Flow:**
1. Extract and validate JWT.
2. Call `timetableDB.getTimetableByUserID(userID)`.
3. Return the result array. If the user has no saved timetable, returns an empty array (not a 404).

**DB function:**
```js
getTimetableByUserID(userID)
// → supabase.from('user_timetable').select().eq('user_id', userID)
```

**Response example:**
```json
[
  {
    "user_id": "abc-123",
    "timetable_data": {
      "addedModules": [ { "moduleCode": "CS3230", "semesterData": [...] } ],
      "selectedSlots": { "CS3230": { "Lecture": "1", "Tutorial": "3" } }
    }
  }
]
```

---

### `POST /timetable` (auth required)

**Purpose:** Save (or overwrite) the authenticated user's timetable.

**Request body:** Any JSON object. The client sends `{ timetable_data: { addedModules, selectedSlots } }`.

**Flow:**
1. Extract and validate JWT.
2. Take the request body as `entryData`.
3. Inject `entryData.user_id = userID` (from the validated JWT — the client cannot spoof whose timetable it writes).
4. Call `timetableDB.upsertTimetableEntry(entryData)`.
5. Return the upserted record.

**DB function:**
```js
upsertTimetableEntry(entryData)
// → supabase.from('user_timetable')
//     .upsert(entryData, { onConflict: 'user_id' })
//     .select()
```

`onConflict: 'user_id'` means this is always an upsert — insert on first save, replace on all subsequent saves. Each user has exactly one timetable row.

---

## Backend — S/U Optimizer

**Router file:** `server/routes/su.js`  
**DB layers:** `db/userProfile.js`, `db/userSuInfo.js`, `db/suPolicy.js`, `db/modules.js`, `db/timetable.js`  
**Mounted at:** `/su`

The S/U Optimizer is the primary feature added on this branch. It gives students a complete picture of their S/U situation: how many units remain, which of their current modules are eligible, and what the NUS policy caps are for their year group.

---

### `GET /su` (auth required)

**Purpose:** Return a complete S/U dashboard payload for the authenticated user.

This is the most complex endpoint in the codebase. It makes five sequential database calls and performs academic year classification before assembling the response.

**Academic Year Classification:**

The `matric_year` from `user_profile` is compared against the current calendar year and month to determine which academic year the student is in:

```
temp = currentYear - matricYear

temp === 0                    → Year 1
temp === 1, month < July      → Year 1  (still in first year, pre-August)
temp === 1, month >= July     → Year 2
temp === 2, month < July      → Year 2
temp === 2, month >= July     → Year 3
temp === 3, month < July      → Year 3
temp === 3, month >= July     → Year 4
temp >= 4                     → Year 4  (capped)
```

July is used as the boundary because NUS academic years start in August. A student who matriculated in 2025 is still in Year 1 in May 2026 (month 5 < 7), but transitions to Year 2 in August 2026 (month 8 ≥ 7).

`whichYear` ≤ 2  →  `currentGroup = 'y1y2'`,  `groupCap = suPolicy.y1y2_cap`  
`whichYear` ≥ 3  →  `currentGroup = 'y3y4'`,  `groupCap = suPolicy.y3y4_cap`

**Full flow:**

```
1. Validate JWT → extract userID
2. getUserProfile(userID)           → matric_year
3. Compute whichYear + currentGroup
4. getSuPolicy(matric_year)         → total_su, y1y2_cap, y3y4_cap
5. getSuInfo(userID)                → used_su, total_su
   (if null → used_su=0, total_su from policy)
6. getTimetableByUserID(userID)     → timetable entries → extract module_codes[]
7. getSuAbleModulesByCodes(codes)   → [{ module_code, is_su_eligible }, ...]
8. Merge is_su_eligible into each timetable entry
   (absent from DB cache → is_su_eligible: null)
9. Assemble and return response
```

**Response shape:**
```json
{
  "group_remaining": 16,
  "suPolicy": {
    "cohort_start_year": 2025,
    "total_su": 32,
    "y1y2_cap": 20,
    "y3y4_cap": 12
  },
  "timetable": [ { "module_code": "CS1101S", ... } ],
  "userSuInfo": { "total_su": 32, "used_su": 4 },
  "groupCap": 20,
  "currentGroup": "y1y2",
  "usedSu": 4,
  "totalSu": 32,
  "modules": [
    { "module_code": "CS1101S", "module_name": "...", "is_su_eligible": true },
    { "module_code": "GEA1000", "module_name": "...", "is_su_eligible": null }
  ]
}
```

`group_remaining` = `groupCap - usedSu`. This is the key number the frontend will surface to the user.

---

### `POST /su/userProfile` (auth required)

**Purpose:** Set or update the user's matric year. Required first-time setup before `GET /su` can classify the student correctly.

**Request body:**
```json
{ "matricYear": 2025 }
```

**Validation:** Returns `400` if `matricYear` is absent.

**DB function:**
```js
upsertUserProfile(userID, matricYear)
// → supabase.from('user_profile')
//     .upsert({ user_id: userID, matric_year: matricYear }, { onConflict: 'user_id' })
//     .select()
```

**Response:**
```json
{
  "message": "User profile updated successfully",
  "userProfile": [{ "user_id": "...", "matric_year": 2025 }]
}
```

---

### `POST /su/info` (auth required)

**Purpose:** Record the user's current S/U usage. Intended for students who have already used some S/U units from a previous semester and want to track their remaining balance.

**Request body:**
```json
{ "totalSu": 32, "usedSU": 8 }
```

**Validation:** Both fields must be present. Explicitly allows `usedSU: 0` — a falsy but valid value meaning the student has not used any S/U units yet. The check uses `=== undefined` rather than `!value` to handle this correctly.

**DB function:**
```js
upsertSuInfo(userID, totalSu, usedSu)
// → supabase.from('user_su_info')
//     .upsert({ user_id: userID, total_su: totalSu, used_su: usedSu }, { onConflict: 'user_id' })
//     .select()
```

**Response:**
```json
{
  "message": "User SU info updated successfully",
  "userSuInfo": [{ "user_id": "...", "total_su": 32, "used_su": 8 }]
}
```

---

### `POST /su/eligible` (auth required)

**Purpose:** Given a list of module codes, return which ones are S/U-eligible according to the DB cache.

**Request body:**
```json
[
  { "moduleCode": "CS1101S" },
  { "moduleCode": "GEA1000" },
  { "moduleCode": "CFG1002" }
]
```

**Flow:**
1. Validate JWT.
2. Extract `moduleCode` from each object: `req.body.map(m => m.moduleCode)`.
3. Call `moduleDB.getSuAbleModulesByCodes(userReqModules)` — a single batch `IN` query.
4. Return only modules found in the DB. Modules not yet cached are absent from the response (not an error).

**Response:**
```json
{
  "suAbleModules": [
    { "module_code": "CS1101S", "is_su_eligible": true },
    { "module_code": "GEA1000", "is_su_eligible": null }
  ]
}
```

> `CFG1002` is absent because it has not been cached yet. The frontend should treat absence as "unknown" rather than "not eligible".

---

## Frontend — Pages

**Framework:** React 19 + Vite 8  
**Router:** React Router v7  
**Deployed:** Vercel  
**Routes:** `/login`, `/register`, `/dashboard`, `/modules`, `/timetable`

All pages use a consistent inline style design system: navy `#1a2744`, terracotta `#b85c38`, off-white `#fdf8f2`, warm tan `#d4c4a8`. JetBrains Mono is used for all data labels, module codes, and timestamps.

---

### `/login` — `Login.jsx`

A two-column split layout. The left panel is a branded hero with the ModMapper wordmark, headline, and three stat counters (4 yrs full roadmap, <2 min to timetable, NUS built for you). The right panel contains the form.

**Login flow:**
1. User enters email and password.
2. `POST` to `/auth/login`.
3. On success, token stored in `localStorage('token')`, navigate to `/dashboard`.
4. On failure, error message displayed inline below the form.

**Forgot password flow:**
- Clicking "Forgot password?" switches to a separate view within the same component (no route change), managed with `useState(showForgotPassword)`.
- Submits to `POST /auth/forgot-password`.
- Displays the backend's ambiguous success message.
- "Back to login" link returns to the main form view.

---

### `/register` — `Register.jsx`

A single centered card with the ModMapper logo at the top.

**Registration flow:**
1. User enters email, password, and confirm password.
2. Client-side check: if `password !== confirmPassword`, sets error message without making a network request.
3. `POST` to `/auth/register`.
4. On success: "Registered successfully! Redirecting to login..." with a `setTimeout` navigate after 2 seconds.
5. If Supabase returns an "already registered" error: navigates directly to `/login`.
6. Other errors: displayed inline.

---

### `/dashboard` — `Dashboard.jsx`

A persistent sidebar layout. The sidebar is `position: fixed` on the left at 220px wide; the main content area has `marginLeft: 220px`.

**Sidebar sections:**
- **Plan:** Dashboard (active), Timetable, 4-Year Planner
- **Explore:** Module Search, UE Recommender, Q&A Community
- **Tools:** S/U Optimiser, Group Finder
- **Bottom:** User avatar (initials from email), email label, Sign out button

**Auth guard:** `useEffect` on mount — if no token in `localStorage`, `navigate('/login')`.

**Sign out:** Clears `localStorage('token')` and navigates to `/login`.

**Main content** currently renders static placeholder data arranged in two sections:
- Four stat cards across the top: MCs Completed, Current CAP, Semesters Left, MCs This Sem
- A two-column grid below: module list card (left) and a right column with Graduation Progress and Quick Info cards

All data in these cards is hardcoded for the PoC. Live data wiring (pulling from the timetable, S/U, and profile APIs) is planned as the features build out.

---

### `/modules` — `ModuleSearch.jsx`

A minimal search interface.

**On mount:** Fetches `https://api.nusmods.com/v2/2024-2025/moduleList.json` and stores all modules in state.

**Search:** Client-side filter by `moduleCode` or `title` (case-insensitive substring match). Displays the first 20 results.

> The backend `/modules` endpoint is used by the timetable builder for full module detail lookups. The list-level search on this page currently calls NUSMods directly. This will be redesigned when the full module search UI is built out.

---

### `/timetable` — `TimetableBuilder.jsx`

The most feature-complete page. A two-panel layout: a 280px left panel for module management, and a flex-fill right panel for the timetable grid.

#### Module Search & Add

1. User types in the search input and presses Enter or clicks SEARCH.
2. Fetches the NUSMods module list and filters client-side (same as ModuleSearch).
3. Clicking Add calls `handleAddModule(moduleCode)`:
   - Checks for duplicate — alerts and returns early if already added.
   - Fetches full module data from NUSMods for that code.
   - Finds Semester 1 data (`semesterData.find(s => s.semester === 1)`).
   - Auto-selects the first `classNo` for each `lessonType` as the default slot.
   - Adds the module to `addedModules` state and clears the search.

#### Slot Selector

For each added module, the left panel renders one `<select>` dropdown per lesson type. Lesson types are de-duplicated from the semester timetable. Options are the unique `classNo` values for that lesson type, sorted alphabetically.

Changing a dropdown fires `setSelectedSlots` with an immutable update, touching only the specific `[moduleCode][lessonType]` key.

#### Timetable Grid

The grid is rendered with pure CSS positioning — no canvas, no library.

**Time constants:**
```js
const PX_PER_MIN = 1.6     // pixels per minute
const START_HOUR = 8       // grid starts at 0800
```

**Positioning helpers:**
```js
timeToMins(t)   = parseInt(t.slice(0, 2)) * 60 + parseInt(t.slice(2, 4))
minsToTop(mins) = (mins - START_HOUR * 60) * PX_PER_MIN
```

Each lesson block: `top = minsToTop(startTime)`, `height = (endMins - startMins) * PX_PER_MIN`.

**Dynamic end hour:** `getEndHour()` iterates all selected slots to find the latest `endTime`, so the grid expands for evening classes up to 2200.

**Lane algorithm** (`getLessonsWithLanes(day)`):

Handles overlapping lessons in the same day column:

```
1. Sort lessons by startTime ascending
2. For each lesson:
   a. Try lane 0 first
   b. Check if any lesson already in lane 0 overlaps this one
      (overlap: startA < endB AND startB < endA)
   c. If conflict, try lane 1, then lane 2, etc.
   d. Assign lesson to first non-conflicting lane
3. For each lesson, count all concurrent lessons → totalLanes
4. Render:
   left  = (laneIndex / totalLanes) * 100%
   width = (1 / totalLanes) * 100%
```

This produces side-by-side rendering for concurrent lessons (e.g. a Lecture and Tutorial that overlap in time).

#### Clash Detection

`detectClashes(addedModules, selectedSlots)` checks for time conflicts across all selected slots:

```
For each day:
  Collect all selected lessons from all modules
  For each pair (i, j):
    If startTime[i] < endTime[j] AND startTime[j] < endTime[i]:
      → clash detected, add description string
Deduplicate with Set
Return array of clash strings
```

Detected clashes render as a red warning banner above the grid: `⚠ 2 clashes detected` with a bullet list of each conflict (e.g. `CS3230 & CS3219 on Monday (1000–1200)`).

#### Save & Load

**Save (`handleSave`):**
1. Gets token from `localStorage`.
2. `POST` to `/timetable` with body `{ timetable_data: { addedModules, selectedSlots } }` and auth header.
3. Button cycles through states: `Save` → `Saving…` → `✓ Saved` (green) or `Error — retry?` (red) → resets after 2.5 seconds.

**Load (on mount):**
1. `GET` from `/timetable` with auth header.
2. If response is 500 or 404 (no row yet for this user), treats as empty — not an error.
3. Otherwise reads `data[0].timetable_data` and calls `setAddedModules` and `setSelectedSlots` to restore the saved state exactly.

Refreshing the page restores the full previous timetable including all slot selections.

---

## Testing

**Framework:** Jest 30 + Supertest  
**Location:** `server/__tests__/routes/`  
**Strategy:** All external dependencies are mocked at the module level with `jest.mock`. Tests run in pure Node — no network calls, no database connection.

### ESLint + Jest Globals

The `server/eslint.config.js` uses ESLint 10's flat config. Jest globals (`describe`, `test`, `expect`, `jest`, `beforeEach`, etc.) are scoped to test files only — they are not valid in production code:

```js
// server/eslint.config.js
const js = require("@eslint/js");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      sourceType: "commonjs",
      globals: { ...globals.node },
    },
    rules: { "no-unused-vars": "warn" },
  },
  // Jest globals scoped to test files only
  {
    files: ["__tests__/**/*.js"],
    languageOptions: {
      globals: { ...globals.jest },
    },
  },
];
```

Without the third config object, ESLint would flag every `jest`, `describe`, `test`, and `expect` as "not defined" — which is what caused the CI failures that prompted this fix.

---

### `auth.test.js`

Tests the three `/auth` routes.

**Mock setup:**
```js
jest.mock('../../db/supabase', () => ({
  auth: {
    signUp: jest.fn(),
    signInWithPassword: jest.fn(),
    resetPasswordForEmail: jest.fn(),
  }
}));
```

**`POST /auth/register` — 6 tests:**

| Test | Scenario | Expected |
|---|---|---|
| 1 | Missing email in body | 400, "Email and password are required" |
| 2 | Missing password in body | 400, "Email and password are required" |
| 3 | Empty body `{}` | 400 |
| 4 | Valid email + password | 201, `message`, `data` present |
| 5 | Supabase returns error (duplicate email) | 400 with Supabase error message |
| 6 | Argument check | `signUp` called with `{ email, password }` exactly |

**`POST /auth/login` — 6 tests:**

| Test | Scenario | Expected |
|---|---|---|
| 1 | Missing email | 400 |
| 2 | Missing password | 400 |
| 3 | Empty body | 400 |
| 4 | Valid credentials | 200, `message: "Login successful"`, `token` = access token |
| 5 | Wrong credentials (Supabase error) | 400 with error message |
| 6 | Argument check | `signInWithPassword` called correctly |

---

### `su.test.js` — 20 tests

The most comprehensive test file. All five DB dependencies are mocked:

```js
jest.mock('../../db/supabase', () => ({ auth: { getUser: jest.fn() } }));
jest.mock('../../db/suPolicy');
jest.mock('../../db/userProfile');
jest.mock('../../db/timetable');
jest.mock('../../db/userSuInfo');
jest.mock('../../db/modules');
```

Each `describe` block calls `jest.clearAllMocks()` in `beforeEach` and sets a default `supabase.auth.getUser` mock that resolves successfully, keeping happy-path tests clean.

**`GET /su` — 12 tests:**

| Test | Scenario | Expected |
|---|---|---|
| 1 | Missing Authorization header | 500 (TypeError from `.split()` — documented known issue) |
| 2 | Full happy path (matric 2024, used_su 4) | 200, `modules` array, `usedSu: 4`, `totalSu: 32` |
| 3 | Eligibility merge — CS1101S eligible, LAJ1201 not in DB | CS1101S `is_su_eligible: true`, LAJ1201 `is_su_eligible: null` |
| 4 | Empty timetable | 200, `modules: []` |
| 5 | `userSuInfo` returns null (first-time user) | `usedSu: 0`, `totalSu` falls back to policy value |
| 6 | temp=0 (matriculated this year, month 5) | `currentGroup: 'y1y2'`, `groupCap: 20` |
| 7 | temp=1, month < 7 (still in Y1) | `currentGroup: 'y1y2'` |
| 8 | temp=3, month < 7 (in Y3) | `currentGroup: 'y3y4'`, `groupCap: 12` |
| 9 | `group_remaining` arithmetic | `groupCap(20) - usedSu(8) = 12` |
| 10 | `getUserProfile` throws | 500, "Internal Server Error" |
| 11 | `getSuPolicy` throws | 500 |
| 12 | `getTimetableByUserID` throws | 500 |

**`POST /su/userProfile` — 5 tests:**

| Test | Scenario | Expected |
|---|---|---|
| 1 | Missing Authorization header | 500 |
| 2 | `getUser` rejects (invalid token) | 401 |
| 3 | Missing `matricYear` in body | 400, "Matric year is required" |
| 4 | Valid request | 200, "User profile updated successfully", `userProfile` defined |
| 5 | Argument check | `upsertUserProfile` called with `(userID, 2024)` |
| 6 | `upsertUserProfile` throws | 500, "Internal Server Error" |

**`POST /su/info` — 8 tests:**

| Test | Scenario | Expected |
|---|---|---|
| 1 | Missing Authorization header | 500 |
| 2 | Missing `totalSu` | 400, "Total SU and Used SU are required" |
| 3 | Missing `usedSU` | 400 |
| 4 | Empty body | 400 |
| 5 | `usedSU: 0` (falsy but valid) | 200 (not rejected as missing) |
| 6 | Valid request | 200, "User SU info updated successfully" |
| 7 | Argument check | `upsertSuInfo` called with `(userID, 32, 4)` |
| 8 | `upsertSuInfo` throws | 500, "Internal Server Error" |

**`POST /su/eligible` — 5 tests:**

| Test | Scenario | Expected |
|---|---|---|
| 1 | Missing Authorization header | 500 |
| 2 | Mix of eligible and non-DB modules | Only the cached eligible module returned |
| 3 | No modules are S/U-able in DB | 200, `suAbleModules: []` |
| 4 | Empty input array | 200, `suAbleModules: []` |
| 5 | Argument check | `getSuAbleModulesByCodes` called with `['CS1101S', 'MA1521']` |

---

### `timetable.test.js` — 9 tests

```js
jest.mock('../../db/supabase', () => ({ auth: { getUser: jest.fn() } }));
jest.mock('../../db/timetable');
```

**`GET /timetable` — 5 tests:**

| Test | Scenario | Expected |
|---|---|---|
| 1 | Missing Authorization header | 500 |
| 2 | Auth passes, 2 entries in DB | 200, array of length 2 |
| 3 | Auth passes, no entries | 200, empty array |
| 4 | DB returns error | 500, "Failed to fetch timetable 1" |
| 5 | Argument check | `getTimetableByUserID` called with authed `userID` |

**`POST /timetable` — 4 tests:**

| Test | Scenario | Expected |
|---|---|---|
| 1 | Missing Authorization header | 500 |
| 2 | Valid upsert | 200, upserted entry in response |
| 3 | `user_id` injection | Upserted object has `user_id` from JWT, not client body |
| 4 | DB upsert fails | 500, Supabase error message forwarded |

### `modules.test.js`

Tests the cache-first `GET /modules` route: cache hit path, cache miss with NUSMods fallback, and NUSMods API failure resulting in a 500.

---

## CI Pipeline

**File:** `.github/workflows/lint.yml`  
**Trigger:** Every `push` and `pull_request` on any branch

```yaml
name: Lint Check

on:
  push:
  pull_request:

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Install Server Dependencies
        working-directory: ./server
        run: npm install
      - name: Lint Server
        working-directory: ./server
        run: npm run lint
      - name: Install Client Dependencies
        working-directory: ./client
        run: npm install
      - name: Lint Client
        working-directory: ./client
        run: npm run lint
```

Both `server/` and `client/` use ESLint 10 flat config. The server config applies `globals.node` globally and `globals.jest` scoped to `__tests__/**/*.js`. A test runner step (`npm test`) is planned for a future workflow addition once the test suite is stable enough to gate merges.

---

## Deployment

| Component | Platform | Configuration |
|---|---|---|
| Frontend | Vercel | Auto-deploys from `main`; preview deployments on PRs |
| Backend | Railway | Root Directory: `server/` |
| Database | Supabase | Asia-Pacific region |

### Railway Notes

Railway does not auto-detect subdirectories in a monorepo. Required settings:

- **Root Directory:** `server/` — tells Railway where `package.json` lives
- **Start command:** `node index.js` (or leave blank; Railway reads the `start` script)
- **Environment variables** (set in Variables tab):
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_KEY`
  - `PORT` (Railway also injects this automatically)

Missing environment variables cause runtime crashes, not build failures — the process boots and then throws when the Supabase client is first used.

The public URL is generated via **Settings → Networking → Generate Domain**. Railway's internal private URL is not externally accessible.

---

## Upcoming Features

- **AI-Powered Timetable Generator** — Parses natural-language preferences like "no morning classes" into constraints using the Claude API. Generates and ranks valid, non-clashing schedules with a visual side-by-side comparison.

- **4-Year Academic Planner** — Maps out your entire degree using a curated graduation requirement database and prerequisite logic. Features a drag-and-drop grid that prevents invalid module placements across semesters.

- **Crowdsourced Bidding Demand Heatmap** — Visualizes anonymous, real-time planning intent from other users as a color-coded timetable overlay. Helps gauge competition for specific slots before the actual bidding window opens.

- **Planner-Gated Module Q&A** — A persistent, searchable community forum where posting access is restricted to current or past students. Ensures high-quality, verified peer advice that survives beyond ephemeral chat groups.

- **Peer-Informed UE/PE Recommender** — Matches your interests to modules using AI, enriched with major-specific workload and enjoyment scores. Includes instant "Add to Planner" with automated prerequisite checks.

- **Group Free Slot Finder** — Aggregates friend schedules via shareable links to identify optimal meeting windows. Displays the nearest classes for each person for geographic and temporal context.

- **AI Study Planner** — Wraps a weekly revision schedule around your timetable based on module weightage and exam dates. Adjusts suggestions as you skip or complete blocks.

- **Interactive Prerequisite Visualizer** — D3.js force-directed graph of your degree's dependency tree. Highlights double-counting opportunities and color-codes modules by completion and eligibility.

- **AI Workload Balancer & Danger Zones** — Identifies weeks where deadlines and exams cluster. Suggests module swaps to smooth out your semester load.

- **What-If Scenario Planner** — Side-by-side comparisons of major pivots (second major, exchange semester). Evaluates feasibility, graduation timelines, and workload differences.

---

*NUS CP2106 Independent Software Development Project (Orbital) 2026*
