# End-to-End Verification Checklist

Run through these steps after deploying the Railway-only configuration to confirm document upload/load works.

## Prerequisites

- `DATABASE_URL` points to Railway Postgres
- `RAILWAY_STORAGE_ACCESS_KEY_ID`, `RAILWAY_STORAGE_SECRET_ACCESS_KEY`, `RAILWAY_STORAGE_ENDPOINT` are set
- No Supabase env vars needed at runtime

## Test Matrix

1. **Upload new document**
   - Open a patient chart
   - Upload a PDF or image via Documents or Photos
   - Confirm no upload error

2. **Save metadata**
   - After upload completes, confirm the file appears in the list
   - Metadata is stored in Railway Postgres (`patient_files`)

3. **Load document in UI**
   - Refresh the page
   - Confirm the document still appears in the list

4. **Open/download document**
   - Click to open or download the file
   - Confirm the file loads (no 404)

5. **Analyze radiograph** (if applicable)
   - Upload a radiograph image
   - Run AI analysis
   - Confirm the analysis completes (image is fetched from Railway Storage)

## Quick API Checks

- `GET /api/health` – `database: "connected"`, `storage.railway: "configured"`
- `GET /api/storage/status` (auth required) – `storageWorking: true`, `activeStorage: "railway"`

## Automated verification

Run against a deployed app or local app with env set:

```bash
# API and env checks only (writes E2E_VERIFICATION_REPORT.md)
npm run e2e-verify

# With a running app and credentials for authenticated checks:
BASE_URL=https://your-app.railway.app npm run e2e-verify
BASE_URL=https://your-app.railway.app TEST_EMAIL=you@example.com TEST_PASSWORD=xxx npm run e2e-verify

# Upload endpoint and diagnostic tests:
BASE_URL=https://your-app.railway.app TEST_EMAIL=you@example.com TEST_PASSWORD=xxx npm run test-upload-fix
```

## If Tests Fail

- Run `npm run baseline-diagnostics` and `npm run diagnose-storage` locally with your env
- Check Railway logs for `DB host type: railway` and storage errors
- Run `npm run repair-file-urls -- --dry-run` to check URL formats
