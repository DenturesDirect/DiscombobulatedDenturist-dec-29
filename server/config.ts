// Auto-detect: use database in production (REPL_DEPLOYMENT), in-memory in dev (if DB disabled)
const isProduction = process.env.REPL_DEPLOYMENT === '1';
const hasDatabaseUrl = !!process.env.DATABASE_URL;

export const USE_MEM_STORAGE = !isProduction || !hasDatabaseUrl;

if (USE_MEM_STORAGE) {
  console.log(`📝 Storage mode: IN-MEMORY (temporary)`);
  console.log('⚠️  Data will be lost on restart - database not available');
} else {
  console.log(`📝 Storage mode: PRODUCTION DATABASE`);
  console.log('✅ Using persistent PostgreSQL storage');
}
