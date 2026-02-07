import request from 'supertest';
import { Express } from 'express';
import {
  createTestApp,
  resetDatabase,
  createAuthenticatedUser,
} from '../../setup/test-helpers';

describe('User Module - Get Profile', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('GET /api/v1/users/me', () => {
    it('should return user profile for authenticated user', async () => {
      // Arrange
      const { user, accessToken } = await createAuthenticatedUser({
        email: 'profile@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      // Act
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('code', 'USER_DATA_FETCHED');
      expect(response.body).toHaveProperty('message', 'User data retrieved successfully');
      expect(response.body).toHaveProperty('data');
      
      // Verify user data structure
      expect(response.body.data).toMatchObject({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      // Verify sensitive data is not returned
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data).not.toHaveProperty('currentTokenId');
      expect(response.body.data).not.toHaveProperty('verificationToken');
    });

    it('should return 401 without authorization header', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/users/me')
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Missing token');
    });

    it('should return 401 with invalid token', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    it('should return 401 with malformed authorization header', async () => {
      // Act
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'InvalidFormat token123')
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Missing token');
    });
  });
});
