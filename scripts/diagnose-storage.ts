/**
 * Storage Diagnostic Script
 *
 * Checks if each file/photo exists in Supabase or Railway storage.
 *
 * Usage:
 *   DATABASE_URL=... tsx scripts/diagnose-storage.ts
 *
 * Optional:
 *   MAX_CHECKS=100          # limit total checks
 *   SUPABASE_STORAGE_BUCKET # override bucket name (default patient-files)
 *   RAILWAY_STORAGE_BUCKET_NAME
 */

import { ensureDb } from "../server/db";
import { patientFiles, patients } from "../shared/schema";
import { getSupabaseClient } from "../server/supabaseStorage";
import { getS3Client } from "../server/railwayStorage";
import { HeadObjectCommand } from "@aws-sdk/client-s3";

type FileRef = {
  id: string;
  label: string;
  url: string;
  source: "patient_files" | "patients.photoUrl";
};

function extractObjectPath(rawUrl: string): string | null {
  if (!rawUrl) return null;

  if (rawUrl.startsWith("/api/objects/")) {
    return rawUrl.replace("/api/objects/", "");
  }

  if (rawUrl.startsWith("/objects/")) {
    return rawUrl.replace("/objects/", "");
  }

  if (rawUrl.includes("/storage/v1/object/")) {
    try {
      const url = new URL(rawUrl);
      const parts = url.pathname.split("/").filter(Boolean);
      const objectIndex = parts.findIndex((p) => p === "object");
      if (objectIndex >= 0) {
        let bucketIndex = objectIndex + 1;
        const marker = parts[bucketIndex];
        if (marker === "public" || marker === "sign") {
          bucketIndex += 1;
        }
        const objectPath = parts.slice(bucketIndex + 1).join("/");
        return objectPath || null;
      }
    } catch {
      return null;
    }
  }

  return null;
}

async function checkSupabaseExists(objectPath: string): Promise<boolean | "not-configured"> {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) return "not-configured";

  const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET || "patient-files";
  const supabase = getSupabaseClient();

  const pathParts = objectPath.split("/");
  const fileName = pathParts.pop() || "";
  const folderPath = pathParts.join("/");

  try {
    const { data, error } = await supabase.storage
      .from(supabaseBucket)
      .list(folderPath || "", {
        limit: 1000,
        search: fileName,
      });

    if (error || !data) return false;
    return data.some((item) => item.name === fileName);
  } catch {
    return false;
  }
}

async function checkRailwayExists(objectPath: string): Promise<boolean | "not-configured"> {
  const railwayAccessKey = process.env.RAILWAY_STORAGE_ACCESS_KEY_ID;
  const railwaySecretKey = process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY;
  const railwayEndpoint = process.env.RAILWAY_STORAGE_ENDPOINT;
  if (!railwayAccessKey || !railwaySecretKey || !railwayEndpoint) return "not-configured";

  const railwayBucket = process.env.RAILWAY_STORAGE_BUCKET_NAME || "patient-files";
  const s3 = getS3Client();

  try {
    const head = new HeadObjectCommand({
      Bucket: railwayBucket,
      Key: objectPath,
    });
    await s3.send(head);
    return true;
  } catch {
    return false;
  }
}

async function diagnoseStorage() {
  console.log("🔎 Running storage diagnostics...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL not set!");
    console.error('DATABASE_URL="your_url" tsx scripts/diagnose-storage.ts\n');
    process.exit(1);
  }

  const db = ensureDb();
  const maxChecks = Number(process.env.MAX_CHECKS || 50);

  const fileRows = await db.select().from(patientFiles);
  const patientRows = await db.select().from(patients);

  const refs: FileRef[] = [
    ...fileRows.map((file) => ({
      id: file.id,
      label: file.filename,
      url: file.fileUrl,
      source: "patient_files" as const,
    })),
    ...patientRows
      .filter((patient) => !!patient.photoUrl)
      .map((patient) => ({
        id: patient.id,
        label: patient.name,
        url: patient.photoUrl as string,
        source: "patients.photoUrl" as const,
      })),
  ];

  if (refs.length === 0) {
    console.log("📭 No files/photos found in database.");
    return;
  }

  console.log(`📁 Found ${refs.length} file/photo references in database.`);
  console.log(`🔢 Checking up to ${maxChecks} items.\n`);

  let okSupabase = 0;
  let okRailway = 0;
  let missing = 0;
  let unknown = 0;
  let skipped = 0;

  for (const ref of refs.slice(0, maxChecks)) {
    const objectPath = extractObjectPath(ref.url);
    if (!objectPath) {
      console.log(`⚠️  Unknown URL format (${ref.source}): ${ref.label}`);
      console.log(`    ${ref.url}\n`);
      unknown++;
      continue;
    }

    const supabaseResult = await checkSupabaseExists(objectPath);
    const railwayResult = await checkRailwayExists(objectPath);

    const supabaseOk = supabaseResult === true;
    const railwayOk = railwayResult === true;

    if (supabaseResult === "not-configured" && railwayResult === "not-configured") {
      skipped++;
      console.log(`⏭️  Skipped (no storage configured): ${ref.label}`);
      continue;
    }

    if (supabaseOk) okSupabase++;
    if (railwayOk) okRailway++;

    if (!supabaseOk && !railwayOk) {
      missing++;
      console.log(`❌ Missing in both: ${ref.label}`);
      console.log(`    ${ref.url}\n`);
    }
  }

  console.log("\n📊 Diagnostic Summary:");
  console.log(`   ✅ Found in Supabase: ${okSupabase}`);
  console.log(`   ✅ Found in Railway: ${okRailway}`);
  console.log(`   ❌ Missing in both: ${missing}`);
  console.log(`   ⚠️  Unknown URL format: ${unknown}`);
  console.log(`   ⏭️  Skipped (no config): ${skipped}`);
  console.log("\n✅ Done.");
}

diagnoseStorage().catch((error) => {
  console.error("\n❌ Diagnostic failed:", error.message);
  process.exit(1);
});
