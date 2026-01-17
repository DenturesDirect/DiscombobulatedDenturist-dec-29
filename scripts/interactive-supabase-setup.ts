#!/usr/bin/env tsx
/**
 * Interactive Supabase Connection String Setup
 * 
 * This script guides you through building a properly encoded Supabase
 * connection string with password encoding handled automatically.
 * 
 * Usage:
 *   npm run setup-supabase
 *   or
 *   tsx scripts/interactive-supabase-setup.ts
 */

import { createInterface } from "readline";
import pg from "pg";

const { Pool } = pg;

interface SetupAnswers {
  projectRef: string;
  region: string;
  port: string;
  password: string;
  testConnection: boolean;
}

function question(rl: any, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer: string) => {
      resolve(answer.trim());
    });
  });
}

function buildConnectionString(answers: SetupAnswers): string {
  const encodedPassword = encodeURIComponent(answers.password);
  
  // Build connection string format:
  // postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-REGION.pooler.supabase.com:PORT/postgres?pgbouncer=true
  const connectionString = 
    `postgresql://postgres.${answers.projectRef}:${encodedPassword}@aws-0-${answers.region}.pooler.supabase.com:${answers.port}/postgres?pgbouncer=true`;
  
  return connectionString;
}

async function testConnection(connectionString: string): Promise<{ success: boolean; error?: string }> {
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    await pool.end();
    return { success: true };
  } catch (error: any) {
    await pool.end();
    return {
      success: false,
      error: error.message || String(error),
    };
  }
}

async function main() {
  console.log("🚀 Interactive Supabase Connection String Setup\n");
  console.log("=" .repeat(60));
  console.log("This script will help you build a properly encoded connection");
  console.log("string for Supabase that works with Railway.\n");
  
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const answers: SetupAnswers = {
    projectRef: '',
    region: '',
    port: '6543',
    password: '',
    testConnection: false,
  };

  try {
    // Get project reference ID
    console.log("📋 Step 1: Supabase Project Information");
    console.log("   Find this in Supabase Dashboard → Project Settings → General");
    answers.projectRef = await question(rl, "\n   Enter your Supabase project reference ID (e.g., qhexbhorylsvlpjkchkg): ");
    
    if (!answers.projectRef) {
      console.log("❌ Project reference ID is required!");
      process.exit(1);
    }

    // Get region
    console.log("\n📋 Step 2: Region");
    console.log("   Common regions: us-east-1, us-west-1, eu-west-1, ap-southeast-1");
    answers.region = await question(rl, "   Enter your Supabase region (default: us-east-1): ");
    if (!answers.region) {
      answers.region = 'us-east-1';
    }

    // Get port preference
    console.log("\n📋 Step 3: Port");
    console.log("   Port 6543 = Traditional pooler port");
    console.log("   Port 5432 = Newer pooler port (both work)");
    const portInput = await question(rl, "   Enter port (default: 6543): ");
    if (portInput) {
      answers.port = portInput;
    }

    // Get password
    console.log("\n📋 Step 4: Database Password");
    console.log("   ⚠️  This will be URL-encoded automatically to handle special characters!");
    console.log("   If you need to reset it: Supabase → Project Settings → Database → Reset password");
    console.log("   Note: Password will be visible as you type (for compatibility)");
    answers.password = await question(rl, "   Enter your Supabase database password: ");
    
    if (!answers.password) {
      console.log("❌ Password is required!");
      process.exit(1);
    }

    // Build connection string
    const connectionString = buildConnectionString(answers);
    
    console.log("\n" + "=" .repeat(60));
    console.log("✅ Connection String Generated!");
    console.log("=" .repeat(60));
    
    // Show info (mask password in display)
    const maskedString = connectionString.replace(/:([^:@]+)@/, ':****@');
    console.log("\n📊 Connection String Details:");
    console.log(`   Project: ${answers.projectRef}`);
    console.log(`   Region: ${answers.region}`);
    console.log(`   Port: ${answers.port}`);
    console.log(`   Password: ${"*".repeat(Math.min(answers.password.length, 20))} (${answers.password.length} chars, URL-encoded)`);
    console.log(`   Full string: ${maskedString}`);
    
    // Check if password has special chars
    const hasSpecialChars = /[^a-zA-Z0-9]/.test(answers.password);
    if (hasSpecialChars) {
      console.log("\n💡 Special Characters Detected:");
      console.log("   Your password contains special characters that require URL encoding.");
      console.log("   This script has automatically encoded them - that's why direct");
      console.log("   copy-paste was failing before!");
    }

    // Ask if user wants to test
    console.log("\n📋 Step 5: Test Connection (Optional)");
    const testInput = await question(rl, "   Test connection now? (y/N): ");
    answers.testConnection = testInput.toLowerCase() === 'y' || testInput.toLowerCase() === 'yes';

    if (answers.testConnection) {
      console.log("\n🧪 Testing connection...");
      const testResult = await testConnection(connectionString);
      
      if (testResult.success) {
        console.log("   ✅ Connection successful!");
      } else {
        console.log(`   ❌ Connection failed: ${testResult.error}`);
        console.log("\n   Common issues:");
        console.log("   - Password is incorrect (try resetting in Supabase)");
        console.log("   - Project reference or region is wrong");
        console.log("   - Network/firewall issues");
      }
    }

    // Final output
    console.log("\n" + "=" .repeat(60));
    console.log("📋 Ready-to-Use Connection String:");
    console.log("=" .repeat(60));
    console.log(connectionString);
    console.log("=" .repeat(60));
    
    console.log("\n📋 Next Steps:");
    console.log("   1. Copy the connection string above");
    console.log("   2. Go to Railway → Your Service → Variables tab");
    console.log("   3. Find DATABASE_URL and update it with the string above");
    console.log("   4. Save (Railway will auto-redeploy)");
    console.log("   5. Check Railway logs - should see '✅ Database migrations completed'");
    
    if (hasSpecialChars) {
      console.log("\n💡 Why This Works:");
      console.log("   Special characters in passwords (like @, #, $, %, &, +, =)");
      console.log("   break PostgreSQL connection strings. This script automatically");
      console.log("   URL-encodes them so they work correctly!");
    }

  } catch (error: any) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  } finally {
    rl.close();
  }

  console.log("\n" + "=" .repeat(60));
  console.log("🎉 Done! Your connection string is ready to use.");
  console.log("=" .repeat(60));
}

main().catch((error) => {
  console.error("❌ Fatal error:", error);
  process.exit(1);
});
