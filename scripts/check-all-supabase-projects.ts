/**
 * Check All Supabase Projects
 * Helps identify which Supabase project has your patient data
 * 
 * Usage: tsx scripts/check-all-supabase-projects.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env files
config({ path: resolve(process.cwd(), ".env", ".env") });
config({ path: resolve(process.cwd(), ".env") });

console.log("🔍 Supabase Project Connection Check\n");
console.log("=".repeat(60));

const currentDatabaseUrl = process.env.DATABASE_URL;

if (!currentDatabaseUrl) {
  console.error("❌ DATABASE_URL not set!");
  process.exit(1);
}

// Extract project info
console.log("\n📊 Current Connection:");
try {
  const url = new URL(currentDatabaseUrl.replace('postgresql://', 'https://'));
  const hostname = url.hostname;
  
  // Extract project reference from connection string
  let projectRef = 'unknown';
  if (currentDatabaseUrl.includes('postgres.')) {
    const match = currentDatabaseUrl.match(/postgres\.([^:]+):/);
    if (match) {
      projectRef = match[1];
    }
  } else if (hostname.includes('supabase.co')) {
    const match = hostname.match(/db\.([^.]+)\.supabase\.co/);
    if (match) {
      projectRef = match[1];
    }
  }
  
  console.log(`   Host: ${hostname}`);
  console.log(`   Project Reference: ${projectRef}`);
  console.log(`   Database: ${url.pathname.substring(1)}`);
  console.log(`   Connection String: ${currentDatabaseUrl.substring(0, 80)}...`);
  
  console.log("\n" + "=".repeat(60));
  console.log("📋 NEXT STEPS TO FIND YOUR 150 PATIENTS:");
  console.log("=".repeat(60));
  
  console.log("\n1. ✅ Go to Supabase Dashboard:");
  console.log("   https://supabase.com/dashboard");
  
  console.log("\n2. ✅ Check ALL Your Projects:");
  console.log("   - Look at the list of all projects");
  console.log("   - For each project, check the patient count");
  console.log("   - Your 150 patients might be in a different project!");
  
  console.log("\n3. ✅ For Each Project:");
  console.log("   - Click on the project");
  console.log("   - Go to: Table Editor → patients table");
  console.log("   - Check the row count at the bottom");
  console.log("   - Note which project has ~150 patients");
  
  console.log("\n4. ✅ Get Connection String from Correct Project:");
  console.log("   - Project Settings → Database");
  console.log("   - Connection string → 'Session' tab");
  console.log("   - Copy the connection string");
  console.log("   - It should look like:");
  console.log("     postgresql://postgres.[PROJECT-REF]:[PASSWORD]@");
  console.log("     aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true");
  
  console.log("\n5. ✅ Update DATABASE_URL:");
  console.log("   - Railway: Dashboard → Service → Variables → DATABASE_URL");
  console.log("   - Local: Update .env/.env file");
  console.log("   - Paste the NEW connection string");
  
  console.log("\n6. ✅ Verify:");
  console.log("   npm run check-patients");
  console.log("   Should show your 150 patients!");
  
  console.log("\n" + "=".repeat(60));
  console.log("💡 IMPORTANT:");
  console.log("=".repeat(60));
  console.log("\nYour current project reference is: " + projectRef);
  console.log("If your 150 patients are in a DIFFERENT project,");
  console.log("you need to update DATABASE_URL to point to that project.");
  console.log("\nDO NOT reset anything - just reconnect to the correct project!");
  console.log("=".repeat(60));
  
} catch (error: any) {
  console.error("❌ Error parsing connection string:", error.message);
  console.log("\nYour DATABASE_URL is set, but I couldn't parse it.");
  console.log("Please check your Supabase dashboard manually:");
  console.log("1. Go to https://supabase.com/dashboard");
  console.log("2. Check all projects for patient data");
  console.log("3. Get connection string from the project with 150 patients");
}
