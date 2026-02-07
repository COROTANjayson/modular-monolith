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

describe('Organization Member - List Invitations', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('GET /api/v1/organizations/:id/invitations', () => {
    // ========================================
    // Happy Path Tests
    // ========================================

    it('should return all invitations for organization (as OWNER)', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      await createTestInvitation({
        organizationId: org.id,
        inviterId: user.id,
        email: 'invitee1@test.com',
        role: 'member',
      });

      await createTestInvitation({
        organizationId: org.id,
        inviterId: user.id,
        email: 'invitee2@test.com',
        role: 'admin',
      });

      // Act
      const response = await request(app)
        .get(`/api/v1/organizations/${org.id}/invitations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(2);
    });

    it('should return empty array when no invitations exist', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      // Act
      const response = await request(app)
        .get(`/api/v1/organizations/${org.id}/invitations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body.data).toEqual([]);
    });

    it('should allow ADMIN to list invitations', async () => {
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

      await createTestInvitation({
        organizationId: org.id,
        inviterId: owner.id,
        email: 'invitee@test.com',
      });

      // Act
      const response = await request(app)
        .get(`/api/v1/organizations/${org.id}/invitations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should allow MEMBER to list invitations', async () => {
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

      // Act
      const response = await request(app)
        .get(`/api/v1/organizations/${org.id}/invitations`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
    });

    // ========================================
    // Authorization Tests
    // ========================================

    it('should return 403 when user is not a member', async () => {
      // Arrange
      const { user: owner } = await createAuthenticatedUser({ email: 'owner@test.com' });
      const { accessToken: nonMemberToken } = await createAuthenticatedUser({ email: 'nonmember@test.com' });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      // Act
      const response = await request(app)
        .get(`/api/v1/organizations/${org.id}/invitations`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .expect(403);

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
        .get(`/api/v1/organizations/${org.id}/invitations`)
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
        .get(`/api/v1/organizations/${org.id}/invitations`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });
  });
});
