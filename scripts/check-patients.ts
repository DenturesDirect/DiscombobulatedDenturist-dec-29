/**
 * Emergency: Check Patient Data
 * Shows all patients in the database
 * 
 * Usage: DATABASE_URL=your_url tsx scripts/check-patients.ts
 */

import { ensureDb } from "../server/db";
import { patients } from "../shared/schema";

async function checkPatients() {
  console.log("🔍 Checking patient data in database...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL not set!");
    console.error("Get it from Railway dashboard and run:");
    console.error('DATABASE_URL="your_url" tsx scripts/check-patients.ts\n');
    process.exit(1);
  }

  const db = ensureDb();

  try {
    const allPatients = await db.select().from(patients).orderBy(patients.createdAt);

    console.log(`📊 Total Patients Found: ${allPatients.length}\n`);

    if (allPatients.length === 0) {
      console.log("⚠️  WARNING: No patients found in database!");
      console.log("   This could mean:");
      console.log("   1. Wrong database connection");
      console.log("   2. Data was deleted");
      console.log("   3. Need to check backup");
      return;
    }

    console.log("📋 Patient List:\n");
    allPatients.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.name || '(No name)'}`);
      console.log(`   ID: ${patient.id}`);
      console.log(`   Created: ${patient.createdAt}`);
      console.log(`   Phone: ${patient.phone || 'N/A'}`);
      console.log(`   Email: ${patient.email || 'N/A'}`);
      console.log('');
    });

    // Show database connection info (without password)
    const dbUrl = process.env.DATABASE_URL;
    if (dbUrl) {
      try {
        const url = new URL(dbUrl.replace('postgresql://', 'https://'));
        console.log("\n🔗 Database Connection Info:");
        console.log(`   Host: ${url.hostname}`);
        console.log(`   Database: ${url.pathname.substring(1)}`);
      } catch (e) {
        // Ignore URL parsing errors
      }
    }

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error("\nThis might mean:");
    console.error("  1. Wrong DATABASE_URL");
    console.error("  2. Database connection failed");
    console.error("  3. Tables don't exist");
    process.exit(1);
  }
}

checkPatients().catch(console.error);
