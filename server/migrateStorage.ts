/**
 * Migrate Files from Supabase Storage to Railway Storage
 * 
 * This function:
 * 1. Downloads all files from Supabase Storage bucket
 * 2. Uploads them to Railway Storage
 * 3. Updates database URLs to point to Railway Storage
 */

import { ensureDb } from "./db";
import { patientFiles } from "../shared/schema";
import { getSupabaseClient } from "./supabaseStorage";
import { getS3Client } from "./railwayStorage.js";
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

  if (!railwayAccessKey || !railwaySecretKey || !railwayEndpoint) {
    throw new Error("Railway Storage not configured! Set RAILWAY_STORAGE_ACCESS_KEY_ID, RAILWAY_STORAGE_SECRET_ACCESS_KEY, and RAILWAY_STORAGE_ENDPOINT.");
  }

  const db = ensureDb();
  const s3 = getS3Client();
  const supabase = getSupabaseClient();

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
        let filePath = '';
        
        if (fileUrl.startsWith('/api/objects/')) {
          // API endpoint format: /api/objects/uploads/uuid
          filePath = fileUrl.replace('/api/objects/', '');
        } else if (fileUrl.includes('supabase.co')) {
          // Supabase URL format: https://xxx.supabase.co/storage/v1/object/sign/bucket/path
          const urlMatch = fileUrl.match(/\/object\/sign\/[^/]+\/(.+?)(\?|$)/);
          if (urlMatch) {
            filePath = urlMatch[1];
          } else {
            console.log(`   ⚠️  Could not parse Supabase URL: ${fileUrl}`);
            errors++;
            continue;
          }
        } else {
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
            .from('patient-files')
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
              .from('patient-files')
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

    console.log(`\n\n📊 Migration Summary:`);
    console.log(`   ✅ Migrated: ${migrated} file(s)`);
    console.log(`   ⏭️  Skipped: ${skipped} file(s)`);
    console.log(`   ❌ Errors: ${errors} file(s)`);
    console.log(`\n🎉 Migration complete!`);

  } catch (error: any) {
    console.error("\n❌ Migration failed:", error.message);
    throw error;
  }
}
