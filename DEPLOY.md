# Deploying MedPulse (Vercel + Supabase, free tier)

The app deploys to Vercel's free Hobby plan with no credit card required:

- **Client** — `npm run build` (Vite) outputs `dist/`, served from Vercel's CDN.
- **API** — every `/api/*` request is served by a single Vercel Function, bundled
  from `server/vercel-handler.ts` into `api/index.js` by `npm run build:api`
  (run automatically as part of `npm run build`).
- **Database** — the existing Supabase PostgreSQL, unchanged.

Free web-container hosts (Render, Koyeb) spin the app down when idle, so the
first visit after a while takes ~1 minute. Vercel Functions scale to zero
instead: the site is always instantly available, and only the first API call
after idle pays a short (sub-second to low-seconds) cold start.

## One-time setup

1. Push this repository to GitHub.
2. On https://vercel.com/new, import the repository. Vercel reads `vercel.json`:
   framework `vite`, build `npm run build`, output `dist`.
3. Add environment variables (Project → Settings → Environment Variables) for
   **Production** and **Preview**:
   - `DATABASE_URL` — Supabase **transaction pooler** string (port 6543, keep
     `?pgbouncer=true`). For serverless traffic append `&connection_limit=1`.
   - `DIRECT_URL` — Supabase direct/session connection (used by Prisma tooling).
   - `JWT_SECRET` — the same value used in local development.
4. Deploy.

## After deploying

- `GET https://<project>.vercel.app/api/health` returns `{"status":"ok", ...}`.
- The root URL serves the public hospital website from the CDN.
- Optional: Project → Settings → Functions → Region. Supabase runs in
  **ap-south-1 (Mumbai)**; choosing **bom1** minimises query latency.

`vercel.json` registers a daily cron that GETs `/api/public/overview`. It keeps
the Supabase free project from being paused for inactivity (free projects pause
after 7 days without database requests) and keeps the function warm.

## Day-to-day

- The serverless entry is **generated**: after changing anything under `server/`,
  run `npm run build:api` (or any `npm run build`) and commit the refreshed
  `api/index.js` together with your source change.
- Local development is unchanged: `npm run dev` (Express + Vite on port 3000),
  or `npm run dev:server` + `npm run dev:client`.
- `postinstall` regenerates the Prisma client; the schema declares the
  `rhel-openssl-3.0.x` binary target for Vercel's runtime.

## Troubleshooting

- **404 on `/api/...` after deploy** — confirm the deployment used `vercel.json`.
  If the project was created with a framework override, set it back to automatic
  (Project → Settings → Build and Deployment) so `framework: vite` applies and
  the root `server.ts` (local-dev only) is not mistaken for the deployed server.
- **`Can't reach database server`** — `DATABASE_URL` must be the pooler string
  (port 6543). Also check the Supabase project is not paused.
- **Prisma engine not found** — ensure the build ran `prisma generate`
  (`postinstall`) and that `binaryTargets` still includes `rhel-openssl-3.0.x`.
