/**
 * Find Files in Supabase Storage
 * Shows which patient files are stored in Supabase
 * 
 * Usage: DATABASE_URL=your_url tsx scripts/find-supabase-files.ts
 */

import { ensureDb } from "../server/db";
import { patientFiles, patients } from "../shared/schema";
import { eq } from "drizzle-orm";

async function findSupabaseFiles() {
  console.log("🔍 Finding files stored in Supabase Storage...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL not set!");
    console.error("Get it from Railway dashboard and run:");
    console.error('DATABASE_URL="your_url" tsx scripts/find-supabase-files.ts\n');
    process.exit(1);
  }

  const db = ensureDb();

  try {
    // Get all files
    const allFiles = await db.select().from(patientFiles);
    
    // Get files that point to Supabase
    const supabaseFiles = allFiles.filter(file => 
      file.fileUrl.includes('supabase.co') || 
      file.fileUrl.startsWith('/api/objects/') // These might be in Supabase too
    );

    console.log(`📊 Total files: ${allFiles.length}`);
    console.log(`📦 Files likely in Supabase: ${supabaseFiles.length}\n`);

    if (supabaseFiles.length === 0) {
      console.log("❌ No files found with Supabase URLs.");
      console.log("\nAll file URLs:");
      allFiles.slice(0, 5).forEach(file => {
        console.log(`  - ${file.filename}: ${file.fileUrl.substring(0, 80)}...`);
      });
      return;
    }

    console.log("📋 Files stored in Supabase Storage:\n");

    // Get patient names for context
    for (const file of supabaseFiles.slice(0, 20)) { // Show first 20
      try {
        const patient = await db.select().from(patients).where(eq(patients.id, file.patientId)).limit(1);
        const patientName = patient[0]?.name || 'Unknown Patient';
        
        console.log(`📄 ${file.filename}`);
        console.log(`   Patient: ${patientName}`);
        console.log(`   URL: ${file.fileUrl.substring(0, 100)}${file.fileUrl.length > 100 ? '...' : ''}`);
        console.log(`   Type: ${file.fileType || 'unknown'}`);
        console.log('');
      } catch (e) {
        console.log(`📄 ${file.filename}`);
        console.log(`   URL: ${file.fileUrl.substring(0, 100)}${file.fileUrl.length > 100 ? '...' : ''}`);
        console.log('');
      }
    }

    if (supabaseFiles.length > 20) {
      console.log(`\n... and ${supabaseFiles.length - 20} more files\n`);
    }

    // Show URL patterns
    console.log("\n🔍 URL Pattern Examples:\n");
    const patterns = new Set(supabaseFiles.map(f => {
      if (f.fileUrl.includes('supabase.co')) {
        return 'Supabase URL (https://xxx.supabase.co/...)';
      } else if (f.fileUrl.startsWith('/api/objects/')) {
        return 'API Endpoint (/api/objects/...)';
      }
      return 'Other';
    }));
    
    patterns.forEach(pattern => {
      const example = supabaseFiles.find(f => {
        if (pattern.includes('Supabase')) return f.fileUrl.includes('supabase.co');
        if (pattern.includes('API')) return f.fileUrl.startsWith('/api/objects/');
        return true;
      });
      console.log(`   ${pattern}`);
      if (example) {
        console.log(`      Example: ${example.fileUrl.substring(0, 80)}...`);
      }
    });

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

findSupabaseFiles().catch(console.error);
