import request from 'supertest';
import { Express } from 'express';
import {
  createTestApp,
  resetDatabase,
  createAuthenticatedUser,
  createTestOrganization,
  createTestMember
} from '../../setup/test-helpers';
import { getPrismaTestClient } from '../../setup/test-db';

describe('Organization Members Integration', () => {
  let app: Express;
  let prisma: ReturnType<typeof getPrismaTestClient>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = getPrismaTestClient();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('Member Management Flow', () => {
    it('should handle full member lifecycle (Invite -> Accept -> Update -> Remove)', async () => {
      // 1. Setup Owner and Organization
      const { accessToken: ownerToken, user: owner } = await createAuthenticatedUser();
      const org = await createTestOrganization({ name: 'Member Flow Inc', ownerId: owner.id });

      // 2. Invite User
      const inviteEmail = 'new-member@example.com';
      await request(app)
        .post(`/api/v1/organizations/${org.id}/invitations`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ email: inviteEmail, role: 'member' })
        .expect(201);

      // Verify invitation in DB
      const invitation = await prisma.organizationInvitation.findFirst({ where: { email: inviteEmail } });
      expect(invitation).toBeTruthy();

      // 3. Accept Invitation (as new user)
      const { accessToken: memberToken, user: newMember } = await createAuthenticatedUser({ email: inviteEmail });
      
      await request(app)
        .post(`/api/v1/organizations/invitations/${invitation!.token}/accept`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(200);

      // Verify member added
      const member = await prisma.organizationMember.findFirst({
        where: { organizationId: org.id, userId: newMember.id }
      });
      expect(member).toBeTruthy();
      expect(member?.role).toBe('member');
      expect(member?.status).toBe('active');

      // 4. List Members (Owner sees new member)
      const listRes = await request(app)
        .get(`/api/v1/organizations/${org.id}/members`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);
      expect(listRes.body.data).toHaveLength(2); // Owner + New Member

      // 5. Update Member Role (Owner promotes Member to Admin)
      await request(app)
        .patch(`/api/v1/organizations/${org.id}/members/${newMember.id}/role`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ role: 'admin' })
        .expect(200);

      // Verify DB
      const updatedMember = await prisma.organizationMember.findFirst({
        where: { organizationId: org.id, userId: newMember.id }
      });
      expect(updatedMember?.role).toBe('admin');

      // 6. Update Member Status (Owner suspends Member)
      await request(app)
        .patch(`/api/v1/organizations/${org.id}/members/${newMember.id}/status`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'suspended' })
        .expect(200);
        
      const suspendedMember = await prisma.organizationMember.findFirst({
        where: { organizationId: org.id, userId: newMember.id }
      });
      expect(suspendedMember?.status).toBe('suspended');

      // 7. Remove Member (Owner removes Member)
      await request(app)
        .delete(`/api/v1/organizations/${org.id}/members/${newMember.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .expect(200);

      // Verify removed
      const removedMember = await prisma.organizationMember.findFirst({
        where: { organizationId: org.id, userId: newMember.id }
      });
      expect(removedMember).toBeNull();
    });
  });

  describe('RBAC Security Controls', () => {
    it('should prevent Member from removing Admin/Owner', async () => {
      // Arrange
      const { user: owner } = await createAuthenticatedUser();
      const { accessToken: memberToken, user: member } = await createAuthenticatedUser();
      const org = await createTestOrganization({ name: 'Security Corp', ownerId: owner.id });

      // Add regular member
      await createTestMember({ organizationId: org.id, userId: member.id, role: 'member' });

      // Act & Assert - Try to remove owner
      await request(app)
        .delete(`/api/v1/organizations/${org.id}/members/${owner.id}`)
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);
    });

    it('should prevent listing members for non-members', async () => {
       // Arrange
       const { user: owner } = await createAuthenticatedUser();
       const { accessToken: outsiderToken } = await createAuthenticatedUser();
       const org = await createTestOrganization({ name: 'Secret Corp', ownerId: owner.id });
 
       // Act & Assert
       await request(app)
         .get(`/api/v1/organizations/${org.id}/members`)
         .set('Authorization', `Bearer ${outsiderToken}`)
         .expect(403);
    });
  });
});
