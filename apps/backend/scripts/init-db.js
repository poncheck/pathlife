#!/usr/bin/env node

/**
 * Database initialization script
 * Creates SQLite database with all required tables
 */

const fs = require('fs');
const path = require('path');

// For environments where Prisma engines can't be downloaded
// We'll create a minimal SQLite database manually

const dbPath = path.join(__dirname, '..', 'pathlife.db');
const sqlPath = path.join(__dirname, '..', 'init-db.sql');

console.log('PathLife Database Initialization');
console.log('=================================\n');

console.log(`Database path: ${dbPath}`);
console.log(`SQL script: ${sqlPath}\n`);

// Check if SQL file exists
if (!fs.existsSync(sqlPath)) {
  console.error('Error: init-db.sql not found!');
  process.exit(1);
}

// Create empty database file
console.log('Creating database file...');
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, '');
  console.log('✓ Database file created');
} else {
  console.log('✓ Database file already exists');
}

console.log('\n' + '='.repeat(50));
console.log('IMPORTANT: Database schema initialization');
console.log('='.repeat(50));
console.log('\nYou need to run the SQL schema manually:');
console.log('\n1. Install sqlite3:');
console.log('   brew install sqlite3     (macOS)');
console.log('   apt-get install sqlite3  (Linux)');
console.log('\n2. Initialize the schema:');
console.log(`   sqlite3 ${dbPath} < ${sqlPath}`);
console.log('\n3. Or use Prisma (if engines work):');
console.log('   npx prisma db push\n');
console.log('='.repeat(50) + '\n');
