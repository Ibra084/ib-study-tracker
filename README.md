# Studyline — IB study tracker

A private, single-student study tracker built with React 18, strict TypeScript, Vite, React Router, TanStack Query, Recharts, Tailwind CSS and date-fns. The only production server code is a Vercel Function in `api/[...route].ts`. It uses Neon's HTTP Postgres driver; there is no separate backend or Next.js application.

## Get started on Vercel

1. Install Node.js **22.18 or newer** and Git. Push this directory to a GitHub repository.
2. Import the repository into Vercel. Select the **Vite** framework preset, build command `npm run build`, and output directory `dist`. Use this directory as the project root.
3. In the Vercel project, open **Storage → Create Database / Marketplace → Neon**. Create a Postgres database and connect it to this project. Enable the integration for the environments you will use. Confirm that a `DATABASE_URL` variable exists. If your integration uses a prefixed variable, copy its connection string into a server-only `DATABASE_URL` variable in Vercel.
4. In **Settings → Environment Variables**, set `APP_PASSCODE` to a long private passphrase and `AUTH_SECRET` to at least 32 random characters. Generate a secret locally with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Never prefix these variables with `VITE_` and never commit them.
5. Install dependencies, connect the Vercel CLI, pull environment variables, and migrate the database:

```cmd
npm install
npx vercel login
npx vercel link
npx vercel env pull .env.local
npm run db:migrate
```

`db:migrate` reads `.env.local`. The migration creates tables and seeds six subjects, thirteen activity types, and settings idempotently. Run it once before first use. Run it again safely for an existing schema; existing subject names and preferences are preserved. If Preview/Development and Production use different databases, run the migration separately against each connection string. To pull production variables explicitly, use `npx vercel env pull .env.local --environment=production` before migrating that database.

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

Vitest covers totals, local-date boundaries, Monday weeks, streaks, elapsed timer time, Zod validation, import referential integrity, token signing / expiry, and API behavior against an isolated PostgreSQL-compatible PGlite engine. The database tests do not connect to your Neon database. Browser smoke checks can be run using `npm run test:browser` while `npm run dev` is running; these intercept API calls with isolated fixtures and do not change real data. By default they use installed Microsoft Edge; set `BROWSER_CHANNEL=chrome` for Chrome. Screenshots are written to ignored `test-results/`.

## Features and decisions

- Start, pause, resume, and stop a database-backed timer. Every change commits on the server. The browser reloads shared state every ten seconds and when the tab regains focus. Refreshing a running or paused timer restores it. Concurrent starts return a conflict; stopping and inserting a session happen in one SQL statement so a second device cannot save the same timer twice.
- Stopping pauses the timer and opens a review form. Canceling that form leaves it paused so you can resume. A session is limited to 24 hours and review allows correcting the duration, date, subject, activity, notes, tags, and focus rating.
- Log manual sessions, edit or delete historical sessions, filter by multiple subjects / activities, local date range, notes, and comma-separated tags. Tag filters require all entered tags. History is grouped by local day; duration sorting orders sessions within the resulting day groups.
- Dashboard totals, subject breakdowns, 7/30-day stacked daily charts, date-filtered subject and activity donuts, streaks, and total/per-subject weekly goals. Subject pages show totals, average duration, session count, activity distribution, eight-week trends, and filtered history.
- Weeks run Monday–Sunday in the browser's local timezone. Timestamps are saved as UTC. Sessions count on their **start date**, including sessions crossing midnight. The current streak includes yesterday if you have not studied today yet. Future-dated entries do not increase the current streak or current-period totals.
- Settings support subject names/colors/archival, optional subject goals, activity editing/archival, light/dark/system theme, and 12/24-hour times. Archived records remain in history and can be restored in Settings.
- Optimistic manual session additions/edits/deletions roll back on failure. Errors have retry paths. All route pages are lazy-loaded.
- Full JSON backups include subjects, activities, sessions, sample markers, and settings. The active timer and credentials are deliberately excluded. Imports validate version, field bounds, duplicate IDs, active choices and references, then show a replacement confirmation. Replacement is transactional. The UI limits imports to 3.5 MB to stay below Vercel's request body limit. Larger histories can be exported but require splitting/processing outside the UI before import.
- CSV exports use ISO UTC timestamps, human-readable subject/activity names, quoted cells, and spreadsheet-formula escaping. JSON is the lossless import format.
- Sample sessions are marked with `is_sample`; loading them replaces only previous samples. Removing samples preserves real sessions. Loading/removing samples uses two confirmations; reset additionally requires typing `RESET ALL DATA`. Reset restores the default catalog and settings.

## Authentication

`POST /api/login` compares the passcode in constant time and issues a 30-day HMAC-SHA256 token in an `HttpOnly; Secure; SameSite=Strict` cookie. Tokens never live in local storage. All other routes require a valid cookie. The frontend returns to the passcode screen on a 401.

Login counters persist in Postgres, keyed by an HMAC of the request IP rather than the raw IP. A source IP is limited to ten attempts per fifteen-minute window; failed passcodes also incur a 700 ms delay. Successful login clears that source's counter and expired records. State-changing requests check the browser Origin when present. Responses are not cached, and server logs do not include database URLs or request bodies.

Logout clears the browser cookie. To invalidate **all** issued tokens, rotate `AUTH_SECRET` and redeploy. Changing only the passcode does not revoke existing sessions. This app has one shared passcode and no user accounts or recovery email.

## Data model

See `db/schema.sql` for constraints and indexes.

| Table | Purpose |
| --- | --- |
| `subjects` | UUID, name, hex color, archived flag, weekly goal minutes, sort order |
| `activity_types` | UUID, name, archived flag, sort order |
| `sessions` | UUID, subject/activity references, UTC start, duration, notes, tags, optional focus, sample marker, created/updated timestamps |
| `active_timer` | Enforced singleton, unique timer UUID, references, server start/pause timestamps, accumulated paused milliseconds |
| `settings` | Enforced singleton with total weekly goal, theme, and time format |
| `login_attempts` | Hashed IP bucket, attempt counter and expiration |

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
| `/api/data` | POST | `{action: "sample" \| "remove-sample" \| "reset"}`; reset requires `confirmation: "RESET ALL DATA"` |

Timer actions: `start` takes `subject_id` and `activity_type_id`; `pause`/`resume` take the timer `id`; `stop` takes the timer `id` and a complete `session` object. UUIDs for sessions/catalog entries are generated with `crypto.randomUUID()`. The database generates authoritative timer timestamps.

## Folder guide

`src/components` contains reusable controls/charts; `src/pages` has lazy-loaded routes; `src/hooks` provides shared data and optimistic mutations; `src/lib` holds API helpers, schemas, pure statistics, and tests; `src/types` holds shared types. `api` contains the Vercel function and private authentication helpers. `scripts/migrate.ts` applies `db/schema.sql` and seeds defaults.

Deployment references: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Vercel Node functions](https://vercel.com/docs/functions/runtimes/node-js), [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver).
