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

describe('Organization Member - Remove Member', () => {
  let app: Express;
  let prisma: ReturnType<typeof getPrismaTestClient>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = getPrismaTestClient();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('DELETE /api/v1/organizations/:id/members/:userId', () => {
    // ========================================
    // Happy Path Tests
    // ========================================

    it('should successfully remove member as OWNER', async () => {
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

      // Act
      const response = await request(app)
        .delete(`/api/v1/organizations/${org.id}/members/${targetMember.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);

      // Verify member removed from database
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: org.id,
          userId: targetMember.id,
        },
      });

      expect(member).toBeNull();
    });

    it('should successfully remove member as ADMIN', async () => {
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

      // Act
      const response = await request(app)
        .delete(`/api/v1/organizations/${org.id}/members/${targetMember.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
    });

    // ========================================
    // Authorization Tests
    // ========================================

    it('should return 403 when MEMBER tries to remove another member', async () => {
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

      // Act
      const response = await request(app)
        .delete(`/api/v1/organizations/${org.id}/members/${member2.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'You do not have permission to perform this action');
    });

    it('should return 400 when trying to remove organization owner', async () => {
      // Arrange
      const { accessToken,  user: owner } = await createAuthenticatedUser({ email: 'owner@test.com' });
      const { user: admin } = await createAuthenticatedUser({ email: 'admin@test.com' });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      await createTestMember({
        organizationId: org.id,
        userId: admin.id,
        role: 'admin',
      });

      // Act - Try to remove owner
      const response = await request(app)
        .delete(`/api/v1/organizations/${org.id}/members/${owner.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'The organization owner cannot be removed');
    });

    it('should return 404 for non-existent member', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      const nonExistentUserId = '00000000-0000-0000-0000-000000000000';

      // Act
      const response = await request(app)
        .delete(`/api/v1/organizations/${org.id}/members/${nonExistentUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Member not found');
    });

    it('should return 403 when non-member tries to remove', async () => {
      // Arrange
      const { user: owner } = await createAuthenticatedUser({ email: 'owner@test.com' });
      const { user: targetMember } = await createAuthenticatedUser({ email: 'target@test.com' });
      const { accessToken: nonMemberToken } = await createAuthenticatedUser({ email: 'nonmember@test.com' });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      await createTestMember({
        organizationId: org.id,
        userId: targetMember.id,
        role: 'member',
      });

      // Act
      const response = await request(app)
        .delete(`/api/v1/organizations/${org.id}/members/${targetMember.id}`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('message', 'You are not a member of this organization');
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
        .delete(`/api/v1/organizations/${org.id}/members/some-user-id`)
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
        .delete(`/api/v1/organizations/${org.id}/members/some-user-id`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });
  });
});
