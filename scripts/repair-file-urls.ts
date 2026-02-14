/**
 * Repair file URLs to canonical format: /api/objects/uploads/...
 *
 * Normalizes:
 * - /objects/uploads/uuid -> /api/objects/uploads/uuid
 * - Full Supabase URLs -> no change (run migrate-storage first)
 *
 * Usage: DATABASE_URL=... tsx scripts/repair-file-urls.ts
 *        Add --dry-run to preview without updating
 */

import { ensureDb } from "../server/db";
import { patientFiles, patients } from "../shared/schema";
import { eq } from "drizzle-orm";

function toCanonical(url: string | null): string | null {
  if (!url || !url.trim()) return null;
  const u = url.trim();
  // Already canonical
  if (u.startsWith("/api/objects/uploads/")) return u;
  // Relative without /api prefix
  if (u.startsWith("/objects/uploads/")) return "/api" + u;
  return null;
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  if (dryRun) console.log("🔍 DRY RUN - no changes will be made\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL not set");
    process.exit(1);
  }

  const db = ensureDb();
  let repaired = 0;

  const files = await db.select({ id: patientFiles.id, fileUrl: patientFiles.fileUrl, filename: patientFiles.filename }).from(patientFiles);
  for (const f of files) {
    const canonical = toCanonical(f.fileUrl);
    if (canonical && canonical !== f.fileUrl) {
      console.log(`  patient_files ${f.filename}: ${f.fileUrl} -> ${canonical}`);
      if (!dryRun) {
        await db.update(patientFiles).set({ fileUrl: canonical }).where(eq(patientFiles.id, f.id));
      }
      repaired++;
    }
  }

  const patientRows = await db.select({ id: patients.id, photoUrl: patients.photoUrl, name: patients.name }).from(patients);
  for (const p of patientRows) {
    if (!p.photoUrl) continue;
    const canonical = toCanonical(p.photoUrl);
    if (canonical && canonical !== p.photoUrl) {
      console.log(`  patients.photoUrl ${p.name}: ${p.photoUrl} -> ${canonical}`);
      if (!dryRun) {
        await db.update(patients).set({ photoUrl: canonical }).where(eq(patients.id, p.id));
      }
      repaired++;
    }
  }

  console.log(`\n✅ Repaired ${repaired} URL(s)${dryRun ? " (dry run)" : ""}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
