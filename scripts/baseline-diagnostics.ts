/**
 * Baseline diagnostics - capture current config and file URL formats before changes.
 * Run with: DATABASE_URL=... tsx scripts/baseline-diagnostics.ts
 *
 * Use for rollback documentation and to confirm file_url formats in patient_files.
 */
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env") });
config({ path: resolve(process.cwd(), ".env", ".env") });

function getDbHostType(url: string | undefined): "railway" | "supabase" | "unknown" {
  if (!url) return "unknown";
  if (url.includes("railway.internal") || url.includes("railway.app")) return "railway";
  if (url.includes("supabase.co") || url.includes("pooler.supabase.com")) return "supabase";
  return "unknown";
}

function redactUrl(url: string | undefined): string {
  if (!url) return "(not set)";
  try {
    const u = new URL(url.replace(/^postgresql:/, "https:"));
    const host = u.hostname;
    return `${u.protocol}//***@${host}${u.pathname}`;
  } catch {
    return "(invalid)";
  }
}

async function main() {
  console.log("=== Baseline Diagnostics (pre-Railway consolidation) ===\n");

  const dbUrl = process.env.DATABASE_URL;
  const dbHostType = getDbHostType(dbUrl);

  console.log("1. DATABASE_URL:");
  console.log(`   Host type: ${dbHostType}`);
  console.log(`   Redacted: ${redactUrl(dbUrl)}\n`);

  console.log("2. Storage configuration:");
  const hasRailway =
    !!(process.env.RAILWAY_STORAGE_ACCESS_KEY_ID &&
      process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY &&
      process.env.RAILWAY_STORAGE_ENDPOINT);
  const hasSupabase =
    !!(process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL) &&
    !!(process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.log(`   Railway: ${hasRailway ? "configured" : "not configured"}`);
  console.log(`   Supabase: ${hasSupabase ? "configured" : "not configured"}\n`);

  if (dbUrl && dbHostType !== "unknown") {
    const { ensureDb } = await import("../server/db").catch(() => ({ ensureDb: null }));
    if (ensureDb) {
      try {
        const db = ensureDb();
        const { patientFiles } = await import("../shared/schema");
        const rows = await db.select({ fileUrl: patientFiles.fileUrl }).from(patientFiles).limit(20);
        const formats = new Set<string>();
        for (const r of rows) {
          const u = r.fileUrl || "";
          if (u.startsWith("/api/objects/")) formats.add("/api/objects/...");
          else if (u.includes("supabase.co/storage")) formats.add("supabase full URL");
          else if (u.startsWith("/objects/")) formats.add("/objects/...");
          else if (u) formats.add("other");
        }
        console.log("3. Sample patient_files.file_url formats:");
        console.log(`   Total sampled: ${rows.length}`);
        console.log(`   Formats found: ${[...formats].join(", ") || "(none)"}\n`);
      } catch (e: any) {
        console.log("3. patient_files check:", e.message || e, "\n");
      }
    }
  }

  console.log("4. Call these endpoints on your running app for live status:");
  console.log("   GET /api/health");
  console.log("   GET /api/storage/status (auth required)");
  console.log("   GET /api/debug/upload-status (auth required)\n");
  console.log("=== End baseline ===");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
