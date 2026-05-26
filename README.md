# ModMapper_Orbital2026

# ModMapper

A collaborative timetable planner for NUS students. Search modules, build conflict-free schedules through a constraint solver, and sync plans with friends in real time.

**Live:** [modmapper.vercel.app](https://modmapper.vercel.app/login)

---

## Upcoming Features

- AI-Powered Timetable Generator →
  Parses natural-language preferences like "no morning classes" into constraints using the Claude API. Generates and ranks valid, non-clashing schedules with a visual side-by-side comparison.

- 4-Year Academic Planner →
  Maps out your entire degree using a curated graduation requirement database and prerequisite logic. Features a drag-and-drop grid that prevents invalid module placements across semesters.

- Crowdsourced Bidding Demand Heatmap →
  Visualizes anonymous, real-time planning intent from other users as a color-coded timetable overlay. Helps you gauge competition for specific slots before the actual bidding window opens.

- Planner-Gated Module Q&A →
  Provides a persistent, searchable community forum where posting access is restricted to current or past students. Ensures high-quality, verified peer advice that survives beyond ephemeral chat groups.

- Peer-Informed UE/PE Recommender →
  Matches your interests to modules using AI, enriched with major-specific workload and enjoyment scores. Allows instant "Add to Planner" functionality with automated prerequisite checks.

- Group Free Slot Finder →
  Aggregates friend schedules via shareable links to identify optimal meeting windows for project work. Displays the nearest classes for each person to provide geographic and temporal context.

- AI Study Planner →
  Automatically wraps a weekly revision schedule around your timetable based on module weightage and exam dates. Learns from your behavior, adjusting future suggestions when you skip or complete blocks.

- Interactive Prerequisite Visualizer →
  Uses a D3.js force-directed graph to map out your entire degree's dependency tree. Highlights double-counting opportunities and color-codes modules by completion and eligibility status.

- AI Workload Balancer & Danger Zones →
  Identifies "danger zones" where deadlines and exams cluster to predict your weekly stress levels. Suggests module swaps to smooth out your semester load and calculates downstream impacts.

- What-If Scenario Planner →
  Enables side-by-side comparisons of major pivots, such as adding a second major or going on exchange. Evaluates feasibility, graduation timelines, and workload differences across different "what-if" branches.

---

## Tech Stack

| | |
|---|---|
| Frontend | React 19, Vite 8, React Router v7 |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL (Supabase) |
| CI | GitHub Actions, ESLint |
| Testing | Jest 30, Supertest |
| Scheduling | node-cron |

---

## Getting Started

### Prerequisites

- Node.js v18+
- A Supabase project with the schema described below

### Clone the repository

```bash
git clone https://github.com/Sid504-dot/ModMapper_Orbital2026.git
cd ModMapper_Orbital2026
```

### Backend

```bash
cd server
npm install
```

Create `server/.env`:

```
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
PORT=3000
```

> **Note:** The backend uses the Supabase **service role key** (not the anon key) so it can read and write on behalf of any user after validating their JWT. Credentials are under **Project Settings → API** in your Supabase dashboard.

```bash
node index.js
```

The server runs at `http://localhost:3000`. Verify it is up with:

```bash
curl http://localhost:3000/health
```

On startup the server also triggers an immediate module cache refresh from NUSMods (see [Module Cache & Cron](#module-cache--cron) below).

### Frontend

Open a new terminal from the project root:

```bash
cd client
npm install
```

Create `client/.env`:

```
VITE_API_URL=https://modmapperorbital2026-production.up.railway.app
```

```bash
npm run dev
```

The app runs at `http://localhost:5173`.

---

## Current Implementation

### Authentication

Authentication is handled end-to-end via Supabase Auth. All three flows are live.

**`POST /auth/register`**

Accepts `{ email, password }`. Calls `supabase.auth.signUp` and returns a 201 on success. Client-side, `Register.jsx` also validates that the password and confirm-password fields match before the request is sent. On success the user is redirected to `/login` after a 2-second delay.

**`POST /auth/login`**

Accepts `{ email, password }`. Calls `supabase.auth.signInWithPassword` and returns the Supabase JWT access token. `Login.jsx` stores this token in `localStorage` under the key `token` and then navigates to `/dashboard`.

**`POST /auth/forgot-password`**

Accepts `{ email }`. Calls `supabase.auth.resetPasswordForEmail`. Returns a deliberately ambiguous success message regardless of whether the email is registered, to prevent user enumeration. The forgot-password flow is embedded in `Login.jsx` as a conditional view — no separate page.

All protected routes on the backend extract the token from the `Authorization: Bearer <token>` header and validate it with `supabase.auth.getUser(token)` before proceeding.

---

### Module Search & Cache

**`GET /modules?module_code=<code>`**

Returns full module data (module code, title, semester timetables, exam info, S/U eligibility) for a given module code. The endpoint is cache-first:

1. Checks the `modules` table in Supabase for a matching `module_code`.
2. If found, returns the cached record immediately.
3. If not found, fetches live data from the NUSMods API, upserts it into the `modules` table (including the `is_su_eligible` flag from `attributes.su`), and returns the fresh data.

The NUSMods service (`services/nusmods.js`) always tries the upcoming academic year's API endpoint first and falls back to the current year's endpoint on failure, so the data stays accurate across the July AY transition.

---

### Module Cache & Cron

**`services/refresh.js`** handles bulk population and incremental refresh of the module cache.

- Fetches the full NUSMods module list (`moduleList.json`).
- Processes modules in batches of 10 in parallel, with a 1-second delay between batches to respect NUSMods rate limits.
- For each module, fetches its full data and compares against the existing DB record. If `module_name` or `semesters` have changed, it upserts the full record. If unchanged, it updates only `cached_at` to keep the timestamp fresh. New modules are inserted with all fields.
- The `is_su_eligible` field is always written from `attributes.su` in the NUSMods response.

**`services/cron.js`** schedules automated refreshes:

- Runs a full refresh **immediately on server startup**.
- Schedules a daily job at **2:00 AM** that triggers a refresh only during academically sensitive windows:
  - **15 Jul – 25 Aug** (Sem 1 add/drop and module list updates)
  - **15 Dec – 25 Jan** (Sem 2 add/drop and module list updates)
  - **First of every month** at any time of year (routine check)

---

### Timetable

**`GET /timetable`** (auth required)

Returns the authenticated user's saved timetable from the `user_timetable` table. The timetable payload is stored as a JSON blob under the `timetable_data` column (structure: `{ addedModules, selectedSlots }`).

**`POST /timetable`** (auth required)

Accepts any JSON body. The route injects `user_id` from the validated JWT before upserting into `user_timetable` (conflict target: `user_id`), so each user has exactly one timetable row.

---

### S/U Optimizer

The S/U Optimizer is the primary new feature on this branch. It is split across four endpoints, three DB helpers, and a policy table.

**`GET /su`** (auth required)

The main dashboard endpoint. It assembles a complete S/U picture for the authenticated user in a single response:

1. **Academic year classification** — looks up `matric_year` from `user_profile` and computes `whichYear` (1–4) using the current calendar date and the July AY changeover boundary. Classifies the student as `y1y2` or `y3y4`.
2. **S/U policy** — queries the `su_policy` table by `cohort_start_year` (= `matric_year`) to get `total_su`, `y1y2_cap`, and `y3y4_cap`.
3. **User S/U record** — queries `user_su_info` for `total_su` and `used_su`. Falls back to `used_su = 0` and `total_su` from the policy row if the user has not yet entered their S/U info.
4. **Timetable + eligibility merge** — fetches the user's timetable entries, extracts module codes, queries `modules` for their `is_su_eligible` flags, and merges the flag back onto each timetable entry. Modules not found in the cache get `is_su_eligible: null`.

Response shape:

```json
{
  "group_remaining": 16,
  "suPolicy": { "total_su": 32, "y1y2_cap": 20, "y3y4_cap": 12, "cohort_start_year": 2025 },
  "timetable": [...],
  "userSuInfo": { "used_su": 4, "total_su": 32 },
  "groupCap": 20,
  "currentGroup": "y1y2",
  "usedSu": 4,
  "totalSu": 32,
  "modules": [
    { "module_code": "CS1101S", ..., "is_su_eligible": true },
    { "module_code": "GEA1000", ..., "is_su_eligible": null }
  ]
}
```

**`POST /su/userProfile`** (auth required)

Accepts `{ matricYear }`. Upserts the user's `matric_year` into the `user_profile` table (conflict target: `user_id`). This is the first-time setup step that drives the year classification logic in `GET /su`.

**`POST /su/info`** (auth required)

Accepts `{ totalSu, usedSU }`. Upserts the user's S/U allocation record into `user_su_info` (conflict target: `user_id`). Validates that both fields are present (note: `0` is valid for `usedSU`).

**`POST /su/eligible`** (auth required)

Accepts an array of `[{ moduleCode }, ...]`. Extracts the module codes and queries the `modules` table for their `is_su_eligible` flags in a single batch query. Returns only the modules that appear in the DB (i.e., modules not yet cached will simply be absent from the response).

---

### Database Schema

The following Supabase tables are in use:

| Table | Key Columns | Purpose |
|---|---|---|
| `modules` | `module_code` (PK), `module_name`, `semesters` (JSON), `cached_at`, `is_su_eligible` | NUSMods module cache |
| `user_timetable` | `user_id` (PK), `timetable_data` (JSON) | Per-user saved timetable |
| `user_profile` | `user_id` (PK), `matric_year` | Academic year classification input |
| `user_su_info` | `user_id` (PK), `total_su`, `used_su` | User's S/U allowance tracking |
| `su_policy` | `cohort_start_year` (PK), `total_su`, `y1y2_cap`, `y3y4_cap` | NUS S/U policy rules by cohort |

---

### Frontend

The React frontend (deployed to Vercel) has five pages wired up via React Router v7.

**`/login` — `Login.jsx`**

Two-column layout: a branded left panel and a right-side form. Handles login via `POST /auth/login`, stores the returned JWT in `localStorage`, and navigates to `/dashboard`. Includes an inline forgot-password view that calls `POST /auth/forgot-password` without leaving the page.

**`/register` — `Register.jsx`**

Single-card registration form with email, password, and confirm-password fields. Validates password match client-side. Calls `POST /auth/register`. Redirects to `/login` on success or if the email is already registered.

**`/dashboard` — `Dashboard.jsx`**

Persistent sidebar navigation with links to Timetable, Module Search, S/U Optimiser (nav items; not all wired yet), and sign-out. Currently renders static placeholder data for the module list and graduation progress cards. Includes an auth guard: if no token is found in `localStorage`, the user is redirected to `/login`.

**`/modules` — `ModuleSearch.jsx`**

Fetches the full NUSMods module list directly from the NUSMods public API and provides a client-side search that filters by module code or title. Displays the first 20 matches. (Backend `/modules` endpoint exists for individual lookups; the module list search currently bypasses it.)

**`/timetable` — `TimetableBuilder.jsx`**

The most feature-complete frontend page:

- **Module search** — searches the NUSMods module list client-side; fetches full module data (including semester timetables) from the NUSMods API when a module is added.
- **Slot selector** — for each added module, renders one dropdown per lesson type (Lecture, Tutorial, Lab, etc.) populated with the available class numbers from the NUSMods timetable data.
- **Timetable grid** — a pixel-precise weekly grid from 0800 to the latest class end time, with time labels and horizontal hour lines. Each lesson block is positioned using `top` and `height` derived from start/end times converted to minutes. Overlapping lessons in the same column are split into lanes using a greedy lane-assignment algorithm.
- **Clash detection** — compares the currently selected slots across all added modules for each day and reports any time overlaps as a warning banner.
- **Persist** — `Save` button calls `POST /timetable` with the full `{ addedModules, selectedSlots }` payload. On mount, calls `GET /timetable` and rehydrates state from the stored JSON blob. Both calls use the JWT from `localStorage`.

---

### Testing

Tests live in `server/__tests__/routes/` and use Jest with Supertest. All external dependencies (Supabase client, all DB modules) are mocked with `jest.mock`, so tests run without a real database connection.

**`su.test.js`** — 20 tests across four describe blocks:

- `GET /su`: auth guard behaviour, the full happy path, S/U eligibility merging (including absent modules returning `null`), empty timetable handling, null userSuInfo fallback, year group classification for Y1/Y2/Y3/Y4, `group_remaining` arithmetic, and DB error propagation (500s from getUserProfile, getSuPolicy, and timetable fetch).
- `POST /su/userProfile`: auth guards, missing `matricYear` validation, successful upsert, correct argument passing, and DB error handling.
- `POST /su/info`: auth guards, missing field validation (`totalSu`, `usedSU`), `usedSU = 0` accepted as valid, successful upsert, correct argument passing, and DB error handling.
- `POST /su/eligible`: auth guard, filtering to only S/U-eligible modules, empty input, and correct module code extraction from the request body.

**`timetable.test.js`** — 9 tests across two describe blocks:

- `GET /timetable`: auth guard, returning entries, empty array, DB error (500), and correct `user_id` injection.
- `POST /timetable`: auth guard, successful upsert, `user_id` injection verification, DB error, and unhandled `getUser` rejection.

Run the test suite from the `server/` directory:

```bash
npm test
```

---

### CI Pipeline

`.github/workflows/lint.yml` runs on every push and pull request. It installs dependencies and runs `eslint` separately for both `server/` and `client/` using Node.js 20.

---

## Deployment

| | Platform |
|---|---|
| Frontend | Vercel |
| Backend | Railway (Root Directory: `server/`) |
| Database | Supabase (Asia-Pacific) |

**Railway configuration notes:**
- Root Directory must be set to `server/` in Railway's project settings — Railway does not auto-detect subdirectories in a monorepo layout.
- Environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_KEY`) must be added manually in Railway's Variables tab. Missing variables cause runtime crashes, not build failures.
- The public domain is generated via **Settings → Generate Domain**. Railway's internal private URL is not externally accessible.

---

NUS CP2106 Independent Software Development Project (Orbital) 2026
