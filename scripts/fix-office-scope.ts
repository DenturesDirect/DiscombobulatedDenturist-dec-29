/**
 * Fix Office Scope Issues
 * 
 * If patients exist but don't show up due to office_id mismatches,
 * this script helps diagnose and fix the issue.
 * 
 * Usage: DATABASE_URL="your_url" tsx scripts/fix-office-scope.ts
 */

import { ensureDb } from "../server/db";
import { patients, users, offices } from "../shared/schema";
import { sql } from "drizzle-orm";

async function fixOfficeScope() {
  console.log("🔍 Diagnosing Office Scope Issues...\n");

  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL not set!");
    process.exit(1);
  }

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
    } else {
      patientDist.rows.forEach((row: any) => {
        const officeId = row.office_id || "NULL (no office assigned)";
        const officeName = allOffices.find((o) => o.id === officeId)?.name || "Unknown";
        console.log(`   Office ${officeId} (${officeName}): ${row.count} patients`);
      });
    }

    // Get user distribution by office
    const userDist = await db.execute(sql`
      SELECT office_id, COUNT(*) as count, 
             STRING_AGG(username, ', ') as usernames
      FROM users 
      GROUP BY office_id 
      ORDER BY count DESC
    `);

    console.log(`\n👥 User Distribution:\n`);
    if (userDist.rows.length === 0) {
      console.log("   ⚠️  No users found!");
    } else {
      userDist.rows.forEach((row: any) => {
        const officeId = row.office_id || "NULL (no office assigned)";
        const officeName = allOffices.find((o) => o.id === officeId)?.name || "Unknown";
        const canViewAll = row.usernames?.includes("(can view all)") ? " (can view all)" : "";
        console.log(`   Office ${officeId} (${officeName}): ${row.count} users`);
        if (row.usernames) {
          console.log(`      Users: ${row.usernames}`);
        }
      });
    }

    // Get all users with details
    const allUsers = await db.select().from(users);
    console.log(`\n👤 All Users:\n`);
    allUsers.forEach((user) => {
      const officeName = user.officeId
        ? allOffices.find((o) => o.id === user.officeId)?.name || "Unknown"
        : "No office";
      console.log(`   - ${user.username} (ID: ${user.id})`);
      console.log(`     Office: ${user.officeId || "NULL"} (${officeName})`);
      console.log(`     Can view all offices: ${user.canViewAllOffices ? "Yes" : "No"}`);
      console.log("");
    });

    // Analysis
    console.log(`\n🎯 Analysis:\n`);

    const patientsWithOffice = patientDist.rows.filter((r: any) => r.office_id);
    const patientsWithoutOffice = patientDist.rows.find((r: any) => !r.office_id);

    if (patientsWithoutOffice) {
      console.log(`   ⚠️  Found ${patientsWithoutOffice.count} patients without office assignment`);
      console.log(`   ⚠️  These patients won't show up for any user!`);
    }

    const usersWithOffice = userDist.rows.filter((r: any) => r.office_id);
    const usersWithoutOffice = userDist.rows.find((r: any) => !r.office_id);

    if (usersWithoutOffice) {
      console.log(`   ⚠️  Found ${usersWithoutOffice.count} users without office assignment`);
    }

    // Check for mismatches
    const officeIdsWithPatients = new Set(
      patientDist.rows
        .map((r: any) => r.office_id)
        .filter((id: any) => id !== null)
    );
    const officeIdsWithUsers = new Set(
      userDist.rows
        .map((r: any) => r.office_id)
        .filter((id: any) => id !== null)
    );

    const patientsInOfficesWithoutUsers = Array.from(officeIdsWithPatients).filter(
      (id) => !officeIdsWithUsers.has(id)
    );

    if (patientsInOfficesWithoutUsers.length > 0) {
      console.log(`\n   ⚠️  WARNING: Patients exist in offices that have no users!`);
      patientsInOfficesWithoutUsers.forEach((officeId) => {
        const officeName = allOffices.find((o) => o.id === officeId)?.name || "Unknown";
        const patientCount = patientDist.rows.find((r: any) => r.office_id === officeId)?.count;
        console.log(`      Office ${officeId} (${officeName}): ${patientCount} patients, 0 users`);
      });
      console.log(`\n   💡 SOLUTION: Assign users to these offices OR move patients to offices with users`);
    }

    // Recommendations
    console.log(`\n💡 Recommendations:\n`);

    if (patientsWithoutOffice) {
      console.log(`   1. Assign patients without office to an office:`);
      console.log(`      UPDATE patients SET office_id = 'OFFICE_ID' WHERE office_id IS NULL;`);
    }

    if (patientsInOfficesWithoutUsers.length > 0) {
      console.log(`   2. Assign users to offices with patients:`);
      console.log(`      UPDATE users SET office_id = 'OFFICE_ID' WHERE id = 'USER_ID';`);
    }

    if (usersWithoutOffice) {
      console.log(`   3. Assign users without office to an office:`);
      console.log(`      UPDATE users SET office_id = 'OFFICE_ID' WHERE office_id IS NULL;`);
    }

    // Check for duplicate offices
    const officeNames = allOffices.map((o) => o.name.toLowerCase());
    const duplicates = officeNames.filter(
      (name, index) => officeNames.indexOf(name) !== index
    );

    if (duplicates.length > 0) {
      console.log(`\n   ⚠️  WARNING: Found duplicate office names!`);
      console.log(`   ⚠️  This might cause the "office listed twice" issue you mentioned.`);
      console.log(`   ⚠️  Duplicate names: ${[...new Set(duplicates)].join(", ")}`);
      console.log(`\n   💡 SOLUTION: Check office IDs and consolidate if needed`);
    }

    console.log(`\n📋 To fix office assignments, run SQL queries in Railway Postgres → Data/Query tab:`);
    console.log(`   Example: UPDATE users SET office_id = 'correct-office-id' WHERE id = 'your-user-id';`);

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  }
}

fixOfficeScope().catch(console.error);
