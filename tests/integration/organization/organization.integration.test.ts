import request from 'supertest';
import { Express } from 'express';
import {
  createTestApp,
  resetDatabase,
  createAuthenticatedUser,
} from '../../setup/test-helpers';
import { getPrismaTestClient } from '../../setup/test-db';

describe('Organization Module Integration', () => {
  let app: Express;
  let prisma: ReturnType<typeof getPrismaTestClient>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = getPrismaTestClient();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('CRUD Operations', () => {
    it('should create organization and set owner correctly', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();
      const orgData = { name: 'New Tech Corp' };

      // Act
      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(orgData)
        .expect(201);

      // Assert - Response
      const orgId = response.body.data.id;
      expect(response.body.data).toMatchObject({
        name: orgData.name,
        ownerId: user.id,
      });

      // Assert - Database (Org)
      const dbOrg = await prisma.organization.findUnique({
        where: { id: orgId },
      });
      expect(dbOrg).toBeTruthy();
      expect(dbOrg?.ownerId).toBe(user.id);

      // Assert - Database (Member)
      const ownerMember = await prisma.organizationMember.findFirst({
        where: { organizationId: orgId, userId: user.id },
      });
      expect(ownerMember?.role).toBe('owner');
      expect(ownerMember?.status).toBe('active');
    });

    it('should get organization details by ID', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();
      
      // Create via DB to set up state
      const org = await prisma.organization.create({
        data: {
          name: 'Fetch Me Inc',
          slug: 'fetch-me-inc',
          ownerId: user.id,
          members: {
            create: { userId: user.id, role: 'owner', status: 'active' }
          }
        }
      });

      // Act
      const response = await request(app)
        .get(`/api/v1/organizations/${org.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body.data.id).toBe(org.id);
      expect(response.body.data.name).toBe('Fetch Me Inc');
    });

    it('should list organizations user is a member of', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();
      
      // Create 2 orgs
      await prisma.organization.create({
        data: {
          name: 'Org 1', slug: 'org-1', ownerId: user.id,
          members: { create: { userId: user.id, role: 'owner', status: 'active' } }
        }
      });
      await prisma.organization.create({
        data: {
          name: 'Org 2', slug: 'org-2', ownerId: user.id,
          members: { create: { userId: user.id, role: 'owner', status: 'active' } }
        }
      });

      // Act
      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('name', 'Org 1');
    });

    it('should update organization details', async () => {
        // Arrange
        const { accessToken, user } = await createAuthenticatedUser();
        
        const org = await prisma.organization.create({
          data: {
            name: 'Old Name', slug: 'old-name', ownerId: user.id,
            members: { create: { userId: user.id, role: 'owner', status: 'active' } }
          }
        });
  
        // Act
        const response = await request(app)
          .patch(`/api/v1/organizations/${org.id}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({ name: 'New Name' })
          .expect(200);
  
        // Assert
        expect(response.body.data.name).toBe('New Name');
        
        const dbOrg = await prisma.organization.findUnique({ where: { id: org.id }});
        expect(dbOrg?.name).toBe('New Name');
    });
  });

  describe('Validation & Auth', () => {
    it('should fail with 401 if not authenticated', async () => {
      await request(app).post('/api/v1/organizations').send({ name: 'Hack It' }).expect(401);
    });

    it('should fail with 400 if name is empty', async () => {
        const { accessToken } = await createAuthenticatedUser();
        await request(app)
            .post('/api/v1/organizations')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({ name: '' })
            .expect(400);
    });
  });
});
