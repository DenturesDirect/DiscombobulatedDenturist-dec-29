import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";
import { USE_MEM_STORAGE, DATABASE_URL } from './config';

const { Pool } = pg;

let pool: pg.Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (!USE_MEM_STORAGE) {
  if (!DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  
  pool = new Pool({ 
    connectionString: DATABASE_URL,
    // Add error handler for better password error messages
    // Note: pg.Pool doesn't have a direct error handler in constructor,
    // but we'll handle errors when connections are attempted
  });
  
  // Test connection and provide helpful error messages
  pool.on('error', (err: Error) => {
    const errorMessage = err.message.toLowerCase();
    
    // Check for password authentication errors
    if (errorMessage.includes('password authentication failed') || 
        errorMessage.includes('invalid password')) {
      console.error('\n❌ Password Authentication Error Detected!');
      console.error('   Error:', err.message);
      console.error('\n💡 This is usually caused by:');
      console.error('   1. Special characters in password not being URL-encoded');
      console.error('   2. Password containing @, #, $, %, &, +, =, /, or ?');
      console.error('   3. Copy-paste issues with password');
      console.error('\n🔧 Solution:');
      console.error('   1. Run: npm run setup-supabase');
      console.error('   2. Or run: npm run build-connection');
      console.error('   3. These scripts automatically URL-encode your password');
      console.error('   4. See FIX_PASSWORD_ENCODING.md for detailed instructions\n');
    } else if (errorMessage.includes('enotunreach') || errorMessage.includes('etimedout')) {
      console.error('\n❌ Connection Error Detected!');
      console.error('   Error:', err.message);
      console.error('\n💡 This is usually caused by:');
      console.error('   1. Invalid connection string format');
      console.error('   2. Database server not reachable');
      console.error('   3. Network connectivity issues');
      console.error('\n🔧 Solution:');
      console.error('   1. Verify DATABASE_URL is correctly formatted');
      console.error('   2. Check that the database server is accessible');
      console.error('   3. Ensure Railway database is provisioned and running\n');
    }
  });
  
  db = drizzle(pool, { schema });
  
  // Test connection on startup to catch errors early
  pool.connect().then(client => {
    client.release();
  }).catch((err: Error) => {
    const errorMessage = err.message.toLowerCase();
    
    if (errorMessage.includes('password authentication failed') || 
        errorMessage.includes('invalid password')) {
      console.error('\n❌ DATABASE CONNECTION FAILED: Password Authentication Error');
      console.error('   Your DATABASE_URL password is incorrect or needs URL encoding.\n');
      console.error('   Quick Fix:');
      console.error('   1. Run: npm run setup-supabase');
      console.error('   2. This will generate a properly encoded connection string');
      console.error('   3. Update DATABASE_URL in Railway Variables\n');
      console.error('   See FIX_PASSWORD_ENCODING.md for complete troubleshooting guide.\n');
    }
  });
}

function throwDbDisabledError(): never {
  throw new Error('Database is temporarily disabled. Using in-memory storage instead.');
}

export { pool, db };

export const ensureDb = () => {
  if (!db) {
    throwDbDisabledError();
  }
  return db;
};

export const ensurePool = () => {
  if (!pool) throwDbDisabledError();
  return pool;
};
