import request from 'supertest';
import { Express } from 'express';
import {
  createTestApp,
  resetDatabase,
  createAuthenticatedUser,
} from '../../setup/test-helpers';
import { getPrismaTestClient } from '../../setup/test-db';

describe('User Module Integration', () => {
  let app: Express;
  let prisma: ReturnType<typeof getPrismaTestClient>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = getPrismaTestClient();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('GET /api/v1/users/me', () => {
    it('should successfully retrieve own profile', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser({
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
      expect(response.body.data).toMatchObject({
        id: user.id,
        email: user.email,
        firstName: 'John',
        lastName: 'Doe',
      });
      expect(response.body.data).not.toHaveProperty('password');
    });

    it('should return 401 without token', async () => {
      await request(app).get('/api/v1/users/me').expect(401);
    });
  });

  describe('PATCH /api/v1/users/me', () => {
    it('should successfully update profile', async () => {
      // Arrange
      const { accessToken, user } = await createAuthenticatedUser({
        firstName: 'Old',
        lastName: 'Name',
      });

      const updateData = {
        firstName: 'New',
        lastName: 'Updated',
      };

      // Act
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      // Assert - Response
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject({
        firstName: 'New',
        lastName: 'Updated',
      });

      // Assert - Database
      const updatedUser = await prisma.user.findUnique({
        where: { id: user.id },
      });
      expect(updatedUser?.firstName).toBe('New');
      expect(updatedUser?.lastName).toBe('Updated');
    });
  });
});
