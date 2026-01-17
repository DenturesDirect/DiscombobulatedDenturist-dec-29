#!/usr/bin/env tsx
/**
 * Login Issues Diagnostic Tool
 * 
 * This script checks:
 * 1. Database connection
 * 2. Staff accounts existence
 * 3. Session storage setup
 * 4. Authentication configuration
 * 
 * Run with: npx tsx scripts/diagnose-login-issues.ts
 */

import pg from "pg";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load .env (optional)
try {
  const dotenv = await import("dotenv");
  dotenv.config({ path: join(__dirname, "..", ".env") });
} catch {
  // dotenv not available - that's okay
}

const { Pool } = pg;

interface DiagnosticResult {
  databaseConnection: {
    canConnect: boolean;
    error?: string;
    isPooler: boolean;
    isIPv6: boolean;
  };
  staffAccounts: {
    total: number;
    accounts: Array<{ email: string; hasPassword: boolean; exists: boolean }>;
  };
  environment: {
    hasDatabaseUrl: boolean;
    hasSessionSecret: boolean;
    nodeEnv: string;
  };
  recommendations: string[];
}

const ALLOWED_STAFF_EMAILS = [
  "damien@denturesdirect.ca",
  "michael@denturesdirect.ca",
  "luisa@denturesdirect.ca",
  "info@denturesdirect.ca",
  "info@torontosmilecenter.ca",
  "dentist@torontosmilecentre.ca",
];

async function checkDatabaseConnection(url: string | undefined): Promise<DiagnosticResult['databaseConnection']> {
  if (!url) {
    return {
      canConnect: false,
      error: "DATABASE_URL not set",
      isPooler: false,
      isIPv6: false,
    };
  }

  const isPooler = url.includes("pooler.supabase.com");
  const isIPv6 = /\[[a-f0-9:]+\]|2600:1f18|::/.test(url);

  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    await pool.end();
    return { canConnect: true, isPooler, isIPv6 };
  } catch (error: any) {
    await pool.end();
    return {
      canConnect: false,
      error: error.message || String(error),
      isPooler,
      isIPv6,
    };
  }
}

async function checkStaffAccounts(url: string | undefined): Promise<DiagnosticResult['staffAccounts']> {
  if (!url) {
    return {
      total: 0,
      accounts: ALLOWED_STAFF_EMAILS.map(email => ({
        email,
        hasPassword: false,
        exists: false,
      })),
    };
  }

  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    
    // Check if users table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      await client.release();
      await pool.end();
      return {
        total: 0,
        accounts: ALLOWED_STAFF_EMAILS.map(email => ({
          email,
          hasPassword: false,
          exists: false,
        })),
      };
    }

    // Check each staff account
    const accounts = await Promise.all(
      ALLOWED_STAFF_EMAILS.map(async (email) => {
        const result = await client.query(
          'SELECT id, email, password FROM users WHERE email = $1',
          [email.toLowerCase()]
        );
        
        if (result.rows.length === 0) {
          return { email, hasPassword: false, exists: false };
        }
        
        const user = result.rows[0];
        return {
          email,
          hasPassword: !!user.password,
          exists: true,
        };
      })
    );

    await client.release();
    await pool.end();

    return {
      total: accounts.filter(a => a.exists).length,
      accounts,
    };
  } catch (error: any) {
    try {
      await pool.end();
    } catch {
      // Ignore cleanup errors
    }
    return {
      total: 0,
      accounts: ALLOWED_STAFF_EMAILS.map(email => ({
        email,
        hasPassword: false,
        exists: false,
      })),
    };
  }
}

async function main() {
  console.log("🔍 Login Issues Diagnostic Tool\n");
  console.log("=".repeat(60));

  const databaseUrl = process.env.DATABASE_URL;
  const sessionSecret = process.env.SESSION_SECRET;
  const nodeEnv = process.env.NODE_ENV || "development";

  // Check environment
  console.log("\n📋 Environment Check:");
  console.log(`   DATABASE_URL: ${databaseUrl ? "✅ Set" : "❌ Not set"}`);
  console.log(`   SESSION_SECRET: ${sessionSecret ? "✅ Set" : "❌ Not set"}`);
  console.log(`   NODE_ENV: ${nodeEnv}`);

  if (!databaseUrl) {
    console.log("\n❌ CRITICAL: DATABASE_URL is not set!");
    console.log("   You must set DATABASE_URL in Railway Variables.");
    process.exit(1);
  }

  if (!sessionSecret && nodeEnv === "production") {
    console.log("\n❌ CRITICAL: SESSION_SECRET is not set in production!");
    console.log("   You must set SESSION_SECRET in Railway Variables.");
    process.exit(1);
  }

  // Check database connection
  console.log("\n🔌 Database Connection Check:");
  const dbCheck = await checkDatabaseConnection(databaseUrl);
  
  if (dbCheck.canConnect) {
    console.log("   ✅ Database connection successful!");
    if (dbCheck.isPooler) {
      console.log("   ✅ Using pooled connection (good!)");
    } else {
      console.log("   ⚠️  Using direct connection (consider using pooler)");
    }
  } else {
    console.log("   ❌ Database connection failed!");
    console.log(`   Error: ${dbCheck.error}`);
    
    if (dbCheck.isIPv6) {
      console.log("\n   🔴 PROBLEM: Your DATABASE_URL contains an IPv6 address!");
      console.log("   Railway cannot reach IPv6 addresses.");
      console.log("   You MUST use Supabase's connection pooler.");
      console.log("\n   Fix:");
      console.log("   1. Go to Supabase Dashboard → Project Settings → Database");
      console.log("   2. Click 'Session' tab (NOT 'URI')");
      console.log("   3. Copy the pooled connection string");
      console.log("   4. Update DATABASE_URL in Railway Variables");
    }
    
    console.log("\n   Without database connection, login will NOT work!");
    process.exit(1);
  }

  // Check staff accounts
  console.log("\n👥 Staff Accounts Check:");
  const accountsCheck = await checkStaffAccounts(databaseUrl);
  
  console.log(`   Total accounts found: ${accountsCheck.total}/${ALLOWED_STAFF_EMAILS.length}`);
  
  const missingAccounts: string[] = [];
  const accountsWithoutPassword: string[] = [];
  
  accountsCheck.accounts.forEach(account => {
    if (!account.exists) {
      missingAccounts.push(account.email);
      console.log(`   ❌ ${account.email} - Account does not exist`);
    } else if (!account.hasPassword) {
      accountsWithoutPassword.push(account.email);
      console.log(`   ⚠️  ${account.email} - Exists but has no password`);
    } else {
      console.log(`   ✅ ${account.email} - Account exists with password`);
    }
  });

  // Generate recommendations
  const recommendations: string[] = [];

  if (missingAccounts.length > 0 || accountsWithoutPassword.length > 0) {
    recommendations.push("Staff accounts need to be created or have passwords set.");
    recommendations.push("The app should auto-create accounts on startup, but if database connection failed during startup, accounts may not exist.");
    recommendations.push("Try redeploying your app - the seedStaffAccounts() function should create missing accounts.");
  }

  if (!dbCheck.isPooler && dbCheck.canConnect) {
    recommendations.push("Consider switching to Supabase connection pooler for better reliability.");
  }

  // Summary
  console.log("\n📊 Summary:");
  console.log("=".repeat(60));
  
  if (dbCheck.canConnect && accountsCheck.total === ALLOWED_STAFF_EMAILS.length) {
    const allHavePasswords = accountsCheck.accounts.every(a => !a.exists || a.hasPassword);
    if (allHavePasswords) {
      console.log("✅ Everything looks good! Login should work.");
      console.log("\n   Try logging in with:");
      console.log("   Email: damien@denturesdirect.ca");
      console.log("   Password: TempPassword123!");
    } else {
      console.log("⚠️  Some accounts exist but don't have passwords.");
      console.log("   Redeploy the app to set passwords for missing accounts.");
    }
  } else {
    console.log("❌ Issues found that will prevent login:");
    if (!dbCheck.canConnect) {
      console.log("   - Database connection is failing");
    }
    if (accountsCheck.total < ALLOWED_STAFF_EMAILS.length) {
      console.log(`   - Only ${accountsCheck.total}/${ALLOWED_STAFF_EMAILS.length} staff accounts exist`);
    }
  }

  if (recommendations.length > 0) {
    console.log("\n💡 Recommendations:");
    recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
  }

  console.log("\n" + "=".repeat(60));
}

main().catch((error) => {
  console.error("❌ Diagnostic tool error:", error);
  process.exit(1);
});
