import pg from "pg";
const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function setupTables() {
  const client = await pool.connect();
  try {
    console.log("📝 Creating offices table...");
    await client.query(`
      CREATE TABLE IF NOT EXISTS offices (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `);
    
    console.log("📝 Creating offices...");
    const officesResult = await client.query(`
      INSERT INTO offices (name) 
      VALUES ('Dentures Direct'), ('Toronto Smile Centre')
      ON CONFLICT DO NOTHING
      RETURNING id, name
    `);
    
    const offices = await client.query('SELECT id, name FROM offices ORDER BY name');
    console.log(`✅ Created ${offices.rows.length} offices:`, offices.rows.map(o => o.name).join(', '));
    
    console.log("📝 Adding office_id column to users table...");
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS office_id VARCHAR REFERENCES offices(id)
    `);
    
    console.log("📝 Adding can_view_all_offices column to users table...");
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS can_view_all_offices BOOLEAN DEFAULT false NOT NULL
    `);
    
    console.log("✅ Database setup complete!");
    console.log("\nOffice IDs:");
    offices.rows.forEach(office => {
      console.log(`  - ${office.name}: ${office.id}`);
    });
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupTables().catch(console.error);
