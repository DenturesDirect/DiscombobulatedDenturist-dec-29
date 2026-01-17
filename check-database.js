// Quick script to check where your database is located
// Run this in Railway Shell: node check-database.js

console.log('🔍 Checking Database Connection...\n');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.log('❌ NO DATABASE_URL FOUND!');
  console.log('⚠️  Your app is using IN-MEMORY storage');
  console.log('⚠️  Data will be LOST on restart!\n');
  console.log('💡 To fix: Add DATABASE_URL to Railway Variables');
  process.exit(1);
}

console.log('✅ DATABASE_URL is set\n');

// Parse the connection string (don't log the full thing for security)
const url = new URL(DATABASE_URL.replace(/^postgresql:\/\//, 'http://'));

console.log('📊 Database Information:');
console.log('   Host:', url.hostname);
console.log('   Port:', url.port || '5432');
console.log('   Database:', url.pathname.replace('/', '') || 'postgres');
console.log('');

// Determine which service
if (url.hostname.includes('railway.internal') || url.hostname.includes('railway.app')) {
  console.log('✅ Database Location: RAILWAY POSTGRESQL');
  console.log('   → Your data is stored in Railway\'s PostgreSQL database');
  console.log('   → Check: Railway → PostgreSQL service → Data tab');
} else if (url.hostname.includes('supabase.co')) {
  console.log('⚠️  Database Location: SUPABASE');
  console.log('   → Your data is stored in Supabase PostgreSQL');
  console.log('   → Check: Supabase Dashboard → Table Editor');
} else if (url.hostname.includes('neon.tech')) {
  console.log('⚠️  Database Location: NEON');
  console.log('   → Your data is stored in Neon PostgreSQL');
  console.log('   → Check: Neon Dashboard → Database');
} else {
  console.log('❓ Database Location: UNKNOWN');
  console.log('   → Host:', url.hostname);
  console.log('   → Check your database provider dashboard');
}

console.log('\n📝 Next Steps:');
console.log('   1. Go to your database provider (Railway/Supabase/Neon)');
console.log('   2. Check the "Data" or "Table Editor" tab');
console.log('   3. Look for tables: patients, users, clinical_notes, tasks');
console.log('   4. If tables exist with data → That\'s where your data is!');
