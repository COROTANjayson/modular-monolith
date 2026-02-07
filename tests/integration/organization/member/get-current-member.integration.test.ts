import request from 'supertest';
import { Express } from 'express';
import {
  createTestApp,
  resetDatabase,
  createAuthenticatedUser,
  createTestOrganization,
  createTestMember,
} from '../../../setup/test-helpers';

describe('Organization Member - Get Current Member', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('GET /api/v1/organizations/:id/members/me', () => {
    // ========================================
    // Happy Path Tests
    // ========================================

    it('should return current member info (OWNER)', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      // Act
      const response = await request(app)
        .get(`/api/v1/organizations/${org.id}/members/me`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        userId: user.id,
        organizationId: org.id,
        role: 'owner',
        status: 'active',
      });
    });

    it('should return current member info (ADMIN)', async () => {
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

      // Act
      const response = await request(app)
        .get(`/api/v1/organizations/${org.id}/members/me`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Assert
      expect(response.body.data).toMatchObject({
        userId: admin.id,
        role: 'admin',
      });
    });

    it('should return current member info (MEMBER)', async () => {
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
        .get(`/api/v1/organizations/${org.id}/members/me`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      // Assert
      expect(response.body.data).toMatchObject({
        userId: member.id,
        role: 'member',
      });
    });

    // ========================================
    // Error Cases
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
        .get(`/api/v1/organizations/${org.id}/members/me`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('success', false);
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
        .get(`/api/v1/organizations/${org.id}/members/me`)
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
        .get(`/api/v1/organizations/${org.id}/members/me`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });
  });
});
