/**
 * Verify Data Restoration
 * 
 * Run this AFTER updating DATABASE_URL in Railway to verify your data is accessible.
 * 
 * Usage: DATABASE_URL="your_railway_postgres_url" tsx scripts/verify-data-restored.ts
 */

import { ensureDb } from "../server/db";
import { patients, clinicalNotes, tasks, offices, users } from "../shared/schema";
import { sql } from "drizzle-orm";

async function verifyDataRestored() {
  console.log("🔍 Verifying Data Restoration...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL not set!");
    console.error("Set it to your Railway Postgres connection string and run again.");
    process.exit(1);
  }

  // Check if it's pointing to Railway or Supabase
  const dbUrl = process.env.DATABASE_URL;
  const isRailway = dbUrl.includes("railway") || dbUrl.includes("railway.internal");
  const isSupabase = dbUrl.includes("supabase");

  console.log("📊 Database Connection Info:");
  if (isRailway) {
    console.log("   ✅ Connected to: Railway Postgres");
  } else if (isSupabase) {
    console.log("   ⚠️  Connected to: Supabase Postgres");
    console.log("   ⚠️  WARNING: Your real data is in Railway Postgres!");
    console.log("   ⚠️  You need to update DATABASE_URL in Railway web service.");
  } else {
    console.log("   ⚠️  Unknown database provider");
  }
  console.log("");

  const db = ensureDb();

  try {
    // Count patients
    const patientCount = await db.select().from(patients);
    console.log(`📋 Patients: ${patientCount.length}`);

    // Count clinical notes
    const notesCount = await db.select().from(clinicalNotes);
    console.log(`📝 Clinical Notes: ${notesCount.length}`);

    // Count tasks
    const tasksCount = await db.select().from(tasks);
    console.log(`✅ Tasks: ${tasksCount.length}`);

    // Count offices
    const officesCount = await db.select().from(offices);
    console.log(`🏢 Offices: ${officesCount.length}`);

    // Count users
    const usersCount = await db.select().from(users);
    console.log(`👥 Users: ${usersCount.length}`);

    // Office distribution
    const officeDist = await db.execute(sql`
      SELECT office_id, COUNT(*) as count 
      FROM patients 
      WHERE office_id IS NOT NULL
      GROUP BY office_id 
      ORDER BY count DESC
    `);
    
    if (officeDist.rows.length > 0) {
      console.log("\n🏢 Patient Distribution by Office:");
      officeDist.rows.forEach((row: any) => {
        console.log(`   Office ${row.office_id}: ${row.count} patients`);
      });
    }

    // Assessment
    console.log("\n🎯 Assessment:");
    if (patientCount.length > 50 && (notesCount.length > 0 || tasksCount.length > 0)) {
      console.log("   ✅ SUCCESS! Your real patient data is accessible!");
      console.log(`   ✅ Found ${patientCount.length} patients with clinical activity`);
      
      if (isSupabase) {
        console.log("\n   ⚠️  BUT: You're connected to Supabase, not Railway!");
        console.log("   ⚠️  This means your data might be duplicated.");
        console.log("   ⚠️  Make sure DATABASE_URL points to Railway Postgres.");
      } else if (isRailway) {
        console.log("\n   ✅ Perfect! Connected to Railway Postgres where your data lives.");
      }
    } else if (patientCount.length > 0 && patientCount.length < 15 && notesCount.length === 0) {
      console.log("   ⚠️  WARNING: Only test/seed data found!");
      console.log(`   ⚠️  Found ${patientCount.length} patients but no clinical notes or tasks`);
      console.log("   ⚠️  Your real data is likely in Railway Postgres.");
      console.log("   ⚠️  Update DATABASE_URL in Railway web service to Railway Postgres URL.");
    } else if (patientCount.length === 0) {
      console.log("   ❌ ERROR: No patients found!");
      console.log("   ❌ Database is empty or wrong database connection.");
      console.log("   ❌ Check that DATABASE_URL points to Railway Postgres.");
    } else {
      console.log("   ⚠️  Unclear status - needs manual verification");
    }

    console.log("\n💡 Next Steps:");
    if (isSupabase || (patientCount.length < 50 && patientCount.length > 0)) {
      console.log("   1. Go to Railway Dashboard → Postgres service → Variables");
      console.log("   2. Copy the DATABASE_URL or POSTGRES_URL");
      console.log("   3. Go to Railway Dashboard → web service → Variables");
      console.log("   4. Update DATABASE_URL to Railway Postgres connection string");
      console.log("   5. Wait for redeploy and run this script again");
    } else if (patientCount.length > 50) {
      console.log("   ✅ Data restoration successful!");
      console.log("   ✅ Your app should now show all patients.");
      console.log("   ✅ Log into your app and verify patient count matches.");
    }

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error("\nThis might mean:");
    console.error("  1. Wrong DATABASE_URL");
    console.error("  2. Database connection failed");
    console.error("  3. Tables don't exist");
    console.error("  4. Network connectivity issue");
    process.exit(1);
  }
}

verifyDataRestored().catch(console.error);
