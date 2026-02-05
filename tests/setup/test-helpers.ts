import { Express } from 'express';
import { clearDatabase, getPrismaTestClient } from './test-db';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';

/**
 * Reset database between tests
 * Call this in beforeEach() to ensure test isolation
 */
export const resetDatabase = async (): Promise<void> => {
  await clearDatabase();
};

/**
 * Create Express app for testing without starting the server
 * This imports the app from src/app.ts
 */
export const createTestApp = async (): Promise<Express> => {
  // Dynamically import to ensure .env.test is loaded first
  const { default: app } = await import('../../src/app');
  return app;
};

/**
 * Helper to create a test user with hashed password
 */
export interface CreateUserParams {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  isVerified?: boolean;
}

export const createTestUser = async (params: CreateUserParams = {}) => {
  const prisma = getPrismaTestClient();
  
  const email = params.email || `test-${Date.now()}@example.com`;
  const password = params.password || 'Test123!@#';
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName: params.firstName || 'Test',
      lastName: params.lastName || 'User',
      isVerified: params.isVerified ?? true,
    },
  });

  return {
    user,
    plainPassword: password,
  };
};

/**
 * Create an authenticated user and return access token + cookies
 */
export interface AuthenticatedUser {
  user: any;
  accessToken: string;
  refreshToken: string;
  cookies: string[];
}

export const createAuthenticatedUser = async (
  params: CreateUserParams = {}
): Promise<AuthenticatedUser> => {
  const { user, plainPassword } = await createTestUser(params);

  // Generate tokens
  const accessTokenSecret = process.env.JWT_ACCESS_TOKEN_SECRET || 'test-secret';
  const refreshTokenSecret = process.env.JWT_REFRESH_TOKEN_SECRET || 'test-refresh-secret';
  const accessTokenExpiry = process.env.ACCESS_TOKEN_EXPIRES_IN || '1d';
  const refreshTokenExpiry = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d';

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    accessTokenSecret,
    { expiresIn: accessTokenExpiry } as jwt.SignOptions
  );

  const tokenId = randomUUID();
  const refreshToken = jwt.sign(
    { userId: user.id, jti: tokenId },
    refreshTokenSecret,
    { expiresIn: refreshTokenExpiry } as jwt.SignOptions
  );

  // Update user with currentTokenId
  const prisma = getPrismaTestClient();
  await prisma.user.update({
    where: { id: user.id },
    data: { currentTokenId: tokenId },
  });

  // Simulate cookie headers
  const cookies = [
    `${process.env.REFRESH_COOKIE_NAME || 'refreshToken'}=${refreshToken}; Path=/; HttpOnly`,
  ];

  return {
    user,
    accessToken,
    refreshToken,
    cookies,
  };
};

/**
 * Generate a valid JWT access token for testing
 */
export const generateTestToken = (userId: string, email: string): string => {
  const secret = process.env.JWT_ACCESS_TOKEN_SECRET || 'test-secret';
  return jwt.sign(
    { userId, email },
    secret,
    { expiresIn: '1h' } as jwt.SignOptions
  );
};

/**
 * Helper to create a test organization
 */
export interface CreateOrganizationParams {
  name?: string;
  slug?: string;
  ownerId: string;
}

export const createTestOrganization = async (params: CreateOrganizationParams) => {
  const prisma = getPrismaTestClient();

  const organization = await prisma.organization.create({
    data: {
      name: params.name || `Test Org ${Date.now()}`,
      slug: params.slug || `test-org-${Date.now()}`,
      ownerId: params.ownerId,
    },
  });

  return organization;
};
