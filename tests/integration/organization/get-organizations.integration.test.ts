import request from 'supertest';
import { Express } from 'express';
import {
  createTestApp,
  resetDatabase,
  createAuthenticatedUser,
  createTestOrganization,
} from '../../setup/test-helpers';

describe('Organization Module - Get All Organizations', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('GET /api/v1/organizations', () => {
    // ========================================
    // Happy Path Tests
    // ========================================

    it('should return all organizations user is member of', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      // Create organization (user automatically becomes owner/member)
      const org = await createTestOrganization({
        name: 'Test Organization',
        ownerId: user.id,
      });

      // Act
      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('code', 'SUCCESS_FETCHED');
      expect(response.body).toHaveProperty('message', 'Organizations retrieved successfully');
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0]).toMatchObject({
        id: org.id,
        name: org.name,
        ownerId: user.id,
      });
    });

    it('should return empty array when user has no organizations', async () => {
      // Arrange
      const { accessToken } = await createAuthenticatedUser();

      // Act
      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBe(0);
    });

    it('should return multiple organizations correctly', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser();

      // Create multiple organizations
      const org1 = await createTestOrganization({
        name: 'Organization One',
        ownerId: user.id,
      });

      const org2 = await createTestOrganization({
        name: 'Organization Two',
        ownerId: user.id,
      });

      const org3 = await createTestOrganization({
        name: 'Organization Three',
        ownerId: user.id,
      });

      // Act
      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.length).toBe(3);

      const orgIds = response.body.data.map((org: any) => org.id);
      expect(orgIds).toContain(org1.id);
      expect(orgIds).toContain(org2.id);
      expect(orgIds).toContain(org3.id);
    });

    // ========================================
    // Authentication Tests
    // ========================================

    it('should return 401 without authorization header', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/organizations')
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Missing token');
    });

    it('should return 401 with invalid token', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    // ========================================
    // Data Isolation Tests
    // ========================================

    it('should only return organizations user is member of (not all orgs)', async () => {
      // Arrange
      const { accessToken: token1, user: user1 } = await createAuthenticatedUser({
        email: 'user1@test.com',
      });

      const { user: user2 } = await createAuthenticatedUser({
        email: 'user2@test.com',
      });

      // User1 creates their organization
      const org1 = await createTestOrganization({
        name: 'User1 Organization',
        ownerId: user1.id,
      });

      // User2 creates their organization
      await createTestOrganization({
        name: 'User2 Organization',
        ownerId: user2.id,
      });

      // Act - Get organizations as User1
      const response = await request(app)
        .get('/api/v1/organizations')
        .set('Authorization', `Bearer ${token1}`)
        .expect(200);

      // Assert - Should only see User1's organization
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].id).toBe(org1.id);
      expect(response.body.data[0].name).toBe('User1 Organization');
    });
  });
});
