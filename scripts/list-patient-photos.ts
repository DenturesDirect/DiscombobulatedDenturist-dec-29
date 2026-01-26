import pg from "pg";
const { Pool } = pg;
import { config } from "dotenv";
import { resolve } from "path";

// Load .env files
config({ path: resolve(process.cwd(), ".env", ".env") });
config({ path: resolve(process.cwd(), ".env") });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set");
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function listPatientPhotos() {
  const client = await pool.connect();
  try {
    console.log("📸 Finding patients with photos...\n");
    
    const result = await client.query(`
      SELECT id, name, photo_url, created_at 
      FROM patients 
      WHERE photo_url IS NOT NULL AND photo_url != ''
      ORDER BY created_at DESC
    `);
    
    console.log(`Found ${result.rows.length} patients with photos:\n`);
    
    if (result.rows.length === 0) {
      console.log("  No patients with photos found in database.");
      return;
    }
    
    result.rows.forEach((patient, index) => {
      console.log(`${index + 1}. ${patient.name}`);
      console.log(`   Patient ID: ${patient.id}`);
      console.log(`   Photo URL: ${patient.photo_url}`);
      console.log(`   Created: ${patient.created_at}`);
      console.log("");
    });
    
    // Also check clinical notes for photos
    console.log("\n📸 Checking clinical notes for photos...\n");
    const notesResult = await client.query(`
      SELECT id, patient_id, photos, created_at
      FROM clinical_notes
      WHERE photos IS NOT NULL AND photos != '[]' AND photos != 'null'
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    console.log(`Found ${notesResult.rows.length} clinical notes with photos:\n`);
    
    notesResult.rows.forEach((note, index) => {
      let photos;
      try {
        photos = JSON.parse(note.photos);
      } catch {
        photos = note.photos;
      }
      console.log(`${index + 1}. Clinical Note ID: ${note.id}`);
      console.log(`   Patient ID: ${note.patient_id}`);
      console.log(`   Photos: ${Array.isArray(photos) ? photos.length : 'unknown'} photo(s)`);
      if (Array.isArray(photos) && photos.length > 0) {
        photos.slice(0, 3).forEach((photo: string, i: number) => {
          console.log(`     ${i + 1}. ${photo.substring(0, 100)}${photo.length > 100 ? '...' : ''}`);
        });
        if (photos.length > 3) {
          console.log(`     ... and ${photos.length - 3} more`);
        }
      }
      console.log(`   Created: ${note.created_at}`);
      console.log("");
    });
    
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

listPatientPhotos().catch(console.error);
