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
      `ALTER TABLE patients ADD COLUMN IF NOT EXISTS treatment_initiation_date TIMESTAMP`,
      // Task notes table for iterative progress tracking on tasks
      `CREATE TABLE IF NOT EXISTS task_notes (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        task_id VARCHAR NOT NULL REFERENCES tasks(id),
        content TEXT NOT NULL,
        image_urls TEXT[],
        created_by TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )`,
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
      AND column_name IN ('exam_paid', 'repair_paid', 'new_denture_paid', 'predetermination_status', 'treatment_initiation_date')
    `);

    const addedColumns = result.rows.map((row: any) => row.column_name);
    if (addedColumns.length > 0) {
      console.log(`✅ Migration complete: Added columns: ${addedColumns.join(', ')}`);
    } else {
      console.log("✅ Migration check complete: All columns already exist");
    }
  } catch (error: any) {
    const errorMessage = error.message?.toLowerCase() || '';
    
    // Check for password authentication errors
    if (errorMessage.includes('password authentication failed') || 
        errorMessage.includes('invalid password')) {
      console.error('\n❌ MIGRATION FAILED: Password Authentication Error');
      console.error('   Error:', error.message);
      console.error('\n💡 Your DATABASE_URL password needs URL encoding!');
      console.error('   Special characters (@, #, $, %, &, +, =, /, ?) break connection strings.');
      console.error('\n🔧 Quick Fix:');
      console.error('   1. Run: npm run setup-supabase');
      console.error('   2. This generates a properly encoded connection string');
      console.error('   3. Update DATABASE_URL in Railway Variables');
      console.error('   4. See FIX_PASSWORD_ENCODING.md for detailed help\n');
    } else if (errorMessage.includes('enotunreach') || errorMessage.includes('etimedout')) {
      console.error('\n❌ MIGRATION FAILED: Connection Error');
      console.error('   Error:', error.message);
      console.error('\n💡 Check your DATABASE_URL connection string:');
      console.error('   1. Must use Supabase "Session" tab connection string');
      console.error('   2. Must contain "pooler.supabase.com"');
      console.error('   3. See RECONNECT_SUPABASE_RAILWAY.md for instructions\n');
    } else {
      // Other migration errors (usually just column already exists)
      console.error("⚠️  Migration warning:", error.message);
      console.error("   This is usually okay - the columns may already exist or will be added later");
    }
  }
}