import request from 'supertest';
import { Express } from 'express';
import {
  createTestApp,
  resetDatabase,
  createAuthenticatedUser,
} from '../../setup/test-helpers';
import { getPrismaTestClient } from '../../setup/test-db';

describe('Organization Module - Create Organization', () => {
  let app: Express;
  let prisma: ReturnType<typeof getPrismaTestClient>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = getPrismaTestClient();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('POST /api/v1/organizations', () => {
    // ========================================
    // Happy Path Tests
    // ========================================

    it('should create organization with valid name', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const organizationData = {
        name: 'My Test Organization',
      };

      // Act
      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(organizationData)
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('code', 'ORG_CREATED');
      expect(response.body).toHaveProperty('message', 'Organization created successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        name: organizationData.name,
        ownerId: user.id,
      });
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('slug');

      // Verify database
      const dbOrg = await prisma.organization.findUnique({
        where: { id: response.body.data.id },
      });
      expect(dbOrg).toBeTruthy();
      expect(dbOrg?.name).toBe(organizationData.name);
      expect(dbOrg?.ownerId).toBe(user.id);
    });

    it('should create organization with minimum length name (3 chars)', async () => {
      // Arrange
      const { accessToken } = await createAuthenticatedUser();

      const organizationData = {
        name: 'Org', // Exactly 3 characters
      };

      // Act
      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(organizationData)
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('code', 'ORG_CREATED');
      expect(response.body.data.name).toBe(organizationData.name);
    });

    it('should create organization with maximum length name (50 chars)', async () => {
      // Arrange
      const { accessToken } = await createAuthenticatedUser();

      const organizationData = {
        name: 'A'.repeat(50), // Exactly 50 characters
      };

      // Act
      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(organizationData)
        .expect(201);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('code', 'ORG_CREATED');
      expect(response.body.data.name).toBe(organizationData.name);
    });

    // ========================================
    // Validation Tests
    // ========================================

    it('should reject empty name', async () => {
      // Arrange
      const { accessToken } = await createAuthenticatedUser();

      const organizationData = {
        name: '',
      };

      // Act
      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(organizationData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject name too short (< 3 chars)', async () => {
      // Arrange
      const { accessToken } = await createAuthenticatedUser();

      const organizationData = {
        name: 'AB', // 2 characters
      };

      // Act
      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(organizationData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject name too long (> 50 chars)', async () => {
      // Arrange
      const { accessToken } = await createAuthenticatedUser();

      const organizationData = {
        name: 'A'.repeat(51), // 51 characters
      };

      // Act
      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(organizationData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject unknown fields (schema.strict())', async () => {
      // Arrange
      const { accessToken } = await createAuthenticatedUser();

      const organizationData = {
        name: 'Valid Organization',
        unknownField: 'This should fail',
      };

      // Act
      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(organizationData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject missing name field', async () => {
      // Arrange
      const { accessToken } = await createAuthenticatedUser();

      // Act
      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    // ========================================
    // Authentication Tests
    // ========================================

    it('should return 401 without authorization header', async () => {
      // Arrange
      const organizationData = {
        name: 'Test Organization',
      };

      // Act
      const response = await request(app)
        .post('/api/v1/organizations')
        .send(organizationData)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Missing token');
    });

    it('should return 401 with invalid token', async () => {
      // Arrange
      const organizationData = {
        name: 'Test Organization',
      };

      // Act
      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', 'Bearer invalid-token-123')
        .send(organizationData)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    // ========================================
    // Data Persistence Tests
    // ========================================

    it('should verify organization created in database', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const organizationData = {
        name: 'Database Test Org',
      };

      // Act
      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(organizationData)
        .expect(201);

      // Assert
      const dbOrg = await prisma.organization.findUnique({
        where: { id: response.body.data.id },
      });

      expect(dbOrg).toBeTruthy();
      expect(dbOrg?.name).toBe(organizationData.name);
      expect(dbOrg?.ownerId).toBe(user.id);
      expect(dbOrg?.slug).toContain(organizationData.name.toLowerCase().replace(/ /g, '-'));
    });

    it('should verify creator added as OWNER member', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      const organizationData = {
        name: 'Owner Test Org',
      };

      // Act
      const response = await request(app)
        .post('/api/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(organizationData)
        .expect(201);

      // Assert - Check member record
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: response.body.data.id,
          userId: user.id,
        },
      });

      expect(member).toBeTruthy();
      expect(member?.role).toBe('owner');
      expect(member?.status).toBe('active');
    });
  });
});
