import request from 'supertest';
import { Express } from 'express';
import {
  createTestApp,
  resetDatabase,
  createAuthenticatedUser,
  createTestOrganization,
} from '../../setup/test-helpers';
import { getPrismaTestClient } from '../../setup/test-db';

describe('Organization Module - Get Organization by ID', () => {
  let app: Express;
  let prisma: ReturnType<typeof getPrismaTestClient>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = getPrismaTestClient();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('GET /api/v1/organizations/:id', () => {
    // ========================================
    // Happy Path Tests
    // ========================================

    it('should return organization details when user is member', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      // Act
      const response = await request(app)
        .get(`/api/v1/organizations/${org.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('code', 'SUCCESS_FETCHED');
      expect(response.body).toHaveProperty('message', 'Organization retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        id: org.id,
        name: org.name,
        ownerId: user.id,
        slug: org.slug,
      });
    });

    // ========================================
    // Authorization Tests
    // ========================================

    it('should return 403 when user is not member', async () => {
      // Arrange
      const { accessToken: token1, user: user1 } = await createAuthenticatedUser({
        email: 'user1@test.com',
      });

      const { user: user2 } = await createAuthenticatedUser({
        email: 'user2@test.com',
      });

      // User2 creates an organization
      const org = await createTestOrganization({
        name: 'User2 Organization',
        ownerId: user2.id,
      });

      // Act - User1 tries to access User2's organization
      const response = await request(app)
        .get(`/api/v1/organizations/${org.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('code', 'ERROR_FORBIDDEN');
      expect(response.body).toHaveProperty('message', 'You are not a member of this organization');
    });

    it('should allow any member role to view (MEMBER, ADMIN, OWNER)', async () => {
      // Arrange
      const { user: owner } = await createAuthenticatedUser({
        email: 'owner@test.com',
      });

      const { accessToken: memberToken, user: memberUser } = await createAuthenticatedUser({
        email: 'member@test.com',
      });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      // Add member user as MEMBER role
      await prisma.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: memberUser.id,
          role: 'member',
          status: 'active',
        },
      });

      // Act - Member tries to view organization
      const response = await request(app)
        .get(`/api/v1/organizations/${org.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.id).toBe(org.id);
    });

    // ========================================
    // Error Cases
    // ========================================

    it('should return 404 for non-existent organization', async () => {
      // Arrange
      const { accessToken } = await createAuthenticatedUser();
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      // Act
      const response = await request(app)
        .get(`/api/v1/organizations/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403); // Returns 403 because ensureHasPermission is checked first

      // Assert
      expect(response.body).toHaveProperty('success', false);
    });

    // ========================================
    // Authentication Tests
    // ========================================

    it('should return 401 without authorization header', async () => {
      // Arrange
      const { user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      // Act
      const response = await request(app)
        .get(`/api/v1/organizations/${org.id}`)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Missing token');
    });

    it('should return 401 with invalid token', async () => {
      // Arrange
      const { user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      // Act
      const response = await request(app)
        .get(`/api/v1/organizations/${org.id}`)
        .set('Authorization', 'Bearer invalid-token-abc')
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });
  });
});
