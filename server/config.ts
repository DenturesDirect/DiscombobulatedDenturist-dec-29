// Use database whenever DATABASE_URL is available (both dev and production)
// Prefer SUPABASE_DATABASE_URL over the broken Replit DATABASE_URL
// Only use in-memory if explicitly requested via USE_MEM_STORAGE=1 OR if no database URL
const forceMemStorage = process.env.USE_MEM_STORAGE === '1';
export const DATABASE_URL = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
const hasDatabaseUrl = !!DATABASE_URL;

export const USE_MEM_STORAGE = forceMemStorage || !hasDatabaseUrl;

if (USE_MEM_STORAGE) {
  if (forceMemStorage) {
    console.log(`📝 Storage mode: IN-MEMORY (forced via USE_MEM_STORAGE=1)`);
  } else {
    console.log(`📝 Storage mode: IN-MEMORY (no DATABASE_URL found)`);
  }
  console.log('⚠️  Data will be lost on restart');
} else {
  console.log(`📝 Storage mode: POSTGRESQL DATABASE`);
  console.log('✅ Using persistent storage - data will be saved');
}
