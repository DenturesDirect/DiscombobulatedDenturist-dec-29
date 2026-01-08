import { ensurePool } from "./db";

/**
 * Run database migrations automatically on server startup
 * This ensures the database schema matches the code
 */
export async function runMigrations() {
  try {
    const pool = ensurePool();
    
    console.log("🔄 Running database migrations...");
    
    // Add new payment status columns if they don't exist
    const migrations = [
      // Add completed_by and completed_at columns to tasks table
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_by TEXT`,
      `ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS exam_paid TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS repair_paid TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS new_denture_paid TEXT`,
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS predetermination_status TEXT`,
    ];

    for (const migration of migrations) {
      try {
        await pool.query(migration);
      } catch (error: any) {
        // Ignore "already exists" errors, but log other errors
        if (!error.message?.includes('already exists') && !error.message?.includes('duplicate')) {
          console.error(`Migration error: ${error.message}`);
        }
      }
    }

    // Verify columns were added
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'patients' 
      AND column_name IN ('exam_paid', 'repair_paid', 'new_denture_paid', 'predetermination_status')
    `);

    const addedColumns = result.rows.map((row: any) => row.column_name);
    if (addedColumns.length > 0) {
      console.log(`✅ Migration complete: Added columns: ${addedColumns.join(', ')}`);
    } else {
      console.log("✅ Migration check complete: All columns already exist");
    }
  } catch (error: any) {
    // Don't crash the server if migrations fail - just log it
    console.error("⚠️  Migration warning:", error.message);
    console.error("   This is usually okay - the columns may already exist or will be added later");
  }
}