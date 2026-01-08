import { storage } from "./storage";

/**
 * Bulk update script to set predetermination status for all existing patients
 * Run this once to update existing patients with a default value
 */
export async function bulkUpdatePredeterminationStatus() {
  try {
    console.log("🔄 Starting bulk update of predetermination status for existing patients...");
    
    // Get all patients
    const patients = await storage.listPatients();
    console.log(`📋 Found ${patients.length} patients to update`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const patient of patients) {
      // Only update if status is null/not set
      if (!patient.predeterminationStatus) {
        try {
          await storage.updatePatient(patient.id, {
            predeterminationStatus: "not applicable" // Set default status for existing patients
          });
          updated++;
          console.log(`✅ Updated: ${patient.name}`);
        } catch (error: any) {
          console.error(`❌ Failed to update ${patient.name}:`, error.message);
        }
      } else {
        skipped++;
        console.log(`⏭️  Skipped: ${patient.name} (already has status: ${patient.predeterminationStatus})`);
      }
    }
    
    console.log(`\n✅ Bulk update complete!`);
    console.log(`   Updated: ${updated} patients`);
    console.log(`   Skipped: ${skipped} patients`);
  } catch (error: any) {
    console.error("❌ Bulk update error:", error.message);
    throw error;
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  bulkUpdatePredeterminationStatus()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Error:", error);
      process.exit(1);
    });
}