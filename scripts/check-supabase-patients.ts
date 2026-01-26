/**
 * Check Patient Data in Supabase Database
 * Shows all patients in Supabase (if you have Supabase configured)
 * 
 * Usage: SUPABASE_DATABASE_URL=your_supabase_url tsx scripts/check-supabase-patients.ts
 */

import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "../shared/schema";

const { Pool } = pg;

async function checkSupabasePatients() {
  console.log("🔍 Checking patient data in Supabase database...\n");

  // Try to get Supabase database URL from environment
  // Supabase connection string format: postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
  const supabaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!supabaseUrl || !supabaseUrl.includes('supabase.co')) {
    console.error("❌ ERROR: Supabase database URL not found!");
    console.error("\n💡 To check Supabase database:");
    console.error("   1. Go to Supabase Dashboard → Project Settings → Database");
    console.error("   2. Copy the 'Connection string' (URI format)");
    console.error("   3. Run: SUPABASE_DATABASE_URL='your_supabase_url' npm run check-supabase-patients");
    console.error("\n   Or if you have it in Railway Variables:");
    console.error("   - Get SUPABASE_URL from Railway");
    console.error("   - Construct: postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres");
    process.exit(1);
  }

  const pool = new Pool({ 
    connectionString: supabaseUrl,
  });

  const db = drizzle(pool, { schema });

  try {
    const allPatients = await db.select().from(schema.patients).orderBy(schema.patients.createdAt);

    console.log(`📊 Total Patients Found in Supabase: ${allPatients.length}\n`);

    if (allPatients.length === 0) {
      console.log("📭 No patients found in Supabase database.");
      console.log("   This means either:");
      console.log("   1. Supabase was never used for patient data");
      console.log("   2. Data was migrated to Railway");
      console.log("   3. Data was deleted");
      return;
    }

    console.log("📋 Patient List from Supabase:\n");
    allPatients.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.name || '(No name)'}`);
      console.log(`   ID: ${patient.id}`);
      console.log(`   Created: ${patient.createdAt}`);
      console.log(`   Phone: ${patient.phone || 'N/A'}`);
      console.log(`   Email: ${patient.email || 'N/A'}`);
      console.log('');
    });

    // Show database connection info (without password)
    try {
      const url = new URL(supabaseUrl.replace('postgresql://', 'https://'));
      console.log("\n🔗 Supabase Database Connection Info:");
      console.log(`   Host: ${url.hostname}`);
      console.log(`   Database: ${url.pathname.substring(1)}`);
    } catch (e) {
      // Ignore URL parsing errors
    }

    console.log("\n⚠️  IMPORTANT:");
    console.log("   If you see patients here, they're in Supabase, NOT Railway!");
    console.log("   Your Railway app won't see them unless you:");
    console.log("   1. Migrate data from Supabase to Railway, OR");
    console.log("   2. Change DATABASE_URL in Railway to point to Supabase");

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error("\nThis might mean:");
    console.error("  1. Wrong Supabase connection string");
    console.error("  2. Database connection failed");
    console.error("  3. Tables don't exist in Supabase");
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkSupabasePatients().catch(console.error);
