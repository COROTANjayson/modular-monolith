import request from 'supertest';
import { Express } from 'express';
import {
  createTestApp,
  resetDatabase,
  createAuthenticatedUser,
  createTestOrganization,
  createTestMember,
  createTestInvitation,
} from '../../../setup/test-helpers';
import { getPrismaTestClient } from '../../../setup/test-db';

describe('Organization Member - Revoke Invitation', () => {
  let app: Express;
  let prisma: ReturnType<typeof getPrismaTestClient>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = getPrismaTestClient();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('DELETE /api/v1/organizations/:id/invitations/:invitationId', () => {
    // ========================================
    // Happy Path Tests
    // ========================================

    it('should successfully revoke invitation as OWNER', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      const invitation = await createTestInvitation({
        organizationId: org.id,
        inviterId: user.id,
        email: 'invitee@test.com',
      });

      // Act
      const response = await request(app)
        .delete(`/api/v1/organizations/${org.id}/invitations/${invitation.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);

      // Verify invitation deleted from database
      const dbInvitation = await prisma.organizationInvitation.findUnique({
        where: { id: invitation.id },
      });

      expect(dbInvitation).toBeNull();
    });

    it('should successfully revoke invitation as ADMIN', async () => {
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

      const invitation = await createTestInvitation({
        organizationId: org.id,
        inviterId: owner.id,
        email: 'invitee@test.com',
      });

      // Act
      const response = await request(app)
        .delete(`/api/v1/organizations/${org.id}/invitations/${invitation.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
    });

    // ========================================
    // Authorization Tests
    // ========================================

    it('should return 403 when MEMBER tries to revoke', async () => {
      // Arrange
      const { user: owner } = await createAuthenticatedUser({ email: 'owner@test.com' });
      const { accessToken: memberToken, user: member } = await createAuthenticatedUser({ email: 'member@test.com' });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      await createTestMember({
        organizationId: org.id,
        userId: member.id,
        role: 'member',
      });

      const invitation = await createTestInvitation({
        organizationId: org.id,
        inviterId: owner.id,
        email: 'invitee@test.com',
      });

      // Act
      const response = await request(app)
        .delete(`/api/v1/organizations/${org.id}/invitations/${invitation.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'You do not have permission to perform this action');
    });

    it('should return 404 for non-existent invitation', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      const nonExistentId = 'non-existent-id';

      // Act
      const response = await request(app)
        .delete(`/api/v1/organizations/${org.id}/invitations/${nonExistentId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invitation not found');
    });

    it('should return 403 when non-member tries to revoke', async () => {
      // Arrange
      const { user: owner } = await createAuthenticatedUser({ email: 'owner@test.com' });
      const { accessToken: nonMemberToken } = await createAuthenticatedUser({ email: 'nonmember@test.com' });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      const invitation = await createTestInvitation({
        organizationId: org.id,
        inviterId: owner.id,
        email: 'invitee@test.com',
      });

      // Act
      const response = await request(app)
        .delete(`/api/v1/organizations/${org.id}/invitations/${invitation.id}`)
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
        .delete(`/api/v1/organizations/${org.id}/invitations/some-id`)
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
        .delete(`/api/v1/organizations/${org.id}/invitations/some-id`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });
  });
});
