/**
 * E2E verification for Railway-only document workflows.
 * Runs API health checks and optional authenticated checks; records pass/fail for success criteria.
 *
 * Usage:
 *   tsx scripts/run-e2e-verification.ts
 *   BASE_URL=https://your-app.railway.app tsx scripts/run-e2e-verification.ts
 *   BASE_URL=https://your-app.railway.app TEST_EMAIL=you@example.com TEST_PASSWORD=secret tsx scripts/run-e2e-verification.ts
 *
 * Prerequisites (for full pass): DATABASE_URL and Railway storage env vars set (e.g. in .env or Railway).
 * For authenticated checks: set BASE_URL, TEST_EMAIL, TEST_PASSWORD.
 */
import { config } from "dotenv";
import { resolve } from "path";
import { writeFileSync } from "fs";

config({ path: resolve(process.cwd(), ".env") });

const BASE_URL = (process.env.BASE_URL || "").replace(/\/$/, "");
const TEST_EMAIL = process.env.TEST_EMAIL || "";
const TEST_PASSWORD = process.env.TEST_PASSWORD || "";

type Result = "pass" | "fail" | "skipped";
const results: { criterion: string; result: Result; detail: string }[] = [];

function getDbHostType(url: string | undefined): "railway" | "supabase" | "unknown" {
  if (!url) return "unknown";
  if (url.includes("railway.internal") || url.includes("railway.app")) return "railway";
  if (url.includes("supabase.co") || url.includes("pooler.supabase.com")) return "supabase";
  return "unknown";
}

async function main() {
  console.log("=== E2E Verification (Railway-only success criteria) ===\n");

  // 1. Prerequisites (env)
  const dbUrl = process.env.DATABASE_URL;
  const dbHostType = getDbHostType(dbUrl);
  const hasRailwayStorage =
    !!(process.env.RAILWAY_STORAGE_ACCESS_KEY_ID &&
      process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY &&
      process.env.RAILWAY_STORAGE_ENDPOINT);

  if (dbHostType === "railway") {
    results.push({ criterion: "DATABASE_URL host is Railway", result: "pass", detail: "Host type: railway" });
  } else if (dbUrl) {
    results.push({ criterion: "DATABASE_URL host is Railway", result: "fail", detail: `Host type: ${dbHostType}` });
  } else {
    results.push({ criterion: "DATABASE_URL host is Railway", result: "skipped", detail: "DATABASE_URL not set" });
  }

  if (hasRailwayStorage) {
    results.push({ criterion: "Railway storage env vars present", result: "pass", detail: "All three vars set" });
  } else if (!dbUrl) {
    results.push({ criterion: "Railway storage env vars present", result: "skipped", detail: "No env loaded (run with .env or set vars)" });
  } else {
    results.push({ criterion: "Railway storage env vars present", result: "fail", detail: "Missing RAILWAY_STORAGE_* vars" });
  }

  // 2. API health checks (require BASE_URL and running app)
  if (!BASE_URL) {
    results.push({ criterion: "GET /api/health → database connected, storage.railway configured", result: "skipped", detail: "BASE_URL not set" });
    results.push({ criterion: "GET /api/storage/status → storageWorking, activeStorage railway", result: "skipped", detail: "BASE_URL not set" });
    results.push({ criterion: "GET /api/debug/upload-status → authenticated, Railway configured", result: "skipped", detail: "BASE_URL not set" });
  } else {
    try {
      const healthRes = await fetch(`${BASE_URL}/api/health`);
      const health = await healthRes.json().catch(() => ({}));
      if (healthRes.ok && health.database === "connected" && health.storage?.railway === "configured") {
        results.push({ criterion: "GET /api/health → database connected, storage.railway configured", result: "pass", detail: "OK" });
      } else if (!healthRes.ok) {
        results.push({ criterion: "GET /api/health → database connected, storage.railway configured", result: "fail", detail: `${healthRes.status} ${JSON.stringify(health)}` });
      } else {
        results.push({ criterion: "GET /api/health → database connected, storage.railway configured", result: "fail", detail: JSON.stringify(health) });
      }
    } catch (e: any) {
      results.push({ criterion: "GET /api/health → database connected, storage.railway configured", result: "fail", detail: e.message || "fetch failed" });
    }

    if (!TEST_PASSWORD || !TEST_EMAIL) {
      results.push({ criterion: "GET /api/storage/status → storageWorking, activeStorage railway", result: "skipped", detail: "TEST_EMAIL/TEST_PASSWORD not set" });
      results.push({ criterion: "GET /api/debug/upload-status → authenticated, Railway configured", result: "skipped", detail: "TEST_EMAIL/TEST_PASSWORD not set" });
    } else {
      let cookieHeader = "";
      try {
        const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
          credentials: "include",
        });
        if (!loginRes.ok) {
          const err = await loginRes.json().catch(() => ({}));
          results.push({ criterion: "GET /api/storage/status → storageWorking, activeStorage railway", result: "fail", detail: `Login failed: ${loginRes.status}` });
          results.push({ criterion: "GET /api/debug/upload-status → authenticated, Railway configured", result: "fail", detail: `Login failed: ${loginRes.status}` });
        } else {
          const setCookie = loginRes.headers.get("set-cookie");
          if (setCookie) cookieHeader = setCookie.split(";")[0];
          const storageRes = await fetch(`${BASE_URL}/api/storage/status`, { headers: { Cookie: cookieHeader }, credentials: "include" });
          const storage = await storageRes.json().catch(() => ({}));
          if (storageRes.ok && storage.storageWorking === true && storage.activeStorage === "railway") {
            results.push({ criterion: "GET /api/storage/status → storageWorking, activeStorage railway", result: "pass", detail: "OK" });
          } else {
            results.push({ criterion: "GET /api/storage/status → storageWorking, activeStorage railway", result: "fail", detail: JSON.stringify(storage) });
          }
          const debugRes = await fetch(`${BASE_URL}/api/debug/upload-status`, { headers: { Cookie: cookieHeader }, credentials: "include" });
          const debug = await debugRes.json().catch(() => ({}));
          if (debugRes.ok && debug.authentication?.isAuthenticated && debug.storage?.railway?.configured) {
            results.push({ criterion: "GET /api/debug/upload-status → authenticated, Railway configured", result: "pass", detail: "OK" });
          } else {
            results.push({ criterion: "GET /api/debug/upload-status → authenticated, Railway configured", result: "fail", detail: JSON.stringify(debug) });
          }
        }
      } catch (e: any) {
        results.push({ criterion: "GET /api/storage/status → storageWorking, activeStorage railway", result: "fail", detail: e.message || "request failed" });
        results.push({ criterion: "GET /api/debug/upload-status → authenticated, Railway configured", result: "fail", detail: e.message || "request failed" });
      }
    }
  }

  // 3. Manual UI steps (cannot automate without browser/session)
  results.push({ criterion: "Upload document in patient chart (UI)", result: "skipped", detail: "Manual: use E2E_CHECKLIST.md" });
  results.push({ criterion: "Load document after refresh (UI)", result: "skipped", detail: "Manual: use E2E_CHECKLIST.md" });
  results.push({ criterion: "Open/download document (no 404/500)", result: "skipped", detail: "Manual: use E2E_CHECKLIST.md" });
  results.push({ criterion: "Analyze radiograph from Railway Storage", result: "skipped", detail: "Manual: use E2E_CHECKLIST.md" });

  // Summary
  const passed = results.filter((r) => r.result === "pass").length;
  const failed = results.filter((r) => r.result === "fail").length;
  const skipped = results.filter((r) => r.result === "skipped").length;

  console.log("Results:\n");
  results.forEach((r) => {
    const icon = r.result === "pass" ? "PASS" : r.result === "fail" ? "FAIL" : "SKIP";
    console.log(`  [${icon}] ${r.criterion}`);
    if (r.detail && r.detail !== "OK") console.log(`       ${r.detail}`);
  });
  console.log(`\nSummary: ${passed} passed, ${failed} failed, ${skipped} skipped`);

  const report = `# E2E Verification Report
Generated: ${new Date().toISOString()}
BASE_URL: ${BASE_URL || "(not set)"}
TEST_EMAIL: ${TEST_EMAIL ? "(set)" : "(not set)"}

## Success criteria

| Criterion | Result | Detail |
|-----------|--------|--------|
${results.map((r) => `| ${r.criterion} | ${r.result} | ${r.detail.replace(/\|/g, "\\|").replace(/\n/g, " ")} |`).join("\n")}

## Summary
- Passed: ${passed}
- Failed: ${failed}
- Skipped: ${skipped}

## Next steps
- If any FAIL: run \`npm run baseline-diagnostics\` and \`npm run diagnose-storage\` with env set; check Railway logs for DB host type and storage errors.
- For full UI workflow: follow E2E_CHECKLIST.md (upload, refresh, open/download, radiograph).
- Automated upload API test: \`BASE_URL=... TEST_EMAIL=... TEST_PASSWORD=... npm run test-upload-fix\`
`;

  const reportPath = resolve(process.cwd(), "E2E_VERIFICATION_REPORT.md");
  writeFileSync(reportPath, report, "utf8");
  console.log(`\nReport written to ${reportPath}`);

  // Exit 1 only when a real check failed (not when everything was skipped due to missing env)
  const anyRealFailure = results.some((r) => r.result === "fail");
  if (anyRealFailure) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
