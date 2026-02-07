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

describe('Organization Member - Invite Member', () => {
  let app: Express;
  let prisma: ReturnType<typeof getPrismaTestClient>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = getPrismaTestClient();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('POST /api/v1/organizations/:id/invitations', () => {
    // ========================================
    // Happy Path Tests
    // ========================================

    it('should successfully invite user as OWNER', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      const inviteData = {
        email: 'newuser@test.com',
        role: 'member',
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/organizations/${org.id}/invitations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(inviteData)
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        email: inviteData.email,
        role: inviteData.role,
        organizationId: org.id,
      });
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data).toHaveProperty('expiresAt');
    });

    it('should successfully invite user as ADMIN', async () => {
      //Arrange
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

      const inviteData = {
        email: 'new@test.com',
        role: 'member',
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/organizations/${org.id}/invitations`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(inviteData)
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('success', true);
    });

    it('should invite with admin role', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      const inviteData = {
        email: 'admin@test.com',
        role: 'admin',
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/organizations/${org.id}/invitations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(inviteData)
        .expect(201);

      // Assert
      expect(response.body.data.role).toBe('admin');
    });

    // ========================================
    // Validation Tests
    // ========================================

    it('should reject invalid email', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      const inviteData = {
        email: 'invalid-email',
        role: 'member',
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/organizations/${org.id}/invitations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(inviteData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
    });

    it('should reject owner role in invitation', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      const inviteData = {
        email: 'test@test.com',
        role: 'owner',
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/organizations/${org.id}/invitations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(inviteData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'An organization can only have one owner');
    });

    it('should reject inviting existing member', async () => {
      // Arrange
      const { accessToken, user: owner } = await createAuthenticatedUser({ email: 'owner@test.com' });
      const { user: existingMember } = await createAuthenticatedUser({ email: 'existing@test.com' });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      await createTestMember({
        organizationId: org.id,
        userId: existingMember.id,
        role: 'member',
      });

      const inviteData = {
        email: 'existing@test.com',
        role: 'admin',
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/organizations/${org.id}/invitations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(inviteData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message', 'User is already a member of this organization');
    });

    // ========================================
    // Authorization Tests
    // ========================================

    it('should return 403 when MEMBER tries to invite', async () => {
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

      const inviteData = {
        email: 'new@test.com',
        role: 'member',
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/organizations/${org.id}/invitations`)
        .set('Authorization', `Bearer ${memberToken}`)
        .send(inviteData)
        .expect(403);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'You do not have permission to perform this action');
    });

    it('should return 403 when non-member tries to invite', async () => {
      // Arrange
      const { user: owner } = await createAuthenticatedUser({ email: 'owner@test.com' });
      const { accessToken: nonMemberToken } = await createAuthenticatedUser({ email: 'nonmember@test.com' });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      const inviteData = {
        email: 'new@test.com',
        role: 'member',
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/organizations/${org.id}/invitations`)
        .set('Authorization', `Bearer ${nonMemberToken}`)
        .send(inviteData)
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

      const inviteData = {
        email: 'new@test.com',
        role: 'member',
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/organizations/${org.id}/invitations`)
        .send(inviteData)
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

      const inviteData = {
        email: 'new@test.com',
        role: 'member',
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/organizations/${org.id}/invitations`)
        .set('Authorization', 'Bearer invalid-token')
        .send(inviteData)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    // ========================================
    // Data Persistence Tests
    // ========================================

    it('should verify invitation created in database', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      const inviteData = {
        email: 'verify@test.com',
        role: 'member',
      };

      // Act
      const response = await request(app)
        .post(`/api/v1/organizations/${org.id}/invitations`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send(inviteData)
        .expect(201);

      // Assert - Check database
      const dbInvitation = await prisma.organizationInvitation.findUnique({
        where: { token: response.body.data.token },
      });

      expect(dbInvitation).toBeTruthy();
      expect(dbInvitation?.email).toBe(inviteData.email);
      expect(dbInvitation?.role).toBe(inviteData.role);
      expect(dbInvitation?.organizationId).toBe(org.id);
    });
  });
});
