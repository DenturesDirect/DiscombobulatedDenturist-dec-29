// Quick script to check what environment variables Railway is providing
// Run this in Railway Shell: node check-env.js

console.log("=== ENVIRONMENT VARIABLES CHECK ===");
console.log("");

// Check for Supabase variables
const supabaseVars = Object.keys(process.env)
  .filter(key => key.toUpperCase().includes('SUPABASE'))
  .sort();

console.log("🔍 Supabase-related variables found:", supabaseVars.length);
if (supabaseVars.length > 0) {
  supabaseVars.forEach(key => {
    const value = process.env[key];
    if (value) {
      const preview = value.length > 30 
        ? `${value.substring(0, 30)}...` 
        : value;
      console.log(`  ✅ ${key} = ${preview}`);
    } else {
      console.log(`  ⚠️  ${key} = (empty)`);
    }
  });
} else {
  console.log("  ❌ NO SUPABASE VARIABLES FOUND!");
  console.log("");
  console.log("All environment variables starting with 'S':");
  Object.keys(process.env)
    .filter(key => key.startsWith('S'))
    .sort()
    .forEach(key => {
      console.log(`  - ${key}`);
    });
}

console.log("");
console.log("=== ALL ENV VARS (first 50) ===");
const allVars = Object.keys(process.env).sort().slice(0, 50);
allVars.forEach(key => {
  console.log(`  ${key}`);
});
