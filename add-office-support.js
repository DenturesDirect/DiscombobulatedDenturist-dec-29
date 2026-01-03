// Script to add multi-tenant office support to the database
import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set!');
  console.error('Please set it like this:');
  console.error('  $env:DATABASE_URL="your-database-url-here"');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL,
});

async function addOfficeSupport() {
  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected');

    // Step 1: Create offices table
    console.log('\n📝 Step 1: Creating offices table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS offices (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Offices table created');

    // Step 2: Insert offices
    console.log('\n📝 Step 2: Inserting offices...');
    const officesResult = await client.query(`
      INSERT INTO offices (name) 
      VALUES ('Dentures Direct'), ('Toronto Smile Centre')
      ON CONFLICT DO NOTHING
      RETURNING id, name;
    `);
    
    // Get office IDs
    const offices = await client.query(`SELECT id, name FROM offices ORDER BY name;`);
    const denturesDirect = offices.rows.find(o => o.name === 'Dentures Direct');
    const torontoSmile = offices.rows.find(o => o.name === 'Toronto Smile Centre');
    
    if (!denturesDirect || !torontoSmile) {
      throw new Error('Failed to create offices');
    }
    
    console.log(`✅ Offices created: ${denturesDirect.name} (${denturesDirect.id}), ${torontoSmile.name} (${torontoSmile.id})`);

    // Step 3: Add officeId and canViewAllOffices to users
    console.log('\n📝 Step 3: Adding office support to users table...');
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS office_id VARCHAR REFERENCES offices(id),
      ADD COLUMN IF NOT EXISTS can_view_all_offices BOOLEAN DEFAULT false NOT NULL;
    `);
    console.log('✅ Users table updated');

    // Step 4: Add officeId to patients (required)
    console.log('\n📝 Step 4: Adding officeId to patients table...');
    await client.query(`
      ALTER TABLE patients 
      ADD COLUMN IF NOT EXISTS office_id VARCHAR REFERENCES offices(id);
    `);
    console.log('✅ Patients table updated');

    // Step 5: Add officeId to all other tables (optional, for performance)
    console.log('\n📝 Step 5: Adding officeId to other tables...');
    const tables = [
      'clinical_notes',
      'lab_notes',
      'admin_notes',
      'tasks',
      'lab_prescriptions',
      'patient_files',
      'appointments'
    ];

    for (const table of tables) {
      await client.query(`
        ALTER TABLE ${table} 
        ADD COLUMN IF NOT EXISTS office_id VARCHAR REFERENCES offices(id);
      `);
      console.log(`   ✅ ${table} updated`);
    }

    // Step 6: Assign all existing data to Dentures Direct
    console.log('\n📝 Step 6: Assigning existing data to Dentures Direct...');
    
    await client.query(`
      UPDATE patients SET office_id = $1 WHERE office_id IS NULL;
    `, [denturesDirect.id]);
    
    const patientsResult = await client.query(`SELECT COUNT(*) FROM patients WHERE office_id = $1;`, [denturesDirect.id]);
    console.log(`   ✅ ${patientsResult.rows[0].count} patients assigned to Dentures Direct`);

    // Update related tables based on patient office
    await client.query(`
      UPDATE clinical_notes 
      SET office_id = (SELECT office_id FROM patients WHERE patients.id = clinical_notes.patient_id)
      WHERE office_id IS NULL;
    `);
    
    await client.query(`
      UPDATE lab_notes 
      SET office_id = (SELECT office_id FROM patients WHERE patients.id = lab_notes.patient_id)
      WHERE office_id IS NULL;
    `);
    
    await client.query(`
      UPDATE admin_notes 
      SET office_id = (SELECT office_id FROM patients WHERE patients.id = admin_notes.patient_id)
      WHERE office_id IS NULL;
    `);
    
    await client.query(`
      UPDATE tasks 
      SET office_id = (SELECT office_id FROM patients WHERE patients.id = tasks.patient_id)
      WHERE office_id IS NULL AND patient_id IS NOT NULL;
    `);
    
    await client.query(`
      UPDATE lab_prescriptions 
      SET office_id = (SELECT office_id FROM patients WHERE patients.id = lab_prescriptions.patient_id)
      WHERE office_id IS NULL;
    `);
    
    await client.query(`
      UPDATE patient_files 
      SET office_id = (SELECT office_id FROM patients WHERE patients.id = patient_files.patient_id)
      WHERE office_id IS NULL;
    `);
    
    await client.query(`
      UPDATE appointments 
      SET office_id = (SELECT office_id FROM patients WHERE patients.id = appointments.patient_id)
      WHERE office_id IS NULL;
    `);
    
    console.log('   ✅ All related data assigned to Dentures Direct');

    // Step 7: Update existing users
    console.log('\n📝 Step 7: Updating existing users...');
    
    // Dentures Direct users (can view all offices)
    const denturesDirectUsers = [
      'damien@denturesdirect.ca',
      'michael@denturesdirect.ca',
      'luisa@denturesdirect.ca',
      'info@denturesdirect.ca'
    ];
    
    for (const email of denturesDirectUsers) {
      await client.query(`
        UPDATE users 
        SET office_id = $1, can_view_all_offices = true
        WHERE email = $2;
      `, [denturesDirect.id, email.toLowerCase()]);
      console.log(`   ✅ ${email} → Dentures Direct (can view all offices)`);
    }

    // Make office_id required for patients
    console.log('\n📝 Step 8: Making office_id required for patients...');
    await client.query(`
      ALTER TABLE patients 
      ALTER COLUMN office_id SET NOT NULL;
    `);
    console.log('✅ office_id is now required for patients');

    // Verify
    console.log('\n📊 Verification:');
    const officesCheck = await client.query(`SELECT COUNT(*) FROM offices;`);
    console.log(`   Offices: ${officesCheck.rows[0].count}`);
    
    const usersCheck = await client.query(`
      SELECT COUNT(*) as total, 
             COUNT(CASE WHEN can_view_all_offices = true THEN 1 END) as can_view_all
      FROM users WHERE office_id IS NOT NULL;
    `);
    console.log(`   Users with office: ${usersCheck.rows[0].total} (${usersCheck.rows[0].can_view_all} can view all offices)`);
    
    const patientsCheck = await client.query(`SELECT COUNT(*) FROM patients WHERE office_id IS NOT NULL;`);
    console.log(`   Patients with office: ${patientsCheck.rows[0].count}`);

    console.log('\n✅ SUCCESS! Multi-tenant office support has been added.');
    console.log('\n📋 Next steps:');
    console.log('   1. Update backend storage.ts to filter by office');
    console.log('   2. Update routes.ts to handle office context');
    console.log('   3. Create OfficeSelector component for Dentures Direct users');
    console.log('   4. Update frontend queries to include office filtering');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addOfficeSupport();
