import request from 'supertest';
import { Express } from 'express';
import {
  createTestApp,
  resetDatabase,
  createAuthenticatedUser,
  createTestOrganization,
  createTestInvitation,
} from '../../../setup/test-helpers';
import { getPrismaTestClient } from '../../../setup/test-db';

describe('Organization Member - Accept Invitation', () => {
  let app: Express;
  let prisma: ReturnType<typeof getPrismaTestClient>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = getPrismaTestClient();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('POST /api/v1/organizations/invitations/:token/accept', () => {
    // ========================================
    // Happy Path Tests
    // ========================================

    it('should successfully accept valid invitation', async () => {
      // Arrange
      const { user: owner } = await createAuthenticatedUser({ email: 'owner@test.com' });
      const { accessToken: inviteeToken, user: invitee } = await createAuthenticatedUser({ email: 'invitee@test.com' });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      const invitation = await createTestInvitation({
        organizationId: org.id,
        inviterId: owner.id,
        email: invitee.email,
        role: 'member',
      });

      // Act
      const response = await request(app)
        .post(`/api/v1/organizations/invitations/${invitation.token}/accept`)
        .set('Authorization', `Bearer ${inviteeToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);

      // Verify member was created
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: org.id,
          userId: invitee.id,
        },
      });

      expect(member).toBeTruthy();
      expect(member?.role).toBe('member');
      expect(member?.status).toBe('active');
    });

    // ========================================
    // Error Cases
    // ========================================

    it('should return 400 for invalid token', async () => {
      // Arrange
      const { accessToken } = await createAuthenticatedUser();

      // Act
      const response = await request(app)
        .post('/api/v1/organizations/invitations/invalid-token/accept')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      // Note: Validation error occurs before service logic since token is not a valid UUID
    });

    it('should return 400 for expired invitation', async () => {
      // Arrange
      const { user: owner } = await createAuthenticatedUser({ email: 'owner@test.com' });
      const { accessToken: inviteeToken, user: invitee } = await createAuthenticatedUser({ email: 'invitee@test.com' });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      const invitation = await createTestInvitation({
        organizationId: org.id,
        inviterId: owner.id,
        email: invitee.email,
        expiresAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // Expired yesterday
      });

      // Act
      const response = await request(app)
        .post(`/api/v1/organizations/invitations/${invitation.token}/accept`)
        .set('Authorization', `Bearer ${inviteeToken}`)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message', 'Invitation expired');
    });

    it('should return 400 when already accepted', async () => {
      // Arrange
      const { user: owner } = await createAuthenticatedUser({ email: 'owner@test.com' });
      const { accessToken: inviteeToken, user: invitee } = await createAuthenticatedUser({ email: 'invitee@test.com' });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      const invitation = await createTestInvitation({
        organizationId: org.id,
        inviterId: owner.id,
        email: invitee.email,
      });

      // Mark as accepted
      await prisma.organizationInvitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      });

      // Act
      const response = await request(app)
        .post(`/api/v1/organizations/invitations/${invitation.token}/accept`)
        .set('Authorization', `Bearer ${inviteeToken}`)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message', 'Invitation already accepted');
    });

    it('should return 400 when email does not match', async () => {
      // Arrange
      const { user: owner } = await createAuthenticatedUser({ email: 'owner@test.com' });
      const { accessToken: wrongUserToken } = await createAuthenticatedUser({ email: 'wrong@test.com' });

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
        .post(`/api/v1/organizations/invitations/${invitation.token}/accept`)
        .set('Authorization', `Bearer ${wrongUserToken}`)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message', 'This invitation was sent to a different email address');
    });

    it('should return 400 when inviter tries to accept own invitation', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser({ email: 'owner@test.com' });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      const invitation = await createTestInvitation({
        organizationId: org.id,
        inviterId: user.id,
        email: user.email,
      });

      // Act
      const response = await request(app)
        .post(`/api/v1/organizations/invitations/${invitation.token}/accept`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('message', 'You cannot accept an invitation you sent yourself');
    });

    // ========================================
    // Authentication Tests
    // ========================================

    it('should return 401 without authorization header', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/organizations/invitations/some-token/accept')
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Missing token');
    });

    it('should return 401 with invalid token', async () => {
      // Act
      const response = await request(app)
        .post('/api/v1/organizations/invitations/some-token/accept')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    // ========================================
    // Data Persistence Tests
    // ========================================

    it('should verify invitation marked as accepted in database', async () => {
      // Arrange
      const { user: owner } = await createAuthenticatedUser({ email: 'owner@test.com' });
      const { accessToken: inviteeToken, user: invitee } = await createAuthenticatedUser({ email: 'invitee@test.com' });

      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: owner.id,
      });

      const invitation = await createTestInvitation({
        organizationId: org.id,
        inviterId: owner.id,
        email: invitee.email,
      });

      // Act
      await request(app)
        .post(`/api/v1/organizations/invitations/${invitation.token}/accept`)
        .set('Authorization', `Bearer ${inviteeToken}`)
        .expect(200);

      // Assert - Check database
      const updatedInvitation = await prisma.organizationInvitation.findUnique({
        where: { id: invitation.id },
      });

      expect(updatedInvitation?.acceptedAt).toBeTruthy();
    });
  });
});
