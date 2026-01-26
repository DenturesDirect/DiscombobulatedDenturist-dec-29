/**
 * Compare Databases - Find Where Your Real Data Is
 * 
 * This script checks both Railway Postgres and Supabase databases
 * to identify which one contains your real patient data.
 * 
 * Usage:
 *   Railway: DATABASE_URL="railway_url" tsx scripts/compare-databases.ts
 *   Supabase: DATABASE_URL="supabase_url" tsx scripts/compare-databases.ts
 * 
 * Or check both:
 *   RAILWAY_DB_URL="railway_url" SUPABASE_DB_URL="supabase_url" tsx scripts/compare-databases.ts
 */

import pg from "pg";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env files
config({ path: resolve(process.cwd(), ".env", ".env") });
config({ path: resolve(process.cwd(), ".env") });

const { Pool } = pg;

interface DatabaseStats {
  name: string;
  url: string;
  canConnect: boolean;
  error?: string;
  patients: number;
  clinicalNotes: number;
  labNotes: number;
  adminNotes: number;
  tasks: number;
  patientFiles: number;
  users: number;
  offices: number;
  officeDistribution: Record<string, number>;
  userOfficeDistribution: Record<string, number>;
  samplePatientIds: string[];
}

async function checkDatabase(name: string, url: string): Promise<DatabaseStats> {
  const stats: DatabaseStats = {
    name,
    url: url.replace(/:([^:@]+)@/, ":****@"), // Mask password
    canConnect: false,
    patients: 0,
    clinicalNotes: 0,
    labNotes: 0,
    adminNotes: 0,
    tasks: 0,
    patientFiles: 0,
    users: 0,
    offices: 0,
    officeDistribution: {},
    userOfficeDistribution: {},
    samplePatientIds: [],
  };

  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    stats.canConnect = true;

    // Count patients
    try {
      const patientsResult = await client.query("SELECT COUNT(*) FROM patients");
      stats.patients = parseInt(patientsResult.rows[0].count);
    } catch (e: any) {
      if (!e.message.includes("does not exist")) {
        throw e;
      }
    }

    // Count clinical notes
    try {
      const notesResult = await client.query("SELECT COUNT(*) FROM clinical_notes");
      stats.clinicalNotes = parseInt(notesResult.rows[0].count);
    } catch (e: any) {
      if (!e.message.includes("does not exist")) {
        throw e;
      }
    }

    // Count lab notes
    try {
      const labNotesResult = await client.query("SELECT COUNT(*) FROM lab_notes");
      stats.labNotes = parseInt(labNotesResult.rows[0].count);
    } catch (e: any) {
      if (!e.message.includes("does not exist")) {
        throw e;
      }
    }

    // Count admin notes
    try {
      const adminNotesResult = await client.query("SELECT COUNT(*) FROM admin_notes");
      stats.adminNotes = parseInt(adminNotesResult.rows[0].count);
    } catch (e: any) {
      if (!e.message.includes("does not exist")) {
        throw e;
      }
    }

    // Count tasks
    try {
      const tasksResult = await client.query("SELECT COUNT(*) FROM tasks");
      stats.tasks = parseInt(tasksResult.rows[0].count);
    } catch (e: any) {
      if (!e.message.includes("does not exist")) {
        throw e;
      }
    }

    // Count patient files
    try {
      const filesResult = await client.query("SELECT COUNT(*) FROM patient_files");
      stats.patientFiles = parseInt(filesResult.rows[0].count);
    } catch (e: any) {
      if (!e.message.includes("does not exist")) {
        throw e;
      }
    }

    // Count users
    try {
      const usersResult = await client.query("SELECT COUNT(*) FROM users");
      stats.users = parseInt(usersResult.rows[0].count);
    } catch (e: any) {
      if (!e.message.includes("does not exist")) {
        throw e;
      }
    }

    // Count offices
    try {
      const officesResult = await client.query("SELECT COUNT(*) FROM offices");
      stats.offices = parseInt(officesResult.rows[0].count);
    } catch (e: any) {
      if (!e.message.includes("does not exist")) {
        throw e;
      }
    }

    // Get office distribution for patients
    try {
      const officeDistResult = await client.query(`
        SELECT office_id, COUNT(*) as count 
        FROM patients 
        WHERE office_id IS NOT NULL
        GROUP BY office_id 
        ORDER BY count DESC
      `);
      officeDistResult.rows.forEach((row: any) => {
        stats.officeDistribution[row.office_id || "null"] = parseInt(row.count);
      });
    } catch (e: any) {
      // Table might not exist or column might not exist
    }

    // Get office distribution for users
    try {
      const userOfficeDistResult = await client.query(`
        SELECT office_id, COUNT(*) as count 
        FROM users 
        WHERE office_id IS NOT NULL
        GROUP BY office_id 
        ORDER BY count DESC
      `);
      userOfficeDistResult.rows.forEach((row: any) => {
        stats.userOfficeDistribution[row.office_id || "null"] = parseInt(row.count);
      });
    } catch (e: any) {
      // Table might not exist or column might not exist
    }

    // Get sample patient IDs (first 5, no names)
    try {
      const sampleResult = await client.query(`
        SELECT id FROM patients ORDER BY created_at DESC LIMIT 5
      `);
      stats.samplePatientIds = sampleResult.rows.map((row: any) => row.id);
    } catch (e: any) {
      // Ignore errors
    }

    client.release();
    await pool.end();
  } catch (error: any) {
    stats.error = error.message;
    try {
      await pool.end();
    } catch {
      // Ignore cleanup errors
    }
  }

  return stats;
}

function printStats(stats: DatabaseStats) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`📊 ${stats.name}`);
  console.log(`${"=".repeat(70)}`);
  console.log(`🔗 Connection: ${stats.url.substring(0, 60)}...`);

  if (!stats.canConnect) {
    console.log(`❌ Cannot connect: ${stats.error || "Unknown error"}`);
    return;
  }

  console.log(`\n📈 Data Counts:`);
  console.log(`   Patients:        ${stats.patients}`);
  console.log(`   Clinical Notes:  ${stats.clinicalNotes}`);
  console.log(`   Lab Notes:       ${stats.labNotes}`);
  console.log(`   Admin Notes:     ${stats.adminNotes}`);
  console.log(`   Tasks:           ${stats.tasks}`);
  console.log(`   Patient Files:   ${stats.patientFiles}`);
  console.log(`   Users:           ${stats.users}`);
  console.log(`   Offices:         ${stats.offices}`);

  if (Object.keys(stats.officeDistribution).length > 0) {
    console.log(`\n🏢 Patient Distribution by Office:`);
    Object.entries(stats.officeDistribution)
      .sort(([, a], [, b]) => b - a)
      .forEach(([officeId, count]) => {
        console.log(`   Office ${officeId}: ${count} patients`);
      });
  }

  if (Object.keys(stats.userOfficeDistribution).length > 0) {
    console.log(`\n👥 User Distribution by Office:`);
    Object.entries(stats.userOfficeDistribution)
      .sort(([, a], [, b]) => b - a)
      .forEach(([officeId, count]) => {
        console.log(`   Office ${officeId}: ${count} users`);
      });
  }

  // Determine if this looks like real data or test data
  const isRealData = stats.patients > 50 && (stats.clinicalNotes > 0 || stats.tasks > 0);
  const isTestData = stats.patients > 0 && stats.patients < 15 && stats.clinicalNotes === 0 && stats.tasks === 0;

  console.log(`\n🎯 Assessment:`);
  if (isRealData) {
    console.log(`   ✅ This appears to be YOUR REAL DATA`);
    console.log(`   ✅ ${stats.patients} patients with clinical activity`);
  } else if (isTestData) {
    console.log(`   ⚠️  This appears to be TEST/SEED DATA`);
    console.log(`   ⚠️  Only ${stats.patients} patients, no clinical notes or tasks`);
  } else if (stats.patients === 0) {
    console.log(`   ❌ EMPTY DATABASE - No patients found`);
  } else {
    console.log(`   ⚠️  Unclear - needs manual verification`);
  }
}

async function main() {
  console.log("🔍 Database Comparison Tool");
  console.log("Finding where your real patient data is stored...\n");

  const railwayUrl = process.env.RAILWAY_DB_URL;
  const supabaseUrl = process.env.SUPABASE_DB_URL;
  const currentUrl = process.env.DATABASE_URL;

  const databasesToCheck: Array<{ name: string; url: string }> = [];

  if (railwayUrl) {
    databasesToCheck.push({ name: "Railway Postgres", url: railwayUrl });
  }

  if (supabaseUrl) {
    databasesToCheck.push({ name: "Supabase Postgres", url: supabaseUrl });
  }

  // If only DATABASE_URL is set, check that one
  if (databasesToCheck.length === 0 && currentUrl) {
    // Determine which one it is based on URL
    const isRailway = currentUrl.includes("railway") || currentUrl.includes("railway.internal");
    const isSupabase = currentUrl.includes("supabase");
    const name = isRailway
      ? "Railway Postgres (Current DATABASE_URL)"
      : isSupabase
      ? "Supabase Postgres (Current DATABASE_URL)"
      : "Current Database (DATABASE_URL)";
    databasesToCheck.push({ name, url: currentUrl });
  }

  if (databasesToCheck.length === 0) {
    console.error("❌ No database URLs provided!");
    console.error("\nUsage:");
    console.error('  Option 1: Check Railway DB');
    console.error('    RAILWAY_DB_URL="postgresql://..." tsx scripts/compare-databases.ts');
    console.error('\n  Option 2: Check Supabase DB');
    console.error('    SUPABASE_DB_URL="postgresql://..." tsx scripts/compare-databases.ts');
    console.error('\n  Option 3: Check current DATABASE_URL');
    console.error('    DATABASE_URL="postgresql://..." tsx scripts/compare-databases.ts');
    console.error('\n  Option 4: Check both');
    console.error('    RAILWAY_DB_URL="railway_url" SUPABASE_DB_URL="supabase_url" tsx scripts/compare-databases.ts');
    process.exit(1);
  }

  const results: DatabaseStats[] = [];

  for (const db of databasesToCheck) {
    console.log(`\n🔍 Checking ${db.name}...`);
    const stats = await checkDatabase(db.name, db.url);
    results.push(stats);
    printStats(stats);
  }

  // Summary comparison
  if (results.length > 1) {
    console.log(`\n${"=".repeat(70)}`);
    console.log("📊 COMPARISON SUMMARY");
    console.log(`${"=".repeat(70)}`);

    const realDataDb = results.find((r) => r.canConnect && r.patients > 50);
    const testDataDb = results.find((r) => r.canConnect && r.patients > 0 && r.patients < 15);

    if (realDataDb) {
      console.log(`\n✅ REAL DATA FOUND in: ${realDataDb.name}`);
      console.log(`   ${realDataDb.patients} patients with clinical activity`);
    }

    if (testDataDb) {
      console.log(`\n⚠️  TEST DATA FOUND in: ${testDataDb.name}`);
      console.log(`   Only ${testDataDb.patients} patients (likely seeded test data)`);
    }

    console.log(`\n💡 RECOMMENDATION:`);
    if (realDataDb && testDataDb) {
      console.log(`   Your app is currently pointing to: ${testDataDb.name}`);
      console.log(`   But your real data is in: ${realDataDb.name}`);
      console.log(`\n   ACTION NEEDED:`);
      console.log(`   1. Go to Railway Dashboard → web service → Variables`);
      console.log(`   2. Change DATABASE_URL to point to ${realDataDb.name}`);
      console.log(`   3. Get the connection string from Railway Postgres service → Variables`);
      console.log(`   4. Update DATABASE_URL in web service`);
      console.log(`   5. Redeploy (Railway auto-redeploys on variable changes)`);
    } else if (realDataDb) {
      console.log(`   ✅ Your app should point to: ${realDataDb.name}`);
      console.log(`   Make sure DATABASE_URL in Railway web service points here.`);
    } else {
      console.log(`   ⚠️  Could not identify which database has real data.`);
      console.log(`   Please verify manually by checking patient counts.`);
    }
  }

  console.log(`\n${"=".repeat(70)}\n`);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
