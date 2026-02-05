import request from 'supertest';
import { Express } from 'express';
import { createTestApp, resetDatabase } from '../../setup/test-helpers';
import { getPrismaTestClient } from '../../setup/test-db';

describe('Auth - User Registration', () => {
  let app: Express;
  let prisma: ReturnType<typeof getPrismaTestClient>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = getPrismaTestClient();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should successfully register a new user', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'SecurePass123!'
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(201);

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('code', 'AUTH_REGISTER_SUCCESS');
      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('data');
      
      // Verify data structure
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('email', userData.email);
      expect(response.body.data).toHaveProperty('isVerified', false);
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');

      // Verify tokens are strings
      expect(typeof response.body.data.accessToken).toBe('string');
      expect(typeof response.body.data.refreshToken).toBe('string');

      // Verify password is not returned
      expect(response.body.data).not.toHaveProperty('password');

      // Verify user was created in database
      const dbUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      expect(dbUser).toBeTruthy();
      expect(dbUser?.email).toBe(userData.email);
      expect(dbUser?.password).not.toBe(userData.password); // Should be hashed
    });

    it('should return error when email already exists', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'SecurePass123!',
      };

      // Register first user
      await request(app).post('/api/v1/auth/register').send(userData);

      // Try to register with same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(409); // Conflict

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return validation error for invalid email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'SecurePass123!',
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return validation error for weak password', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123', // Too weak
      };

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should return error when required fields are missing', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'test@example.com',
          // Missing password and other fields
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
    });
  });
});
