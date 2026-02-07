import request from 'supertest';
import { Express } from 'express';
import {
  createTestApp,
  resetDatabase,
  createAuthenticatedUser,
} from '../../setup/test-helpers';
import { getPrismaTestClient } from '../../setup/test-db';

describe('User Module - Update Profile', () => {
  let app: Express;
  let prisma: ReturnType<typeof getPrismaTestClient>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = getPrismaTestClient();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  describe('PATCH /api/v1/users/me', () => {
    // ========================================
    // Happy Path Tests
    // ========================================

    it('should update single field (firstName)', async () => {
      // Arrange
      const { user, accessToken } = await createAuthenticatedUser({
        firstName: 'Old',
        lastName: 'Name',
      });

      const updateData = {
        firstName: 'Updated',
      };

      // Act
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('code', 'USER_DATA_UPDATED');
      expect(response.body).toHaveProperty('message', 'User updated successfully');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data.firstName).toBe('Updated');
      expect(response.body.data.lastName).toBe(user.lastName); // Should remain unchanged

      // Verify database was updated
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(dbUser?.firstName).toBe('Updated');
    });

    it('should update multiple fields (firstName and lastName)', async () => {
      // Arrange
      const { user, accessToken } = await createAuthenticatedUser();

      const updateData = {
        firstName: 'Jane',
        lastName: 'Smith',
      };

      // Act
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('code', 'USER_DATA_UPDATED');
      expect(response.body.data.firstName).toBe('Jane');
      expect(response.body.data.lastName).toBe('Smith');

      // Verify database was updated
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(dbUser?.firstName).toBe('Jane');
      expect(dbUser?.lastName).toBe('Smith');
    });

    it('should update all optional fields', async () => {
      // Arrange
      const { user, accessToken } = await createAuthenticatedUser();

      const updateData = {
        firstName: 'Alice',
        lastName: 'Johnson',
        age: 30,
        gender: 'Female',
      };

      // Act
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toMatchObject({
        firstName: 'Alice',
        lastName: 'Johnson',
        age: 30,
        gender: 'Female',
      });

      // Verify database was updated
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(dbUser).toMatchObject({
        firstName: 'Alice',
        lastName: 'Johnson',
        age: 30,
        gender: 'Female',
      });
    });

    it('should update with valid age boundary (age: 0)', async () => {
      // Arrange
      const { user, accessToken } = await createAuthenticatedUser();

      const updateData = {
        age: 0, // Minimum valid age
      };

      // Act
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.age).toBe(0);

      // Verify database was updated
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(dbUser?.age).toBe(0);
    });

    it('should allow empty request body (all fields optional)', async () => {
      // Arrange
      const { user, accessToken } = await createAuthenticatedUser({
        firstName: 'Original',
        lastName: 'Name',
      });

      // Act
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({})
        .expect(200);

      // Assert
      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.firstName).toBe(user.firstName); // Should remain unchanged
      expect(response.body.data.lastName).toBe(user.lastName);
    });

    // ========================================
    // Validation Tests
    // ========================================

    it('should reject empty firstName (min 1 char validation)', async () => {
      // Arrange
      const { accessToken } = await createAuthenticatedUser();

      const updateData = {
        firstName: '', // Empty string violates min(1)
      };

      // Act
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject empty lastName (min 1 char validation)', async () => {
      // Arrange
      const { accessToken } = await createAuthenticatedUser();

      const updateData = {
        lastName: '', // Empty string violates min(1)
      };

      // Act
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject negative age', async () => {
      // Arrange
      const { accessToken } = await createAuthenticatedUser();

      const updateData = {
        age: -5, // Negative age violates min(0)
      };

      // Act
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject non-integer age', async () => {
      // Arrange
      const { accessToken } = await createAuthenticatedUser();

      const updateData = {
        age: 25.5, // Decimal violates int() validation
      };

      // Act
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(400);

      // Assert
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });

    it('should reject unknown fields (schema.strict())', async () => {
      // Arrange
      const { accessToken } = await createAuthenticatedUser();

      const updateData = {
        firstName: 'Valid',
        unknownField: 'This should fail', // Extra field not in schema
      };

      // Act
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
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
      const updateData = {
        firstName: 'NewName',
      };

      // Act
      const response = await request(app)
        .patch('/api/v1/users/me')
        .send(updateData)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Missing token');
    });

    it('should return 401 with invalid token', async () => {
      // Arrange
      const updateData = {
        firstName: 'NewName',
      };

      // Act
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token-123')
        .send(updateData)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Invalid token');
    });

    it('should return 401 with malformed token', async () => {
      // Arrange
      const updateData = {
        firstName: 'NewName',
      };

      // Act
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', 'InvalidFormat token123')
        .send(updateData)
        .expect(401);

      // Assert
      expect(response.body).toHaveProperty('error', 'Missing token');
    });

    // ========================================
    // Data Persistence Tests
    // ========================================

    it('should verify partial updates do not clear other fields', async () => {
      // Arrange
      const { user, accessToken } = await createAuthenticatedUser({
        firstName: 'John',
        lastName: 'Doe',
      });

      // First, set age and gender
      await prisma.user.update({
        where: { id: user.id },
        data: { age: 25, gender: 'Male' },
      });

      const updateData = {
        firstName: 'Jane', // Only updating firstName
      };

      // Act
      const response = await request(app)
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(updateData)
        .expect(200);

      // Assert
      expect(response.body.data.firstName).toBe('Jane');
      expect(response.body.data.lastName).toBe('Doe'); // Should remain unchanged
      expect(response.body.data.age).toBe(25); // Should remain unchanged
      expect(response.body.data.gender).toBe('Male'); // Should remain unchanged

      // Verify database state
      const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
      expect(dbUser).toMatchObject({
        firstName: 'Jane',
        lastName: 'Doe',
        age: 25,
        gender: 'Male',
      });
    });
  });
});
