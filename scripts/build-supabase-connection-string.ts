#!/usr/bin/env tsx
/**
 * Supabase Connection String Builder with Password Encoding
 * 
 * This script properly URL-encodes passwords in PostgreSQL connection strings.
 * Special characters in passwords (like @, #, $, %, &, +, =, etc.) must be
 * percent-encoded when placed in connection strings.
 * 
 * Usage:
 *   tsx scripts/build-supabase-connection-string.ts
 * 
 * Or provide arguments:
 *   tsx scripts/build-supabase-connection-string.ts "template" "password"
 */

function urlEncodePassword(password: string): string {
  // URL-encode the password to handle special characters
  // This is critical - special chars like @, #, $, %, &, +, = break connection strings
  return encodeURIComponent(password);
}

function buildConnectionString(
  template: string,
  password: string
): string {
  // Replace [YOUR-PASSWORD] or [PASSWORD] placeholder with URL-encoded password
  const encodedPassword = urlEncodePassword(password);
  
  let connectionString = template
    .replace(/\[YOUR-PASSWORD\]/gi, encodedPassword)
    .replace(/\[PASSWORD\]/gi, encodedPassword);
  
  // If template doesn't have a placeholder, try to insert password
  // Look for pattern: postgres.xxx:PLACEHOLDER@
  if (!connectionString.includes(encodedPassword) && !template.includes(':')) {
    // Try to find where password should go
    const match = template.match(/postgres(?:\.\w+)?:(.+?)@/);
    if (match) {
      connectionString = template.replace(match[1], encodedPassword);
    }
  }
  
  return connectionString;
}

function validateConnectionString(connectionString: string): {
  valid: boolean;
  error?: string;
  hasPooler: boolean;
} {
  // Check if it's a valid PostgreSQL connection string
  if (!/^postgresql:\/\//.test(connectionString)) {
    return {
      valid: false,
      error: "Connection string must start with 'postgresql://'",
      hasPooler: false,
    };
  }
  
  // Check if it uses the pooler (recommended)
  const hasPooler = connectionString.includes("pooler.supabase.com");
  
  // Check for common issues
  if (connectionString.includes("[YOUR-PASSWORD]") || connectionString.includes("[PASSWORD]")) {
    return {
      valid: false,
      error: "Password placeholder not replaced! Make sure you provided a password.",
      hasPooler,
    };
  }
  
  // Check for IPv6 addresses (problematic)
  if (/\[[a-f0-9:]+\]|2600:1f18/.test(connectionString)) {
    return {
      valid: true,
      error: "Warning: Connection string contains IPv6 address. Consider using pooler connection instead.",
      hasPooler: false,
    };
  }
  
  return { valid: true, hasPooler };
}

async function main() {
  const args = process.argv.slice(2);
  
  console.log("🔧 Supabase Connection String Builder\n");
  console.log("=" .repeat(60));
  
  let template: string;
  let password: string;
  
  if (args.length >= 2) {
    // Command line arguments provided
    template = args[0];
    password = args[1];
  } else {
    // Interactive mode
    console.log("\n📋 Enter your Supabase connection string template:");
    console.log("   (The one with [YOUR-PASSWORD] placeholder from Supabase dashboard)");
    console.log("   Example: postgresql://postgres.qhexbhorylsvlpjkchkg:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true\n");
    
    // For now, we'll require command line args or readline
    // In a real scenario, you'd use readline or a prompt library
    console.log("❌ Please provide template and password as arguments:");
    console.log("   tsx scripts/build-supabase-connection-string.ts \"template\" \"password\"\n");
    console.log("Or use the interactive setup script:");
    console.log("   npm run setup-supabase\n");
    process.exit(1);
  }
  
  console.log("\n📥 Input:");
  console.log(`   Template: ${template.substring(0, 80)}...`);
  console.log(`   Password: ${"*".repeat(Math.min(password.length, 20))} (${password.length} chars)`);
  
  // Build the connection string
  const connectionString = buildConnectionString(template, password);
  
  console.log("\n🔍 Analysis:");
  const validation = validateConnectionString(connectionString);
  console.log(`   Valid format: ${validation.valid ? "✅ Yes" : "❌ No"}`);
  console.log(`   Uses pooler: ${validation.hasPooler ? "✅ Yes (recommended)" : "⚠️  No"}`);
  if (validation.error) {
    console.log(`   ${validation.error}`);
  }
  
  console.log("\n✅ Final Connection String (URL-encoded password):");
  console.log("=" .repeat(60));
  console.log(connectionString);
  console.log("=" .repeat(60));
  
  // Show password encoding info if password has special chars
  const hasSpecialChars = /[^a-zA-Z0-9]/.test(password);
  if (hasSpecialChars) {
    console.log("\n💡 Password Encoding Info:");
    console.log("   Your password contains special characters that were URL-encoded.");
    console.log("   This is why direct copy-paste was failing!");
    console.log("\n   Special characters in passwords MUST be encoded:");
    console.log("   @ → %40   # → %23   $ → %24   % → %25");
    console.log("   & → %26   + → %2B   = → %3D   / → %2F   ? → %3F");
  }
  
  console.log("\n📋 Next Steps:");
  console.log("   1. Copy the connection string above");
  console.log("   2. Go to Railway → Your Service → Variables");
  console.log("   3. Update DATABASE_URL with this connection string");
  console.log("   4. Railway will auto-redeploy");
  console.log("   5. Check logs - should see '✅ Database migrations completed'");
  
  console.log("\n" + "=" .repeat(60));
}

main().catch((error) => {
  console.error("❌ Error:", error.message);
  process.exit(1);
});
