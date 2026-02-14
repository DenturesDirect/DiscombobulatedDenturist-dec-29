// Load .env files FIRST
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env", ".env") });
config({ path: resolve(process.cwd(), ".env") });

/** Detect database host type for startup diagnostics. */
export function getDbHostType(): "railway" | "supabase" | "unknown" {
  const url = process.env.DATABASE_URL;
  if (!url) return "unknown";
  if (url.includes("railway.internal") || url.includes("railway.app")) return "railway";
  if (url.includes("supabase.co") || url.includes("pooler.supabase.com")) return "supabase";
  return "unknown";
}

// Use database whenever DATABASE_URL is available (both dev and production)
// Use PostgreSQL connection string (format: postgresql://user:password@host:port/database)
// Only use in-memory if explicitly requested via USE_MEM_STORAGE=1 OR if no database URL
const forceMemStorage = process.env.USE_MEM_STORAGE === '1';
export const DATABASE_URL = process.env.DATABASE_URL;
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
  const dbHost = getDbHostType();
  console.log(`📝 Storage mode: POSTGRESQL DATABASE`);
  console.log(`📌 DB host type: ${dbHost} (railway = preferred for Railway-only deployment)`);
  if (dbHost === "supabase") {
    console.log(`⚠️  DATABASE_URL points to Supabase. For Railway-only setup, point it to Railway Postgres.`);
  }
  console.log('✅ Using persistent storage - data will be saved');
}
