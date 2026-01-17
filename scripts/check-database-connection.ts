#!/usr/bin/env tsx
/**
 * Database Connection Diagnostic Tool
 * 
 * This script checks your DATABASE_URL and provides specific guidance
 * on fixing connection issues.
 * 
 * Run with: npx tsx scripts/check-database-connection.ts
 */

import pg from "pg";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Try to load environment variables from .env file (optional)
try {
  const dotenv = await import("dotenv");
  dotenv.config({ path: join(__dirname, "..", ".env") });
} catch {
  // dotenv not available or .env file doesn't exist - that's okay
  // Environment variables should be set in the hosting platform
}

const { Pool } = pg;

interface ConnectionDiagnostic {
  hasDatabaseUrl: boolean;
  isPooler: boolean;
  isIPv6: boolean;
  isValidFormat: boolean;
  canConnect: boolean;
  error?: string;
  recommendation: string;
  steps: string[];
}

function analyzeConnectionString(url: string | undefined): ConnectionDiagnostic {
  const result: ConnectionDiagnostic = {
    hasDatabaseUrl: !!url,
    isPooler: false,
    isIPv6: false,
    isValidFormat: false,
    canConnect: false,
    recommendation: "",
    steps: [],
  };

  if (!url) {
    result.recommendation = "❌ DATABASE_URL is not set";
    result.steps = [
      "1. Go to Supabase Dashboard → Project Settings → Database",
      "2. Get your connection string",
      "3. Set DATABASE_URL environment variable",
    ];
    return result;
  }

  // Check if it's a pooler connection
  result.isPooler = url.includes("pooler.supabase.com");
  
  // Check if it contains IPv6 address
  result.isIPv6 = /\[[a-f0-9:]+\]|2600:1f18|::/.test(url);
  
  // Check if it's a valid PostgreSQL connection string
  result.isValidFormat = /^postgresql:\/\//.test(url);

  // Determine recommendation
  if (result.isIPv6 && !result.isPooler) {
    result.recommendation = "❌ Using IPv6 direct connection - This will fail!";
    result.steps = [
      "1. Go to Supabase Dashboard → Your Project",
      "2. Click 'Project Settings' (gear icon) → 'Database'",
      "3. Scroll to 'Connection string' section",
      "4. Click the 'Session' tab (NOT 'URI')",
      "5. Copy the connection string (contains 'pooler.supabase.com')",
      "6. Replace [YOUR-PASSWORD] with your actual database password",
      "7. Update DATABASE_URL in Railway Variables with the new string",
      "8. Redeploy your service",
    ];
  } else if (!result.isPooler) {
    result.recommendation = "⚠️  Using direct connection - Consider using pooler for better reliability";
    result.steps = [
      "1. Consider switching to Supabase connection pooler",
      "2. Go to Supabase → Project Settings → Database → Connection string → Session tab",
      "3. Use the pooled connection string instead",
    ];
  } else {
    result.recommendation = "✅ Using pooled connection - This should work!";
    result.steps = [
      "If you're still having issues, check:",
      "1. Make sure your database password is correct in the connection string",
      "2. Verify your Supabase project is active",
      "3. Check Railway logs for specific error messages",
    ];
  }

  return result;
}

async function testConnection(url: string): Promise<{ canConnect: boolean; error?: string }> {
  const pool = new Pool({
    connectionString: url,
    connectionTimeoutMillis: 5000,
  });

  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    await pool.end();
    return { canConnect: true };
  } catch (error: any) {
    await pool.end();
    return {
      canConnect: false,
      error: error.message || String(error),
    };
  }
}

async function main() {
  console.log("🔍 Database Connection Diagnostic Tool\n");
  console.log("=" .repeat(60));

  const databaseUrl = process.env.DATABASE_URL;
  const analysis = analyzeConnectionString(databaseUrl);

  console.log("\n📊 Connection String Analysis:");
  console.log(`   Has DATABASE_URL: ${analysis.hasDatabaseUrl ? "✅ Yes" : "❌ No"}`);
  
  if (databaseUrl) {
    // Mask password in output
    const maskedUrl = databaseUrl.replace(/:([^:@]+)@/, ":****@");
    console.log(`   Connection String: ${maskedUrl.substring(0, 80)}...`);
    console.log(`   Is Pooler: ${analysis.isPooler ? "✅ Yes" : "❌ No"}`);
    console.log(`   Is IPv6: ${analysis.isIPv6 ? "⚠️  Yes (problematic)" : "✅ No"}`);
    console.log(`   Valid Format: ${analysis.isValidFormat ? "✅ Yes" : "❌ No"}`);

    console.log("\n🧪 Testing Connection...");
    const connectionTest = await testConnection(databaseUrl);
    analysis.canConnect = connectionTest.canConnect;
    
    if (connectionTest.canConnect) {
      console.log("   ✅ Connection successful!");
    } else {
      console.log(`   ❌ Connection failed: ${connectionTest.error}`);
      analysis.error = connectionTest.error;
    }
  }

  console.log("\n💡 Recommendation:");
  console.log(`   ${analysis.recommendation}`);

  if (analysis.steps.length > 0) {
    console.log("\n📋 Next Steps:");
    analysis.steps.forEach((step, i) => {
      console.log(`   ${step}`);
    });
  }

  // If IPv6 detected, provide specific help
  if (analysis.isIPv6 && !analysis.isPooler) {
    console.log("\n🔧 Quick Fix Guide:");
    console.log("   1. Your connection string contains an IPv6 address");
    console.log("   2. Railway cannot reach IPv6 addresses from containers");
    console.log("   3. You MUST use Supabase's connection pooler");
    console.log("\n   Get the pooled string from:");
    console.log("   Supabase Dashboard → Project Settings → Database");
    console.log("   → Connection string → 'Session' tab");
    console.log("\n   The pooled string will look like:");
    console.log("   postgresql://postgres.[PROJECT]:[PASSWORD]@");
    console.log("   aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true");
  }

  console.log("\n" + "=".repeat(60));
  
  // Exit with error code if connection failed
  if (!analysis.canConnect && databaseUrl) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("❌ Diagnostic tool error:", error);
  process.exit(1);
});
