# Railway-Only Deployment

This app uses **Railway** for both database and file storage. Supabase is not used at runtime.

## Required Environment Variables

### Database
- `DATABASE_URL` — Railway Postgres connection string (e.g. `postgresql://...@postgres.railway.internal:5432/railway`)

### File Storage
- `RAILWAY_STORAGE_ACCESS_KEY_ID`
- `RAILWAY_STORAGE_SECRET_ACCESS_KEY`
- `RAILWAY_STORAGE_ENDPOINT`
- `RAILWAY_STORAGE_BUCKET_NAME` (optional, default: `patient-files`)

### Other
- `SESSION_SECRET` — Required in production for session signing

## Do NOT Set

- `SUPABASE_URL` / `SUPABASE_PROJECT_URL` — Not used
- `SUPABASE_SERVICE_ROLE` — Not used

Supabase variables will be ignored. The app will fail to start if Railway Storage is not configured.

## Migration from Supabase (one-time)

If you have existing files in Supabase Storage:

1. Set `DATABASE_URL` to Railway Postgres
2. Set Railway Storage variables
3. Run `npm run baseline-diagnostics` to capture current state
4. Run `npm run migrate-storage` (with Supabase vars set temporarily) to copy files to Railway
5. Run `npm run repair-file-urls -- --dry-run` then `npm run repair-file-urls` to normalize `file_url` to canonical `/api/objects/uploads/...`
6. Run `npm run diagnose-storage` to verify object existence for rows in `patient_files`
7. Remove Supabase variables from Railway

## Verification

- `GET /api/health` — Check database and storage status
- `GET /api/storage/status` (auth required) — Detailed storage config
- Startup logs should show: `DB host type: railway`, `Railway Storage: configured`
