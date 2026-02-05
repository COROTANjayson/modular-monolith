import request from 'supertest';
import { Express } from 'express';
import {
  createTestApp,
  resetDatabase,
  createTestUser,
} from '../../setup/test-helpers';
import { getPrismaTestClient } from '../../setup/test-db';

describe('Auth - User Login', () => {
  let app: Express;
  let prisma: ReturnType<typeof getPrismaTestClient>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = getPrismaTestClient();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('POST /api/v1/auth/login', () => {
    it('should successfully login with valid credentials', async () => {
      // Create a test user
      const { user, plainPassword } = await createTestUser({
        email: 'login@example.com',
        password: 'ValidPass123!',
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: plainPassword,
        })
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
      expect(response.body.data).toHaveProperty('csrfToken');

      // Verify tokens are strings
      expect(typeof response.body.data.accessToken).toBe('string');
      expect(typeof response.body.data.refreshToken).toBe('string');
      expect(typeof response.body.data.csrfToken).toBe('string');

      // Verify refresh token cookie is set
      const cookies = response.headers['set-cookie'];
      expect(cookies).toBeDefined();
      expect(Array.isArray(cookies)).toBe(true);
      
      const cookieArray = cookies as unknown as string[];
      const refreshTokenCookie = cookieArray.find((cookie: string) =>
        cookie.startsWith('refreshToken=')
      );
      expect(refreshTokenCookie).toBeDefined();
      expect(refreshTokenCookie).toContain('HttpOnly');
    });

    it('should return error for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SomePassword123!',
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return error for invalid password', async () => {
      const { user } = await createTestUser({
        email: 'user@example.com',
        password: 'CorrectPass123!',
      });

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: 'WrongPassword123!',
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
    });

    it('should update currentTokenId on successful login', async () => {
      const { user, plainPassword } = await createTestUser({
        email: 'tokentest@example.com',
        password: 'ValidPass123!',
      });

      // Login
      await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: user.email,
          password: plainPassword,
        })
        .expect(200);

      // Verify currentTokenId was updated
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });

      expect(updatedUser?.currentTokenId).toBeTruthy();
      expect(updatedUser?.currentTokenId).not.toBe(user.currentTokenId);
    });
  });
});
