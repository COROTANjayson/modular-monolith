import request from 'supertest';
import { Express } from 'express';
import {
  createTestApp,
  resetDatabase,
  createAuthenticatedUser,
  createTestOrganization,
  createTestMember,
} from '../../../setup/test-helpers';
import { getPrismaTestClient } from '../../../setup/test-db';

describe('Organization Member - Update Member Role', () => {
  let app: Express;
  let prisma: ReturnType<typeof getPrismaTestClient>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = getPrismaTestClient();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('PATCH /api/v1/organizations/:id/members/:userId/role', () => {
    // ========================================
    // Happy Path Tests
    // ========================================

    it('should successfully update member role as OWNER', async () => {
      // Arrange
      const { accessToken, user: owner } = await createAuthenticatedUser({ email: 'owner@test.com' });
      const { user: targetMember } = await createAuthenticatedUser({ email: 'target@test.com' });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      await createTestMember({
        organizationId: org.id,
        userId: targetMember.id,
        role: 'member',
      });

      const updateData = {
        role: 'admin',
      };

      // Act
      const response = await request(app)
        .patch(`/api/v1/organizations/${org.id}/members/${targetMember.id}/role`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.role).toBe('admin');
    });

    it('should successfully update member role as ADMIN', async () => {
      // Arrange
      const { user: owner } = await createAuthenticatedUser({ email: 'owner@test.com' });
      const { accessToken: adminToken, user: admin } = await createAuthenticatedUser({ email: 'admin@test.com' });
      const { user: targetMember } = await createAuthenticatedUser({ email: 'target@test.com' });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      await createTestMember({
        organizationId: org.id,
        userId: admin.id,
        role: 'admin',
      });

      await createTestMember({
        organizationId: org.id,
        userId: targetMember.id,
        role: 'member',
      });

      const updateData = {
        role: 'admin',
      };

      // Act
      const response = await request(app)
        .patch(`/api/v1/organizations/${org.id}/members/${targetMember.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
    });

    it('should update from admin to member', async () => {
      // Arrange
      const { accessToken, user: owner } = await createAuthenticatedUser({ email: 'owner@test.com' });
      const { user: targetAdmin } = await createAuthenticatedUser({ email: 'admin@test.com' });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      await createTestMember({
        organizationId: org.id,
        userId: targetAdmin.id,
        role: 'admin',
      });

      const updateData = {
        role: 'member',
      };

      // Act
      const response = await request(app)
        .patch(`/api/v1/organizations/${org.id}/members/${targetAdmin.id}/role`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body.data.role).toBe('member');
    });

    // ========================================
    // Validation Tests
    // ========================================

    it('should reject owner role assignment', async () => {
      // Arrange
      const { accessToken, user: owner } = await createAuthenticatedUser({ email: 'owner@test.com' });
      const { user: targetMember } = await createAuthenticatedUser({ email: 'member@test.com' });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      await createTestMember({
        organizationId: org.id,
        userId: targetMember.id,
        role: 'member',
      });

      const updateData = {
        role: 'owner',
      };

      // Act
      const response = await request(app)
        .patch(`/api/v1/organizations/${org.id}/members/${targetMember.id}/role`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'An organization can only have one owner');
    });

    // ========================================
    // Authorization Tests
    // ========================================

    it('should return 403 when MEMBER tries to update role', async () => {
      // Arrange
      const { user: owner } = await createAuthenticatedUser({ email: 'owner@test.com' });
      const { accessToken: memberToken, user: member1 } = await createAuthenticatedUser({ email: 'member1@test.com' });
      const { user: member2 } = await createAuthenticatedUser({ email: 'member2@test.com' });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      await createTestMember({
        organizationId: org.id,
        userId: member1.id,
        role: 'member',
      });

      await createTestMember({
        organizationId: org.id,
        userId: member2.id,
        role: 'member',
      });

      const updateData = {
        role: 'admin',
      };

      // Act
      const response = await request(app)
        .patch(`/api/v1/organizations/${org.id}/members/${member2.id}/role`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send(updateData)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'You do not have permission to perform this action');
    });

    it('should return 403 when ADMIN tries to change owner role', async () => {
      // Arrange
      const { user: owner } = await createAuthenticatedUser({ email: 'owner@test.com' });
      const { accessToken: adminToken, user: admin } = await createAuthenticatedUser({ email: 'admin@test.com' });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      await createTestMember({
        organizationId: org.id,
        userId: admin.id,
        role: 'admin',
      });

      const updateData = {
        role: 'member',
      };

      // Act
      const response = await request(app)
        .patch(`/api/v1/organizations/${org.id}/members/${owner.id}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(updateData)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Only organization owners can modify their own role');
    });

    // ========================================
    // Error Cases
    // ========================================

    it('should return 404 for non-existent member', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      const updateData = {
        role: 'admin',
      };

      const nonExistentUserId = '00000000-0000-0000-0000-000000000000';

      // Act
      const response = await request(app)
        .patch(`/api/v1/organizations/${org.id}/members/${nonExistentUserId}/role`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(404);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Member not found');
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
        role: 'admin',
      };

      // Act
      const response = await request(app)
        .patch(`/api/v1/organizations/${org.id}/members/some-user-id/role`)
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
        role: 'admin',
      };

      // Act
      const response = await request(app)
        .patch(`/api/v1/organizations/${org.id}/members/some-user-id/role`)
        .set('Authorization', 'Bearer invalid-token')
        .send(updateData)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    // ========================================
    // Data Persistence Tests
    // ========================================

    it('should verify role updated in database', async () => {
      // Arrange
      const { accessToken, user: owner } = await createAuthenticatedUser({ email: 'owner@test.com' });
      const { user: targetMember } = await createAuthenticatedUser({ email: 'member@test.com' });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      await createTestMember({
        organizationId: org.id,
        userId: targetMember.id,
        role: 'member',
      });

      const updateData = {
        role: 'admin',
      };

      // Act
      await request(app)
        .patch(`/api/v1/organizations/${org.id}/members/${targetMember.id}/role`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      // Assert - Check database
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: org.id,
          userId: targetMember.id,
        },
      });

      expect(member?.role).toBe('admin');
    });
  });
});
