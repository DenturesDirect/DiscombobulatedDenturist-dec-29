// Quick script to generate SQL for setting passwords
import bcrypt from 'bcryptjs';

const password = 'TempPassword123!';
const emails = [
  'damien@denturesdirect.ca',
  'michael@denturesdirect.ca',
  'luisa@denturesdirect.ca',
  'info@denturesdirect.ca'
];

async function generateSQL() {
  const hash = await bcrypt.hash(password, 12);
  
  console.log('-- Copy and paste this SQL into Railway PostgreSQL Query tab:\n');
  
  for (const email of emails) {
    console.log(`UPDATE users SET password = '${hash}' WHERE email = '${email}' AND password IS NULL;`);
  }
  
  console.log('\n-- Verify passwords are set:');
  console.log(`SELECT email, CASE WHEN password IS NULL THEN '❌ No password' ELSE '✅ Has password' END as status FROM users WHERE email IN (${emails.map(e => `'${e}'`).join(', ')});`);
}

generateSQL();
