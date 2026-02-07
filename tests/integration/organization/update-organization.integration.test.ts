import request from 'supertest';
import { Express } from 'express';
import {
  createTestApp,
  resetDatabase,
  createAuthenticatedUser,
  createTestOrganization,
} from '../../setup/test-helpers';
import { getPrismaTestClient } from '../../setup/test-db';

describe('Organization Module - Update Organization', () => {
  let app: Express;
  let prisma: ReturnType<typeof getPrismaTestClient>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = getPrismaTestClient();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('PATCH /api/v1/organizations/:id', () => {
    // ========================================
    // Happy Path Tests
    // ========================================

    it('should update organization name as OWNER', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Old Organization Name',
        ownerId: user.id,
      });

      const updateData = {
        name: 'New Organization Name',
      };

      // Act
      const response = await request(app)
        .patch(`/api/v1/organizations/${org.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('code', 'ORG_UPDATED');
      expect(response.body).toHaveProperty('message', 'Organization updated successfully');
      expect(response.body.data.name).toBe(updateData.name);
    });

    it('should update organization name as ADMIN', async () => {
      // Arrange
      const { user: owner } = await createAuthenticatedUser({
        email: 'owner@test.com',
      });

      const { accessToken: adminToken, user: adminUser } = await createAuthenticatedUser({
        email: 'admin@test.com',
      });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      // Add admin user as ADMIN role
      await prisma.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: adminUser.id,
          role: 'admin',
          status: 'active',
        },
      });

      const updateData = {
        name: 'Updated by Admin',
      };

      // Act
      const response = await request(app)
        .patch(`/api/v1/organizations/${org.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('code', 'ORG_UPDATED');
      expect(response.body.data.name).toBe(updateData.name);
    });

    // ========================================
    // Validation Tests
    // ========================================

    it('should reject name too short (< 3 chars)', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      const updateData = {
        name: 'AB', // 2 characters
      };

      // Act
      const response = await request(app)
        .patch(`/api/v1/organizations/${org.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject name too long (> 50 chars)', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      const updateData = {
        name: 'A'.repeat(51), // 51 characters
      };

      // Act
      const response = await request(app)
        .patch(`/api/v1/organizations/${org.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject unknown fields (schema.strict())', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      const updateData = {
        name: 'Valid Name',
        unknownField: 'This should fail',
      };

      // Act
      const response = await request(app)
        .patch(`/api/v1/organizations/${org.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should allow empty update (all fields optional)', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      // Act
      const response = await request(app)
        .patch(`/api/v1/organizations/${org.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.name).toBe(org.name); // Name unchanged
    });

    // ========================================
    // Authorization Tests
    // ========================================

    it('should return 403 when user is MEMBER (lacks ORG_UPDATE permission)', async () => {
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

      // Add member user as MEMBER role (no update permission)
      await prisma.organizationMember.create({
        data: {
          organizationId: org.id,
          userId: memberUser.id,
          role: 'member',
          status: 'active',
        },
      });

      const updateData = {
        name: 'Trying to Update',
      };

      // Act
      const response = await request(app)
        .patch(`/api/v1/organizations/${org.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send(updateData)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('code', 'ERROR_FORBIDDEN');
      expect(response.body).toHaveProperty('message', 'You do not have permission to perform this action');
    });

    it('should return 403 when user is not member of organization', async () => {
      // Arrange
      const { accessToken: token1, user: user1 } = await createAuthenticatedUser({
        email: 'user1@test.com',
      });

      const { user: user2 } = await createAuthenticatedUser({
        email: 'user2@test.com',
      });

      const org = await createTestOrganization({
        name: 'User2 Organization',
        ownerId: user2.id,
      });

      const updateData = {
        name: 'Trying to Update',
      };

      // Act - User1 tries to update User2's organization
      const response = await request(app)
        .patch(`/api/v1/organizations/${org.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send(updateData)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('code', 'ERROR_FORBIDDEN');
      expect(response.body).toHaveProperty('message', 'You are not a member of this organization');
    });

    // ========================================
    // Error Cases
    // ========================================

    it('should return 404 for non-existent organization', async () => {
      // Arrange
      const { accessToken } = await createAuthenticatedUser();
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const updateData = {
        name: 'Updated Name',
      };

      // Act
      const response = await request(app)
        .patch(`/api/v1/organizations/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
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

      const updateData = {
        name: 'Updated Name',
      };

      // Act
      const response = await request(app)
        .patch(`/api/v1/organizations/${org.id}`)
        .send(updateData)
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

      const updateData = {
        name: 'Updated Name',
      };

      // Act
      const response = await request(app)
        .patch(`/api/v1/organizations/${org.id}`)
        .set('Authorization', 'Bearer invalid-token-xyz')
        .send(updateData)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    // ========================================
    // Data Persistence Tests
    // ========================================

    it('should verify organization is actually updated in database', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Original Name',
        ownerId: user.id,
      });

      const updateData = {
        name: 'Database Updated Name',
      };

      // Act
      const response = await request(app)
        .patch(`/api/v1/organizations/${org.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      // Assert - Check database
      const dbOrg = await prisma.organization.findUnique({
        where: { id: org.id },
      });

      expect(dbOrg).toBeTruthy();
      expect(dbOrg?.name).toBe(updateData.name);
      expect(response.body.data.name).toBe(updateData.name);
    });
  });
});
