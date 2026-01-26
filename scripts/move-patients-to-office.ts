/**
 * Move Patients to Office Script
 * Moves specified patients and all their related records to a target office
 * 
 * Usage: 
 *   DATABASE_URL=your_url npm run move-patients-to-office -- --office "Toronto Smile Centre" --patients "patient-id-1,patient-id-2"
 *   DATABASE_URL=your_url npm run move-patients-to-office -- --office "Toronto Smile Centre" --patients-file patient-ids.json
 *   DATABASE_URL=your_url npm run move-patients-to-office -- --office "Toronto Smile Centre" --patients "patient-id-1,patient-id-2" --dry-run
 * 
 * IMPORTANT: Make sure DATABASE_URL environment variable is set!
 */

import { ensureDb } from "../server/db";
import { 
  patients, clinicalNotes, labNotes, adminNotes, tasks, 
  patientFiles, labPrescriptions, appointments, offices
} from "../shared/schema";
import { eq, inArray } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ScriptOptions {
  officeName: string;
  patientIds: string[];
  dryRun: boolean;
}

function parseArguments(): ScriptOptions {
  const args = process.argv.slice(2);
  let officeName: string | null = null;
  let patientIds: string[] = [];
  let dryRun = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--office' && i + 1 < args.length) {
      officeName = args[i + 1];
      i++;
    } else if (arg === '--patients' && i + 1 < args.length) {
      patientIds = args[i + 1].split(',').map(id => id.trim()).filter(id => id.length > 0);
      i++;
    } else if (arg === '--patients-file' && i + 1 < args.length) {
      const filePath = args[i + 1];
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const parsed = JSON.parse(fileContent);
        patientIds = Array.isArray(parsed) ? parsed : [parsed];
      } catch (error: any) {
        console.error(`❌ Error reading patient IDs file: ${error.message}`);
        process.exit(1);
      }
      i++;
    } else if (arg === '--dry-run') {
      dryRun = true;
    }
  }

  if (!officeName) {
    console.error("❌ ERROR: --office parameter is required!");
    console.error("\nUsage:");
    console.error('  npm run move-patients-to-office -- --office "Office Name" --patients "id1,id2,id3"');
    console.error('  npm run move-patients-to-office -- --office "Office Name" --patients-file patient-ids.json');
    console.error('  npm run move-patients-to-office -- --office "Office Name" --patients "id1,id2" --dry-run');
    process.exit(1);
  }

  if (patientIds.length === 0) {
    console.error("❌ ERROR: --patients or --patients-file parameter is required!");
    console.error("\nUsage:");
    console.error('  npm run move-patients-to-office -- --office "Office Name" --patients "id1,id2,id3"');
    console.error('  npm run move-patients-to-office -- --office "Office Name" --patients-file patient-ids.json');
    process.exit(1);
  }

  return { officeName, patientIds, dryRun };
}

async function movePatientsToOffice() {
  console.log("🔄 Starting patient office migration...\n");

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL environment variable is not set!");
    console.error("\n💡 To run this script:");
    console.error("   1. Get your DATABASE_URL from Railway dashboard");
    console.error("   2. Run: DATABASE_URL=your_url npm run move-patients-to-office -- --office \"Office Name\" --patients \"id1,id2\"");
    console.error("   3. Or set DATABASE_URL in your .env file");
    process.exit(1);
  }

  const options = parseArguments();
  const db = ensureDb();

  try {
    // Step 1: Find the target office
    console.log(`🔍 Looking up office: "${options.officeName}"...`);
    const officesList = await db.select().from(offices).where(eq(offices.name, options.officeName));
    
    if (officesList.length === 0) {
      console.error(`❌ ERROR: Office "${options.officeName}" not found!`);
      console.error("\nAvailable offices:");
      const allOffices = await db.select().from(offices);
      allOffices.forEach(office => {
        console.error(`   - ${office.name} (ID: ${office.id})`);
      });
      process.exit(1);
    }

    const targetOfficeId = officesList[0].id;
    console.log(`   ✅ Found office: ${options.officeName} (ID: ${targetOfficeId})\n`);

    // Step 2: Verify patient IDs exist
    console.log(`🔍 Verifying ${options.patientIds.length} patient ID(s)...`);
    const existingPatients = await db.select().from(patients).where(inArray(patients.id, options.patientIds));
    
    if (existingPatients.length === 0) {
      console.error("❌ ERROR: None of the provided patient IDs were found!");
      process.exit(1);
    }

    if (existingPatients.length < options.patientIds.length) {
      const foundIds = new Set(existingPatients.map(p => p.id));
      const missingIds = options.patientIds.filter(id => !foundIds.has(id));
      console.warn(`⚠️  Warning: ${missingIds.length} patient ID(s) not found: ${missingIds.join(', ')}`);
    }

    console.log(`   ✅ Found ${existingPatients.length} patient(s) to move\n`);

    // Step 3: Show current office assignments
    console.log("📊 Current office assignments:");
    const officeMap = new Map<string, string>();
    const allOffices = await db.select().from(offices);
    allOffices.forEach(office => {
      officeMap.set(office.id, office.name);
    });

    existingPatients.forEach(patient => {
      const currentOffice = officeMap.get(patient.officeId) || `Unknown (${patient.officeId})`;
      console.log(`   - ${patient.name} (${patient.id}): ${currentOffice}`);
    });
    console.log();

    if (options.dryRun) {
      console.log("🔍 DRY RUN MODE - No changes will be made\n");
    } else {
      console.log("⚠️  WARNING: This will update the database. Press Ctrl+C to cancel, or wait 3 seconds...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log();
    }

    // Step 4: Update patients table
    console.log("📋 Updating patients table...");
    if (!options.dryRun) {
      const patientsResult = await db.update(patients)
        .set({ officeId: targetOfficeId })
        .where(inArray(patients.id, existingPatients.map(p => p.id)))
        .returning();
      console.log(`   ✅ Updated ${patientsResult.length} patient(s)`);
    } else {
      console.log(`   ✅ Would update ${existingPatients.length} patient(s)`);
    }

    // Step 5: Update appointments table
    console.log("📅 Updating appointments table...");
    const appointmentsToUpdate = await db.select().from(appointments)
      .where(inArray(appointments.patientId, existingPatients.map(p => p.id)));
    
    if (!options.dryRun && appointmentsToUpdate.length > 0) {
      await db.update(appointments)
        .set({ officeId: targetOfficeId })
        .where(inArray(appointments.patientId, existingPatients.map(p => p.id)));
      console.log(`   ✅ Updated ${appointmentsToUpdate.length} appointment(s)`);
    } else {
      console.log(`   ✅ Would update ${appointmentsToUpdate.length} appointment(s)`);
    }

    // Step 6: Update clinical notes table
    console.log("📝 Updating clinical notes table...");
    const clinicalNotesToUpdate = await db.select().from(clinicalNotes)
      .where(inArray(clinicalNotes.patientId, existingPatients.map(p => p.id)));
    
    if (!options.dryRun && clinicalNotesToUpdate.length > 0) {
      await db.update(clinicalNotes)
        .set({ officeId: targetOfficeId })
        .where(inArray(clinicalNotes.patientId, existingPatients.map(p => p.id)));
      console.log(`   ✅ Updated ${clinicalNotesToUpdate.length} clinical note(s)`);
    } else {
      console.log(`   ✅ Would update ${clinicalNotesToUpdate.length} clinical note(s)`);
    }

    // Step 7: Update tasks table
    console.log("✅ Updating tasks table...");
    const tasksToUpdate = await db.select().from(tasks)
      .where(inArray(tasks.patientId, existingPatients.map(p => p.id)));
    
    if (!options.dryRun && tasksToUpdate.length > 0) {
      await db.update(tasks)
        .set({ officeId: targetOfficeId })
        .where(inArray(tasks.patientId, existingPatients.map(p => p.id)));
      console.log(`   ✅ Updated ${tasksToUpdate.length} task(s)`);
    } else {
      console.log(`   ✅ Would update ${tasksToUpdate.length} task(s)`);
    }

    // Step 8: Update patient files table
    console.log("📁 Updating patient files table...");
    const patientFilesToUpdate = await db.select().from(patientFiles)
      .where(inArray(patientFiles.patientId, existingPatients.map(p => p.id)));
    
    if (!options.dryRun && patientFilesToUpdate.length > 0) {
      await db.update(patientFiles)
        .set({ officeId: targetOfficeId })
        .where(inArray(patientFiles.patientId, existingPatients.map(p => p.id)));
      console.log(`   ✅ Updated ${patientFilesToUpdate.length} file(s)`);
    } else {
      console.log(`   ✅ Would update ${patientFilesToUpdate.length} file(s)`);
    }

    // Step 9: Update lab notes table
    console.log("🔬 Updating lab notes table...");
    const labNotesToUpdate = await db.select().from(labNotes)
      .where(inArray(labNotes.patientId, existingPatients.map(p => p.id)));
    
    if (!options.dryRun && labNotesToUpdate.length > 0) {
      await db.update(labNotes)
        .set({ officeId: targetOfficeId })
        .where(inArray(labNotes.patientId, existingPatients.map(p => p.id)));
      console.log(`   ✅ Updated ${labNotesToUpdate.length} lab note(s)`);
    } else {
      console.log(`   ✅ Would update ${labNotesToUpdate.length} lab note(s)`);
    }

    // Step 10: Update admin notes table
    console.log("📋 Updating admin notes table...");
    const adminNotesToUpdate = await db.select().from(adminNotes)
      .where(inArray(adminNotes.patientId, existingPatients.map(p => p.id)));
    
    if (!options.dryRun && adminNotesToUpdate.length > 0) {
      await db.update(adminNotes)
        .set({ officeId: targetOfficeId })
        .where(inArray(adminNotes.patientId, existingPatients.map(p => p.id)));
      console.log(`   ✅ Updated ${adminNotesToUpdate.length} admin note(s)`);
    } else {
      console.log(`   ✅ Would update ${adminNotesToUpdate.length} admin note(s)`);
    }

    // Step 11: Update lab prescriptions table
    console.log("💊 Updating lab prescriptions table...");
    const labPrescriptionsToUpdate = await db.select().from(labPrescriptions)
      .where(inArray(labPrescriptions.patientId, existingPatients.map(p => p.id)));
    
    if (!options.dryRun && labPrescriptionsToUpdate.length > 0) {
      await db.update(labPrescriptions)
        .set({ officeId: targetOfficeId })
        .where(inArray(labPrescriptions.patientId, existingPatients.map(p => p.id)));
      console.log(`   ✅ Updated ${labPrescriptionsToUpdate.length} lab prescription(s)`);
    } else {
      console.log(`   ✅ Would update ${labPrescriptionsToUpdate.length} lab prescription(s)`);
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    if (options.dryRun) {
      console.log("🔍 DRY RUN COMPLETE - No changes were made");
    } else {
      console.log("✅ Migration completed successfully!");
    }
    console.log("=".repeat(60));
    console.log(`\nSummary:`);
    console.log(`   Office: ${options.officeName}`);
    console.log(`   Patients moved: ${existingPatients.length}`);
    console.log(`   Appointments: ${appointmentsToUpdate.length}`);
    console.log(`   Clinical Notes: ${clinicalNotesToUpdate.length}`);
    console.log(`   Tasks: ${tasksToUpdate.length}`);
    console.log(`   Patient Files: ${patientFilesToUpdate.length}`);
    console.log(`   Lab Notes: ${labNotesToUpdate.length}`);
    console.log(`   Admin Notes: ${adminNotesToUpdate.length}`);
    console.log(`   Lab Prescriptions: ${labPrescriptionsToUpdate.length}`);
    console.log();

  } catch (error: any) {
    console.error("\n❌ ERROR:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

movePatientsToOffice().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
