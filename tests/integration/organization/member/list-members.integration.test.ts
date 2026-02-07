import request from 'supertest';
import { Express } from 'express';
import {
  createTestApp,
  resetDatabase,
  createAuthenticatedUser,
  createTestOrganization,
  createTestMember,
} from '../../../setup/test-helpers';

describe('Organization Member - List Members', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('GET /api/v1/organizations/:id/members', () => {
    // ========================================
    // Happy Path Tests
    // ========================================

    it('should return all members for organization (as OWNER)', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      // Act
      const response = await request(app)
        .get(`/api/v1/organizations/${org.id}/members`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1); // Owner only
      expect(response.body.data[0]).toMatchObject({
        userId: user.id,
        role: 'owner',
        status: 'active',
      });
    });

    it('should return all members including multiple members', async () => {
      // Arrange
      const { accessToken, user: owner } = await createAuthenticatedUser({ email: 'owner@test.com' });
      const { user: admin } = await createAuthenticatedUser({ email: 'admin@test.com' });
      const { user: member } = await createAuthenticatedUser({ email: 'member@test.com' });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      // Add other members
      await createTestMember({
        organizationId: org.id,
        userId: admin.id,
        role: 'admin',
      });

      await createTestMember({
        organizationId: org.id,
        userId: member.id,
        role: 'member',
      });

      // Act
      const response = await request(app)
        .get(`/api/v1/organizations/${org.id}/members`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body.data.length).toBe(3);
      const roles = response.body.data.map((m: any) => m.role);
      expect(roles).toContain('owner');
      expect(roles).toContain('admin');
      expect(roles).toContain('member');
    });

    it('should allow ADMIN to list members', async () => {
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
        .get(`/api/v1/organizations/${org.id}/members`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should allow MEMBER to list members', async () => {
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
        .get(`/api/v1/organizations/${org.id}/members`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.length).toBeGreaterThan(0);
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
        .get(`/api/v1/organizations/${org.id}/members`)
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
        .get(`/api/v1/organizations/${org.id}/members`)
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
        .get(`/api/v1/organizations/${org.id}/members`)
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });
  });
});
