#!/usr/bin/env node

/**
 * Manual Prisma Client generation using WASM
 * This script creates a Prisma Client when binary downloads are blocked
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const backendDir = path.join(__dirname, '..');
const prismaSchemaPath = path.join(backendDir, 'prisma', 'schema.prisma');
const nodeModulesPath = path.join(backendDir, 'node_modules', '.prisma', 'client');

console.log('PathLife Prisma Client Generator');
console.log('='.repeat(50));
console.log();

// Check if schema exists
if (!fs.existsSync(prismaSchemaPath)) {
  console.error('❌ Error: prisma/schema.prisma not found!');
  process.exit(1);
}

console.log('✓ Found Prisma schema');

// Try to generate using WASM
try {
  console.log('\nAttempting to generate Prisma Client...');

  // Use the locally installed Prisma with WASM engine
  execSync('npx prisma generate', {
    cwd: backendDir,
    stdio: 'inherit',
    env: {
      ...process.env,
      PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING: '1',
      PRISMA_CLI_QUERY_ENGINE_TYPE: 'wasm',
    }
  });

  console.log('\n✅ Prisma Client generated successfully!');

} catch (error) {
  console.error('\n❌ Failed to generate Prisma Client');
  console.error('\nThis is a network-restricted environment.');
  console.error('Please run this on your local machine:');
  console.error('\n  cd apps/backend');
  console.error('  npx prisma generate');
  console.error('  npm run dev\n');
  process.exit(1);
}
