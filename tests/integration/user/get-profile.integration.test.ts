import request from 'supertest';
import { Express } from 'express';
import {
  createTestApp,
  resetDatabase,
  createAuthenticatedUser,
} from '../../setup/test-helpers';

describe('User - Get Profile', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('GET /api/v1/users/me', () => {
    it('should return user profile for authenticated user', async () => {
      const { user, accessToken } = await createAuthenticatedUser({
        email: 'profile@example.com',
      });

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject({
        id: user.id,
        email: user.email,
      });

      // Verify sensitive data is not returned
      expect(response.body.data).not.toHaveProperty('password');
      expect(response.body.data).not.toHaveProperty('currentTokenId');
    });

    it('should return 401 without authorization header', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    it('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });
});
