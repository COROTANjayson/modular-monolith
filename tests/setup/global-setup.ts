import dotenv from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Global setup runs once before all tests
 * - Loads .env.test environment variables
 * - Runs Prisma migrations on test database
 */
export default async function globalSetup() {
  console.log('\n🔧 Global Test Setup Started...\n');

  // Load .env.test environment variables
  const envPath = path.resolve(__dirname, '../../.env.test');
  dotenv.config({ path: envPath });

  console.log('✅ Loaded test environment variables');
  console.log(`📦 Test Database: ${process.env.DATABASE_URL?.split('@')[1]}\n`);

  try {
    // Run Prisma migrations on test database
    console.log('🔄 Running Prisma migrations...');
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: {
        ...process.env,
        DATABASE_URL: process.env.DATABASE_URL,
      },
    });
    console.log('✅ Database migrations completed\n');

    // Optionally generate Prisma client
    console.log('🔄 Generating Prisma Client...');
    execSync('npx prisma generate', {
      stdio: 'inherit',
    });
    console.log('✅ Prisma Client generated\n');

    console.log('✨ Global Test Setup Complete\n');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}
