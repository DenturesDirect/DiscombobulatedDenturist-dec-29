/**
 * Fix User Office Assignment
 * 
 * This script finds where patients are assigned and updates your user account
 * to match the office that has the most patients.
 * 
 * Usage: DATABASE_URL="railway_postgres_url" tsx scripts/fix-user-office.ts --username "damien@denturesdirect.ca"
 */

import { ensureDb } from "../server/db";
import { users, patients, offices } from "../shared/schema";
import { sql, eq } from "drizzle-orm";
import { config } from "dotenv";
import { resolve } from "path";

// Load .env files
config({ path: resolve(process.cwd(), ".env", ".env") });
config({ path: resolve(process.cwd(), ".env") });

async function fixUserOffice() {
  console.log("🔍 Diagnosing and Fixing Office Scope Issue...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL not set!");
    console.error("Get it from Railway Postgres service → Variables → DATABASE_URL");
    process.exit(1);
  }

  // Get username from command line args
  const username = process.argv.find(arg => arg.startsWith("--username="))?.split("=")[1] 
    || process.argv[process.argv.indexOf("--username") + 1]
    || "damien@denturesdirect.ca"; // Default to the user's email

  console.log(`👤 Looking up user: ${username}\n`);

  const db = ensureDb();

  try {
    // Get all offices
    const allOffices = await db.select().from(offices);
    console.log(`🏢 Found ${allOffices.length} offices:\n`);
    allOffices.forEach((office) => {
      console.log(`   - ${office.name} (ID: ${office.id})`);
    });

    // Get patient distribution by office
    const patientDist = await db.execute(sql`
      SELECT office_id, COUNT(*) as count 
      FROM patients 
      GROUP BY office_id 
      ORDER BY count DESC
    `);

    console.log(`\n📊 Patient Distribution:\n`);
    if (patientDist.rows.length === 0) {
      console.log("   ⚠️  No patients found!");
      process.exit(1);
    }

    const officeMap = new Map<string, string>();
    allOffices.forEach(office => {
      officeMap.set(office.id, office.name);
    });

    patientDist.rows.forEach((row: any) => {
      const officeId = row.office_id || "NULL (no office assigned)";
      const officeName = officeId !== "NULL (no office assigned)" 
        ? officeMap.get(officeId) || "Unknown" 
        : "No office";
      console.log(`   Office ${officeId} (${officeName}): ${row.count} patients`);
    });

    // Find the office with the most patients (excluding NULL)
    const officeWithMostPatients = patientDist.rows.find((r: any) => r.office_id !== null);
    
    if (!officeWithMostPatients) {
      console.log("\n❌ ERROR: All patients are unassigned (NULL office_id)!");
      console.log("   You need to assign patients to offices first.");
      process.exit(1);
    }

    const targetOfficeId = officeWithMostPatients.office_id;
    const targetOfficeName = officeMap.get(targetOfficeId) || "Unknown";
    const patientCount = parseInt(officeWithMostPatients.count);

    console.log(`\n🎯 Target Office: ${targetOfficeId} (${targetOfficeName}) with ${patientCount} patients\n`);

    // Find the user
    const userResults = await db.select().from(users).where(eq(users.username, username));
    
    if (userResults.length === 0) {
      console.error(`❌ ERROR: User "${username}" not found!`);
      console.error("\nAvailable users:");
      const allUsers = await db.select().from(users);
      allUsers.forEach(u => {
        console.error(`   - ${u.username} (ID: ${u.id}, Office: ${u.officeId || "NULL"})`);
      });
      process.exit(1);
    }

    const user = userResults[0];
    console.log(`👤 Current User Info:`);
    console.log(`   Username: ${user.username}`);
    console.log(`   Current Office ID: ${user.officeId || "NULL (not assigned)"}`);
    console.log(`   Can View All Offices: ${user.canViewAllOffices ? "Yes" : "No"}`);

    const currentOfficeName = user.officeId ? officeMap.get(user.officeId) || "Unknown" : "No office";
    console.log(`   Current Office Name: ${currentOfficeName}\n`);

    // Check if fix is needed
    if (user.officeId === targetOfficeId) {
      console.log("✅ Your user is already assigned to the correct office!");
      console.log(`✅ You should be able to see ${patientCount} patients.\n`);
      
      if (user.canViewAllOffices) {
        console.log("💡 Note: You have 'can_view_all_offices' enabled, so you should see all patients anyway.");
        console.log("💡 If you're still not seeing patients, check the office filter in the app UI.\n");
      }
      
      return;
    }

    // Show what will happen
    console.log("🔧 Fix Needed:");
    console.log(`   Your office: ${user.officeId || "NULL"} (${currentOfficeName})`);
    console.log(`   Patients' office: ${targetOfficeId} (${targetOfficeName})`);
    console.log(`   → Will update your office to: ${targetOfficeId} (${targetOfficeName})\n`);

    // Ask for confirmation (in a script, we'll just do it, but show what we're doing)
    console.log("⚠️  Updating user office assignment...\n");

    // Update the user
    const updatedUsers = await db.update(users)
      .set({ officeId: targetOfficeId })
      .where(eq(users.id, user.id))
      .returning();

    if (updatedUsers.length > 0) {
      console.log("✅ SUCCESS! User office updated!\n");
      console.log(`   Updated: ${updatedUsers[0].username}`);
      console.log(`   New Office ID: ${updatedUsers[0].officeId}`);
      console.log(`   Office Name: ${officeMap.get(updatedUsers[0].officeId!) || "Unknown"}\n`);
      
      console.log("🎉 Next Steps:");
      console.log("   1. Log out and log back into your app");
      console.log(`   2. You should now see ${patientCount} patients!`);
      console.log("   3. If you still don't see them, check the office filter dropdown in the app\n");
    } else {
      console.error("❌ ERROR: Failed to update user!");
      process.exit(1);
    }

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

fixUserOffice().catch(console.error);
