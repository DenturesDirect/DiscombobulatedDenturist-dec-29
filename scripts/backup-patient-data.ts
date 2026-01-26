/**
 * Patient Data Backup Script
 * Exports all patient data, notes, files, and tasks to JSON files
 * 
 * Usage: 
 *   Local: DATABASE_URL=your_url npm run backup-data
 *   Railway: Run from Railway CLI or set DATABASE_URL in Railway dashboard
 * 
 * IMPORTANT: Make sure DATABASE_URL environment variable is set!
 */

import { ensureDb } from "../server/db";
import { 
  patients, clinicalNotes, labNotes, adminNotes, tasks, 
  patientFiles, labPrescriptions, offices, users 
} from "../shared/schema";
import { desc } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function backupPatientData() {
  console.log("🔄 Starting patient data backup...\n");

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.error("❌ ERROR: DATABASE_URL environment variable is not set!");
    console.error("\n💡 To backup your data:");
    console.error("   1. Get your DATABASE_URL from Railway dashboard");
    console.error("   2. Run: DATABASE_URL=your_url npm run backup-data");
    console.error("   3. Or set DATABASE_URL in your .env file");
    console.error("\n📖 See BACKUP_INSTRUCTIONS.md for more details\n");
    process.exit(1);
  }

  const db = ensureDb();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '..', 'backups', `backup-${timestamp}`);
  
  // Create backup directory
  fs.mkdirSync(backupDir, { recursive: true });

  try {
    // 1. Backup Patients
    console.log("📋 Exporting patients...");
    const allPatients = await db.select().from(patients).orderBy(desc(patients.createdAt));
    fs.writeFileSync(
      path.join(backupDir, 'patients.json'),
      JSON.stringify(allPatients, null, 2)
    );
    console.log(`   ✅ Exported ${allPatients.length} patients`);

    // 2. Backup Clinical Notes
    console.log("📝 Exporting clinical notes...");
    const allClinicalNotes = await db.select().from(clinicalNotes).orderBy(desc(clinicalNotes.createdAt));
    fs.writeFileSync(
      path.join(backupDir, 'clinical-notes.json'),
      JSON.stringify(allClinicalNotes, null, 2)
    );
    console.log(`   ✅ Exported ${allClinicalNotes.length} clinical notes`);

    // 3. Backup Lab Notes
    console.log("🔬 Exporting lab notes...");
    const allLabNotes = await db.select().from(labNotes).orderBy(desc(labNotes.createdAt));
    fs.writeFileSync(
      path.join(backupDir, 'lab-notes.json'),
      JSON.stringify(allLabNotes, null, 2)
    );
    console.log(`   ✅ Exported ${allLabNotes.length} lab notes`);

    // 4. Backup Admin Notes
    console.log("📋 Exporting admin notes...");
    const allAdminNotes = await db.select().from(adminNotes).orderBy(desc(adminNotes.createdAt));
    fs.writeFileSync(
      path.join(backupDir, 'admin-notes.json'),
      JSON.stringify(allAdminNotes, null, 2)
    );
    console.log(`   ✅ Exported ${allAdminNotes.length} admin notes`);

    // 5. Backup Tasks
    console.log("✅ Exporting tasks...");
    const allTasks = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    fs.writeFileSync(
      path.join(backupDir, 'tasks.json'),
      JSON.stringify(allTasks, null, 2)
    );
    console.log(`   ✅ Exported ${allTasks.length} tasks`);

    // 6. Backup Patient Files (including photo URLs)
    console.log("📁 Exporting patient files...");
    const allFiles = await db.select().from(patientFiles).orderBy(desc(patientFiles.uploadedAt));
    fs.writeFileSync(
      path.join(backupDir, 'patient-files.json'),
      JSON.stringify(allFiles, null, 2)
    );
    console.log(`   ✅ Exported ${allFiles.length} patient files`);

    // 7. Backup Lab Prescriptions
    console.log("💊 Exporting lab prescriptions...");
    const allPrescriptions = await db.select().from(labPrescriptions).orderBy(desc(labPrescriptions.createdAt));
    fs.writeFileSync(
      path.join(backupDir, 'lab-prescriptions.json'),
      JSON.stringify(allPrescriptions, null, 2)
    );
    console.log(`   ✅ Exported ${allPrescriptions.length} lab prescriptions`);

    // 8. Backup Offices
    console.log("🏢 Exporting offices...");
    const allOffices = await db.select().from(offices);
    fs.writeFileSync(
      path.join(backupDir, 'offices.json'),
      JSON.stringify(allOffices, null, 2)
    );
    console.log(`   ✅ Exported ${allOffices.length} offices`);

    // 9. Create a summary report
    console.log("📊 Creating summary report...");
    const summary = {
      backupDate: new Date().toISOString(),
      totals: {
        patients: allPatients.length,
        clinicalNotes: allClinicalNotes.length,
        labNotes: allLabNotes.length,
        adminNotes: allAdminNotes.length,
        tasks: allTasks.length,
        patientFiles: allFiles.length,
        labPrescriptions: allPrescriptions.length,
        offices: allOffices.length,
      },
      patientFileUrls: allFiles.map(file => ({
        id: file.id,
        patientId: file.patientId,
        filename: file.filename,
        fileUrl: file.fileUrl,
        fileType: file.fileType,
        uploadedAt: file.uploadedAt,
      })),
      patientsByOffice: allPatients.reduce((acc, patient) => {
        const officeId = patient.officeId || 'unknown';
        acc[officeId] = (acc[officeId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    };

    fs.writeFileSync(
      path.join(backupDir, 'summary.json'),
      JSON.stringify(summary, null, 2)
    );

    // 10. Create a CSV file with all patient file URLs (for easy reference)
    console.log("📄 Creating file URLs CSV...");
    const csvHeader = 'Patient ID,File ID,Filename,File URL,File Type,Uploaded At\n';
    const csvRows = allFiles.map(file => 
      `${file.patientId},${file.id},"${file.filename}",${file.fileUrl},${file.fileType || 'unknown'},${file.uploadedAt}`
    ).join('\n');
    fs.writeFileSync(
      path.join(backupDir, 'patient-file-urls.csv'),
      csvHeader + csvRows
    );

    // 11. Create a README with instructions
    const readme = `# Patient Data Backup
Generated: ${new Date().toISOString()}

## Files Included

- **patients.json** - All patient records
- **clinical-notes.json** - All clinical notes
- **lab-notes.json** - All lab notes
- **admin-notes.json** - All admin notes
- **tasks.json** - All tasks
- **patient-files.json** - All patient files/photos with URLs
- **lab-prescriptions.json** - All lab prescriptions
- **offices.json** - All offices
- **summary.json** - Summary statistics
- **patient-file-urls.csv** - CSV file with all file URLs for easy reference

## Important Notes

⚠️ **File URLs**: The patient-files.json contains URLs to photos/files. These URLs point to your storage service (Railway Storage, Supabase Storage, or Replit Storage). Make sure your storage service is accessible to view/download these files.

⚠️ **Data Format**: All JSON files use ISO 8601 date format (e.g., "2024-01-15T10:30:00.000Z")

## Restoring Data

To restore this backup, you would need to:
1. Import the JSON files back into your database
2. Ensure file URLs are still accessible in your storage service
3. Update any file URLs if storage service changed

## File Counts

- Patients: ${allPatients.length}
- Clinical Notes: ${allClinicalNotes.length}
- Lab Notes: ${allLabNotes.length}
- Admin Notes: ${allAdminNotes.length}
- Tasks: ${allTasks.length}
- Patient Files: ${allFiles.length}
- Lab Prescriptions: ${allPrescriptions.length}
- Offices: ${allOffices.length}
`;
    fs.writeFileSync(path.join(backupDir, 'README.md'), readme);

    console.log("\n✅ Backup completed successfully!");
    console.log(`📁 Backup location: ${backupDir}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Patients: ${allPatients.length}`);
    console.log(`   - Clinical Notes: ${allClinicalNotes.length}`);
    console.log(`   - Lab Notes: ${allLabNotes.length}`);
    console.log(`   - Admin Notes: ${allAdminNotes.length}`);
    console.log(`   - Tasks: ${allTasks.length}`);
    console.log(`   - Patient Files: ${allFiles.length}`);
    console.log(`   - Lab Prescriptions: ${allPrescriptions.length}`);
    console.log(`\n💡 All files saved to: ${backupDir}`);

  } catch (error: any) {
    console.error("\n❌ Backup failed:", error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the backup
backupPatientData().catch(console.error);
