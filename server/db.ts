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
  
  pool = new Pool({ connectionString: DATABASE_URL });
  db = drizzle(pool, { schema });
}

function throwDbDisabledError(): never {
  throw new Error('Database is temporarily disabled. Using in-memory storage instead.');
}

export { pool, db };

export const ensureDb = () => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.ts:28',message:'ensureDb called',data:{hasDb:!!db,hasPool:!!pool,useMemStorage:!!(typeof USE_MEM_STORAGE!=='undefined'?USE_MEM_STORAGE:false)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
  if (!db) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/dd0051a6-00ac-4fc6-bff4-39c2ca4bdff0',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'db.ts:30',message:'ensureDb error - db is null',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    throwDbDisabledError();
  }
  return db;
};

export const ensurePool = () => {
  if (!pool) throwDbDisabledError();
  return pool;
};
