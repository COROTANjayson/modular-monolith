import { disconnectPrisma } from './test-db';

/**
 * Global teardown runs once after all tests
 * - Closes Prisma connections
 * - Cleans up resources
 */
export default async function globalTeardown() {
  console.log('\n🧹 Global Test Teardown Started...\n');

  try {
    await disconnectPrisma();
    console.log('✅ Prisma disconnected');
    console.log('✨ Global Test Teardown Complete\n');
  } catch (error) {
    console.error('❌ Global teardown error:', error);
  }
}
