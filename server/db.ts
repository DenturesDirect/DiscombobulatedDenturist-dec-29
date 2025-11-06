import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { USE_MEM_STORAGE } from './config';

let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;

if (!USE_MEM_STORAGE) {
  neonConfig.webSocketConstructor = ws;

  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }
  
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
  db = drizzle({ client: pool, schema });
}

function throwDbDisabledError(): never {
  throw new Error('Database is temporarily disabled. Using in-memory storage instead.');
}

export { pool, db };

export const ensureDb = () => {
  if (!db) throwDbDisabledError();
  return db;
};

export const ensurePool = () => {
  if (!pool) throwDbDisabledError();
  return pool;
};
