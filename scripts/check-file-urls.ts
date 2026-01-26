/**
 * Check File URLs Script
 * Shows where your patient files are actually stored
 * 
 * Usage: DATABASE_URL=your_url tsx scripts/check-file-urls.ts
 */

import { ensureDb } from "../server/db";
import { patientFiles } from "../shared/schema";

async function checkFileUrls() {
  console.log("🔍 Checking where your patient files are stored...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL not set!");
    console.error("Get it from Railway dashboard and run:");
    console.error('DATABASE_URL="your_url" tsx scripts/check-file-urls.ts\n');
    process.exit(1);
  }

  const db = ensureDb();

  try {
    const files = await db.select().from(patientFiles).orderBy(patientFiles.uploadedAt);

    if (files.length === 0) {
      console.log("📭 No files found in database.");
      return;
    }

    console.log(`📁 Found ${files.length} file(s) in database:\n`);

    // Group files by URL pattern
    const urlPatterns: Record<string, number> = {};
    const examples: Record<string, string[]> = {};

    files.forEach(file => {
      const url = file.fileUrl;
      let pattern = 'unknown';
      
      if (url.includes('supabase.co')) {
        pattern = 'Supabase Storage';
      } else if (url.includes('railway.app') || url.includes('railway-storage')) {
        pattern = 'Railway Storage';
      } else if (url.includes('storage.googleapis.com')) {
        pattern = 'Google Cloud Storage (legacy)';
      } else if (url.startsWith('/api/objects/')) {
        pattern = 'API Endpoint (needs storage service)';
      } else {
        pattern = 'Other/Unknown';
      }

      urlPatterns[pattern] = (urlPatterns[pattern] || 0) + 1;
      if (!examples[pattern] || examples[pattern].length < 3) {
        if (!examples[pattern]) examples[pattern] = [];
        examples[pattern].push(url);
      }
    });

    console.log("📊 File Storage Breakdown:\n");
    Object.entries(urlPatterns).forEach(([pattern, count]) => {
      console.log(`   ${pattern}: ${count} file(s)`);
      if (examples[pattern] && examples[pattern].length > 0) {
        console.log(`      Example URL: ${examples[pattern][0]}`);
      }
    });

    console.log("\n📋 All File URLs:\n");
    files.forEach((file, index) => {
      console.log(`${index + 1}. ${file.filename}`);
      console.log(`   URL: ${file.fileUrl}`);
      console.log(`   Type: ${file.fileType || 'unknown'}`);
      console.log(`   Uploaded: ${file.uploadedAt}`);
      console.log('');
    });

    // Check what storage service is configured
    console.log("\n🔧 Storage Configuration Check:\n");
    
    const hasRailwayStorage = !!(process.env.RAILWAY_STORAGE_ACCESS_KEY_ID && 
                                  process.env.RAILWAY_STORAGE_SECRET_ACCESS_KEY && 
                                  process.env.RAILWAY_STORAGE_ENDPOINT);
    
    const hasSupabaseStorage = !!(process.env.SUPABASE_URL || process.env.SUPABASE_PROJECT_URL) &&
                               !!(process.env.SUPABASE_SERVICE_ROLE || process.env.SUPABASE_SERVICE_ROLE_KEY);

    console.log(`   Railway Storage: ${hasRailwayStorage ? '✅ Configured' : '❌ Not configured'}`);
    console.log(`   Supabase Storage: ${hasSupabaseStorage ? '✅ Configured' : '❌ Not configured'}`);

    if (!hasRailwayStorage && !hasSupabaseStorage) {
      console.log("\n⚠️  WARNING: No storage service configured!");
      console.log("   Files exist in database but can't be accessed.");
      console.log("   Set up Railway Storage to view/download files.");
    }

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

checkFileUrls().catch(console.error);
