import { PrismaClient } from '@prisma/client';

// Singleton Prisma client for tests
let prismaClient: PrismaClient | null = null;

export const getPrismaTestClient = (): PrismaClient => {
  if (!prismaClient) {
    prismaClient = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }
  return prismaClient;
};

export const disconnectPrisma = async (): Promise<void> => {
  if (prismaClient) {
    await prismaClient.$disconnect();
    prismaClient = null;
  }
};

/**
 * Clears all data from the test database by truncating tables
 * This is much faster than dropping and recreating the database
 */
export const clearDatabase = async (): Promise<void> => {
  const prisma = getPrismaTestClient();

  // Get all table names from Prisma schema
  const tables = [
    'OrganizationInvitation',
    'OrganizationMember',
    'Organization',
    'User',
  ];

  try {
    // Disable foreign key checks
    await prisma.$executeRawUnsafe('SET session_replication_role = replica;');

    // Truncate all tables
    for (const table of tables) {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
    }

    // Re-enable foreign key checks
    await prisma.$executeRawUnsafe('SET session_replication_role = DEFAULT;');
  } catch (error) {
    console.error('Error clearing database:', error);
    throw error;
  }
};
