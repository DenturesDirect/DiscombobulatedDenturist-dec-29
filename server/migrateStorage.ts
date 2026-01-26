/**
 * Migrate Files from Supabase Storage to Railway Storage
 * 
 * This function:
 * 1. Downloads all files from Supabase Storage bucket
 * 2. Uploads them to Railway Storage
 * 3. Updates database URLs to point to Railway Storage
 */

import { ensureDb } from "./db";
import { patientFiles, patients } from "../shared/schema";
import { getSupabaseClient } from "./supabaseStorage";
import { getS3Client } from "./railwayStorage";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { eq } from "drizzle-orm";

export async function migrateStorage() {
  console.log("🔄 Starting migration from Supabase Storage to Railway Storage...\n");

  // Check Supabase config
  const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Supabase not configured! Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.");
  }

  // Check Railway Storage config
  const railwayAccessKey = process.env.RAILWAY_STORAGE_ACCESS_KEY_ID;
  const railwaySecretKey = process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY;
  const railwayEndpoint = process.env.RAILWAY_STORAGE_ENDPOINT;
  const railwayBucket = process.env.RAILWAY_STORAGE_BUCKET_NAME || "patient-files";
  const supabaseBucket = process.env.SUPABASE_STORAGE_BUCKET || "patient-files";

  if (!railwayAccessKey || !railwaySecretKey || !railwayEndpoint) {
    throw new Error("Railway Storage not configured! Set RAILWAY_STORAGE_ACCESS_KEY_ID, RAILWAY_STORAGE_SECRET_ACCESS_KEY, and RAILWAY_STORAGE_ENDPOINT.");
  }

  const db = ensureDb();
  const s3 = getS3Client();
  const supabase = getSupabaseClient();

  const extractSupabaseFilePath = (fileUrl: string): string | null => {
    if (!fileUrl) return null;

    if (fileUrl.startsWith("/api/objects/")) {
      return fileUrl.replace("/api/objects/", "");
    }

    if (fileUrl.startsWith("/objects/")) {
      return fileUrl.replace("/objects/", "");
    }

    if (fileUrl.includes("/storage/v1/object/")) {
      try {
        const url = new URL(fileUrl);
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
  };

  try {
    // Get all files from database
    const allFiles = await db.select().from(patientFiles);
    console.log(`📁 Found ${allFiles.length} file(s) in database\n`);

    if (allFiles.length === 0) {
      console.log("📭 No files to migrate.");
      return;
    }

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    // Process each file
    for (const file of allFiles) {
      try {
        const fileUrl = file.fileUrl;
        console.log(`\n📄 Processing: ${file.filename}`);

        // Check if already migrated (points to Railway)
        if (fileUrl.includes('railway.app') || fileUrl.includes('storage.railway.app')) {
          console.log(`   ⏭️  Already in Railway Storage, skipping...`);
          skipped++;
          continue;
        }

        // Extract file path from URL
        const filePath = extractSupabaseFilePath(fileUrl);
        if (!filePath) {
          console.log(`   ⚠️  Unknown URL format: ${fileUrl}`);
          errors++;
          continue;
        }

        console.log(`   📥 Downloading from Supabase: ${filePath}`);

        // Download from Supabase
        let fileData: Buffer;
        let contentType = file.fileType || 'application/octet-stream';

        try {
          // Download the file directly from Supabase Storage
          const { data, error } = await supabase.storage
            .from(supabaseBucket)
            .download(filePath);

          if (error || !data) {
            throw new Error(`Failed to download: ${error?.message || 'Unknown error'}`);
          }

          // Convert to buffer
          const arrayBuffer = await data.arrayBuffer();
          fileData = Buffer.from(arrayBuffer);
          
          // Try to get content type from file metadata
          try {
            const folderPath = filePath.split('/').slice(0, -1).join('/');
            const fileName = filePath.split('/').pop() || '';
            const { data: metadata } = await supabase.storage
              .from(supabaseBucket)
              .list(folderPath || '', {
                search: fileName
              });
            
            if (metadata && metadata[0]?.metadata?.mimetype) {
              contentType = metadata[0].metadata.mimetype;
            }
          } catch (e) {
            // Use file type from database if metadata unavailable
          }

        } catch (error: any) {
          console.log(`   ❌ Failed to download from Supabase: ${error.message}`);
          errors++;
          continue;
        }

        console.log(`   📤 Uploading to Railway Storage...`);

        // Upload to Railway Storage
        const railwayPath = `uploads/${filePath.split('/').pop() || file.id}`;
        
        try {
          const uploadCommand = new PutObjectCommand({
            Bucket: railwayBucket,
            Key: railwayPath,
            Body: fileData,
            ContentType: contentType,
          });

          await s3.send(uploadCommand);
          console.log(`   ✅ Uploaded to Railway: ${railwayPath}`);

          // Update database URL
          const newUrl = `/api/objects/${railwayPath}`;
          await db.update(patientFiles)
            .set({ fileUrl: newUrl })
            .where(eq(patientFiles.id, file.id));

          console.log(`   ✅ Updated database URL`);
          migrated++;

        } catch (error: any) {
          console.log(`   ❌ Failed to upload to Railway: ${error.message}`);
          errors++;
          continue;
        }

      } catch (error: any) {
        console.log(`   ❌ Error processing file: ${error.message}`);
        errors++;
      }
    }

    console.log(`\n\n📊 File Migration Summary:`);
    console.log(`   ✅ Migrated: ${migrated} file(s)`);
    console.log(`   ⏭️  Skipped: ${skipped} file(s)`);
    console.log(`   ❌ Errors: ${errors} file(s)`);

    // Migrate patient avatar photos
    const allPatients = await db.select().from(patients);
    console.log(`\n🧑‍⚕️ Found ${allPatients.length} patient(s) to check for avatar photos\n`);

    let photoMigrated = 0;
    let photoSkipped = 0;
    let photoErrors = 0;

    for (const patient of allPatients) {
      if (!patient.photoUrl) {
        photoSkipped++;
        continue;
      }

      if (patient.photoUrl.includes("railway.app") || patient.photoUrl.includes("storage.railway.app")) {
        photoSkipped++;
        continue;
      }

      try {
        const filePath = extractSupabaseFilePath(patient.photoUrl);
        if (!filePath) {
          console.log(`   ⚠️  Unknown photo URL format for ${patient.name}: ${patient.photoUrl}`);
          photoErrors++;
          continue;
        }

        console.log(`\n🧑‍⚕️ Migrating photo for ${patient.name}`);
        console.log(`   📥 Downloading from Supabase: ${filePath}`);

        const { data, error } = await supabase.storage
          .from(supabaseBucket)
          .download(filePath);

        if (error || !data) {
          throw new Error(`Failed to download: ${error?.message || "Unknown error"}`);
        }

        const arrayBuffer = await data.arrayBuffer();
        const fileData = Buffer.from(arrayBuffer);
        const extension = filePath.split(".").pop()?.toLowerCase();
        const contentType =
          extension === "png"
            ? "image/png"
            : extension === "webp"
              ? "image/webp"
              : extension === "gif"
                ? "image/gif"
                : "image/jpeg";

        const railwayPath = `uploads/${filePath.split("/").pop() || patient.id}`;

        console.log(`   📤 Uploading to Railway Storage...`);
        const uploadCommand = new PutObjectCommand({
          Bucket: railwayBucket,
          Key: railwayPath,
          Body: fileData,
          ContentType: contentType,
        });

        await s3.send(uploadCommand);
        const newUrl = `/api/objects/${railwayPath}`;

        await db
          .update(patients)
          .set({ photoUrl: newUrl })
          .where(eq(patients.id, patient.id));

        console.log(`   ✅ Updated patient photo URL`);
        photoMigrated++;
      } catch (error: any) {
        console.log(`   ❌ Failed to migrate photo: ${error.message}`);
        photoErrors++;
      }
    }

    console.log(`\n\n📊 Patient Photo Migration Summary:`);
    console.log(`   ✅ Migrated: ${photoMigrated} photo(s)`);
    console.log(`   ⏭️  Skipped: ${photoSkipped} photo(s)`);
    console.log(`   ❌ Errors: ${photoErrors} photo(s)`);
    console.log(`\n🎉 Migration complete!`);

  } catch (error: any) {
    console.error("\n❌ Migration failed:", error.message);
    throw error;
  }
}
