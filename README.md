# Studyline — IB & SAT study space

A private, single-student study planner and tracker for IB Diploma and SAT preparation. It turns well-supported learning research (retrieval practice, spaced review, interleaving, error logs, if–then plans) into everyday tools. Built with React 18, strict TypeScript, Vite, React Router, TanStack Query, Recharts, Tailwind CSS and date-fns. The only production server code is a Vercel Function in `api/[...route].ts`. It uses Neon's HTTP Postgres driver; there is no separate backend or Next.js application.

## Get started on Vercel

1. Install Node.js **22.18 or newer** and Git. Push this directory to a GitHub repository.
2. Import the repository into Vercel. Select the **Vite** framework preset, build command `npm run build`, and output directory `dist`. Use this directory as the project root.
3. In the Vercel project, open **Storage → Create Database / Marketplace → Neon**. Create a Postgres database and connect it to this project. Enable the integration for the environments you will use. Confirm that a `DATABASE_URL` variable exists. If your integration uses a prefixed variable, copy its connection string into a server-only `DATABASE_URL` variable in Vercel.
4. In **Settings → Environment Variables**, set `APP_PASSCODE` to a long private passphrase and `AUTH_SECRET` to at least 32 random characters. Generate a secret locally with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Never prefix these variables with `VITE_` and never commit them.
5. Deploy. **No manual SQL is needed:** on its first request after each cold start, the API creates any missing tables in one transaction and seeds the default subjects and activities once per database (recorded in `app_meta`). An imported or reset subject list is never re-seeded.

To prepare the database ahead of time instead, pull the variables and run the same migration locally:

```cmd
npm install
npx vercel login
npx vercel link
npx vercel env pull .env.local
npm run db:migrate
```

`db:migrate` reads `.env.local` and is safe to rerun. Neon variables created by the Vercel integration may be marked **Sensitive**, in which case `vercel env pull` writes placeholders; copy the real connection string from the Neon console instead. On Windows PowerShell, use `npx.cmd` / `npm.cmd` if script execution is disabled.

6. Deploy with `npx vercel --prod`, or redeploy the GitHub-connected project from Vercel. Environment variable changes require a new deployment. Open the resulting HTTPS URL and enter your passcode.

The included rewrite serves `index.html` on frontend deep links while leaving `/api/*` for the function. For example, refreshing `/log`, `/settings`, or `/subjects/<id>` works.

## Local development

After linking the project and pulling its variables:

```cmd
npm install
npx vercel dev
```

Open the **localhost** URL printed by Vercel. This runs both Vite and the Vercel Function locally. `npm run dev` alone runs only the frontend and is useful for UI tests, not normal data access. The authentication cookie always has `Secure`; localhost is treated as a trustworthy origin by modern browsers. Use HTTPS when testing from another device; plain HTTP on a LAN IP will not carry the cookie.

`.env.example` documents the three variables with dummy values. `.env*`, `.vercel`, installed dependencies, generated bundles, and test results are ignored by Git; only `.env.example` is included.

## Checks

```cmd
npm run typecheck
npm run lint
npm test
npm run build
```

Vitest covers spaced-review scheduling, exam-date capping, mistake redo rules, item validation, automatic database setup, totals, local-date boundaries, Monday weeks, streaks, elapsed timer time, Zod validation, import referential integrity, token signing / expiry, and API behavior against an isolated PostgreSQL-compatible PGlite engine. The database tests do not connect to your Neon database. Browser smoke checks can be run using `npm run test:browser` while `npm run dev` is running; these intercept API calls with isolated fixtures and do not change real data. By default they use installed Microsoft Edge; set `BROWSER_CHANNEL=chrome` for Chrome. Screenshots are written to ignored `test-results/`.

## Features and decisions

- **Today**: an if–then daily planner ("I will… / when & where"), one-tap suggestions, a **Start** button on each task that links the focus timer to it (the session saves under the task's subject, its minutes are added to the task, and you can mark it done when you stop; both writes happen in one SQL statement), carry-over of unfinished tasks, planning tomorrow, IB and SAT countdowns, weekly goal, upcoming deadlines and a research tip of the day.
- **Review**: a spaced-retrieval queue. Topics come back after expanding gaps (rating Good each time: 2 → 5 → 13 → 33 days; a lapse restarts at one day). The schedule is pulled in so a review lands before the relevant exam date. You recall first, reveal your notes, then rate Forgot / Hard / Good / Easy and see when it will return. Batches of new topics are staggered so they never land as one pile. Error-log questions return after 2 days, then a week, and retire after two correct redos.
- **SAT prep**: official test dates, target score, Bluebook practice-score log with trend and target line, an error log with mistake-type analysis and tailored advice, the official domain/skill map (one click adds every skill to Review), pacing facts and links to free official resources.
- **IB prep**: exam start date, IA/EE/TOK/mock deadlines, a 45-point predictor, a past-paper log by subject, "lost marks" redo items and a searchable command-term guide.
- **Playbook**: ten study methods rated Strong, Moderate or Low by the evidence, each with steps and a linked source (Dunlosky et al. 2013, Cepeda et al. 2008, Rohrer et al., Gollwitzer & Sheeran 2006, AASM).
- The interface is a light, frosted-glass design with a reduced-transparency fallback. Dark mode was removed; the stored theme setting is kept only for backup compatibility.
- Start, pause, resume, and stop a database-backed timer. Every change commits on the server. The browser reloads shared state every ten seconds and when the tab regains focus. Refreshing a running or paused timer restores it. Concurrent starts return a conflict; stopping and inserting a session happen in one SQL statement so a second device cannot save the same timer twice.
- Stopping pauses the timer and opens a review form. Canceling that form leaves it paused so you can resume. A session is limited to 24 hours and review allows correcting the duration, date, subject, activity, notes, tags, and focus rating.
- Log manual sessions, edit or delete historical sessions, filter by multiple subjects / activities, local date range, notes, and comma-separated tags. Tag filters require all entered tags. History is grouped by local day; duration sorting orders sessions within the resulting day groups.
- Dashboard totals, subject breakdowns, 7/30-day stacked daily charts, date-filtered subject and activity donuts, streaks, and total/per-subject weekly goals. Subject pages show totals, average duration, session count, activity distribution, eight-week trends, and filtered history.
- Weeks run Monday–Sunday in the browser's local timezone. Timestamps are saved as UTC. Sessions count on their **start date**, including sessions crossing midnight. The current streak includes yesterday if you have not studied today yet. Future-dated entries do not increase the current streak or current-period totals.
- Settings support subject names/colors/archival, optional subject goals, activity editing/archival and 12/24-hour times. Archived records remain in history and can be restored in Settings.
- Optimistic manual session additions/edits/deletions roll back on failure. Errors have retry paths. All route pages are lazy-loaded.
- Full JSON backups include subjects, activities, sessions, planner/review/prep items, sample markers, and settings. Older backups without items still import. The active timer and credentials are deliberately excluded. Imports validate version, field bounds, duplicate IDs, active choices and references, then show a replacement confirmation. Replacement is transactional. The UI limits imports to 3.5 MB to stay below Vercel's request body limit. Larger histories can be exported but require splitting/processing outside the UI before import.
- CSV exports use ISO UTC timestamps, human-readable subject/activity names, quoted cells, and spreadsheet-formula escaping. JSON is the lossless import format.
- Sample sessions are marked with `is_sample`; loading them replaces only previous samples. Removing samples preserves real sessions. Loading/removing samples uses two confirmations; reset additionally requires typing `RESET ALL DATA`. Reset restores the default catalog and settings.

## Authentication

`POST /api/login` compares the passcode in constant time and issues a 30-day HMAC-SHA256 token in an `HttpOnly; Secure; SameSite=Strict` cookie. Tokens never live in local storage. All other routes require a valid cookie. The frontend returns to the passcode screen on a 401.

Login counters persist in Postgres, keyed by an HMAC of the request IP rather than the raw IP. A source IP is limited to ten attempts per fifteen-minute window; failed passcodes also incur a 700 ms delay. Successful login clears that source's counter and expired records. State-changing requests check the browser Origin when present. Responses are not cached, and server logs do not include database URLs or request bodies.

Logout clears the browser cookie. To invalidate **all** issued tokens, rotate `AUTH_SECRET` and redeploy. Changing only the passcode does not revoke existing sessions. This app has one shared passcode and no user accounts or recovery email.

## Data model

`api/_lib/schema.ts` is the canonical schema; `db/schema.sql` mirrors it (a test keeps them in sync).

| Table | Purpose |
| --- | --- |
| `subjects` | UUID, name, hex color, archived flag, weekly goal minutes, sort order |
| `activity_types` | UUID, name, archived flag, sort order |
| `sessions` | UUID, subject/activity references, UTC start, duration, notes, tags, optional focus, sample marker, created/updated timestamps |
| `active_timer` | Enforced singleton, unique timer UUID, references, server start/pause timestamps, accumulated paused milliseconds |
| `settings` | Enforced singleton with total weekly goal, theme, and time format |
| `login_attempts` | Hashed IP bucket, attempt counter and expiration |
| `items` | Planner, review and prep records (`topic`, `mistake`, `score`, `task`, `milestone`, `profile`) as validated JSONB, keyed by UUID |
| `app_meta` | One-time seed markers |

All application queries use parameterized tagged templates. The migration executes only static checked-in DDL; seed values are parameterized. Session references are enforced with foreign keys. Catalog records are archived rather than deleted to preserve history.

## API routes

All routes return JSON. Errors use `{ "error": { "code": "...", "message": "..." } }`. Validation failures return 400, missing authentication 401, forbidden origins 403, missing records 404, unsupported methods 405, conflicting timer/data changes 409, login throttling 429, incomplete configuration 503, and unexpected failures 500.

| Endpoint | Methods | Description |
| --- | --- | --- |
| `/api/login` | POST | `{passcode}`; only public endpoint |
| `/api/logout` | POST | `{}`; clear authentication cookie |
| `/api/state` | GET | Consistent snapshot of catalogs, sessions, settings, timer |
| `/api/subjects` | GET, POST, PUT | Read catalog; create/update full validated subject object |
| `/api/activity-types` | GET, POST, PUT | Read catalog; create/update full validated activity object |
| `/api/sessions` | GET, POST, PUT, DELETE | GET accepts `from`/`to` ISO timestamps; POST/PUT takes a session; DELETE takes `{id}` |
| `/api/timer` | GET, POST | GET current timer or null; POST start/pause/resume/stop action |
| `/api/settings` | GET, PUT | Read/replace validated preferences |
| `/api/export` | GET | Version 1 JSON backup |
| `/api/import` | POST | Validated version 1 backup; atomic replacement |
| `/api/items` | PUT, DELETE | PUT one validated item or an array of up to 200 (atomic); an item's kind cannot change. DELETE takes `{id}` |
| `/api/data` | POST | `{action: "sample" \| "remove-sample" \| "reset"}`; reset requires `confirmation: "RESET ALL DATA"` |

Timer actions: `start` takes `subject_id` and `activity_type_id`; `pause`/`resume` take the timer `id`; `stop` takes the timer `id` and a complete `session` object. UUIDs for sessions/catalog entries are generated with `crypto.randomUUID()`. The database generates authoritative timer timestamps.

## Folder guide

`src/components` contains reusable controls/charts; `src/pages` has lazy-loaded routes; `src/hooks` provides shared data and optimistic mutations; `src/lib` holds API helpers, schemas, pure statistics, and tests; `src/types` holds shared types. `api` contains the Vercel function and private authentication helpers. `api/_lib/schema.ts` creates tables and seeds defaults (used by the API and `scripts/migrate.ts`). `src/lib/review.ts` holds the scheduling logic and `src/lib/content.ts` the researched IB/SAT content and sources.

Deployment references: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js), [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver).
