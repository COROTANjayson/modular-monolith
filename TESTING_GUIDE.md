# Testing Guide - Modular Monolith API

> **Purpose**: Comprehensive testing guidelines for integration tests, test setup, and best practices.

---

## Table of Contents
- [Overview](#overview)
- [Test Structure](#test-structure)
- [Test Commands](#test-commands)
- [Test Database Setup](#test-database-setup)
- [Test Helpers](#test-helpers)
- [Integration Test Patterns](#integration-test-patterns)
- [Writing Tests](#writing-tests)
- [Best Practices](#best-practices)

---

## Overview

This project uses **Integration Testing** as the primary testing strategy. Integration tests verify that all layers (controller → service/use-case → repository → database) work correctly together.

### Testing Stack

- **Test Framework**: Jest
- **HTTP Testing**: Supertest
- **Database**: PostgreSQL (isolated test database via Docker)
- **Test Database Management**: Docker Compose with separate test configuration

---

## Test Structure

```
tests/
├── setup/                      # Test configuration & utilities
│   ├── global-setup.ts        # Runs once before all tests (database setup)
│   ├── global-teardown.ts     # Runs once after all tests (cleanup)
│   ├── test-db.ts             # Test database connection utilities
│   └── test-helpers.ts        # Reusable test helper functions
├── integration/               # Integration tests by module
│   ├── auth/
│   │   ├── login.integration.test.ts
│   │   ├── register.integration.test.ts
│   │   ├── refresh-token.integration.test.ts
│   │   └── verify-email.integration.test.ts
│   ├── user/
│   │   ├── get-profile.integration.test.ts
│   │   └── update-profile.integration.test.ts
│   └── organization/
│       ├── create-organization.integration.test.ts
│       └── member-management.integration.test.ts
├── __mocks__/                 # Mock implementations
│   └── uuid.ts
└── README.md                  # Testing documentation
```

### Directory Structure Guidelines

- **`setup/`**: Global test configuration and reusable utilities
- **`integration/`**: Organize by module name (matches `src/modules/`)
- **`__mocks__`**: Mock implementations for external dependencies
- **Test Files**: Use `.integration.test.ts` suffix for integration tests

---

## Test Commands

### Available Scripts

```json
{
  "test:integration": "jest --config jest.config.js",
  "test:integration:watch": "jest --watch --config jest.config.js",
  "test:db:up": "docker-compose -f docker-compose.test.yml up -d",
  "test:db:down": "docker-compose -f docker-compose.test.yml down",
  "test": "npm run test:integration"
}
```

### Running Tests

```bash
# 1. Start test database
npm run test:db:up

# 2. Run all integration tests
npm run test:integration

# 3. Run tests in watch mode (for development)
npm run test:integration:watch

# 4. Stop test database
npm run test:db:down
```

### Running Specific Tests

```bash
# Run tests for a specific module
npm run test:integration -- auth

# Run a specific test file
npm run test:integration -- login.integration.test.ts

# Run tests matching a pattern
npm run test:integration -- --testNamePattern="should return user profile"
```

---

## Test Database Setup

### Docker Configuration

The test database runs in isolation using `docker-compose.test.yml`:

```yaml
# docker-compose.test.yml
version: '3.8'
services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
      POSTGRES_DB: test_database
    ports:
      - "5433:5432"  # Different port to avoid conflicts
```

### Database Lifecycle

1. **Global Setup** (`global-setup.ts`):
   - Connects to test database
   - Runs Prisma migrations
   - Seeds initial data if needed

2. **Between Tests** (`beforeEach` in test files):
   - Clear all tables using `resetDatabase()` helper
   - Ensures test isolation

3. **Global Teardown** (`global-teardown.ts`):
   - Closes database connections
   - Optional: Drop test database

### Database Reset Strategy

**Option 1: Truncate Tables** (Faster, recommended)
```typescript
// test-db.ts
export async function clearDatabase() {
  const prisma = getPrismaTestClient();
  
  await prisma.$transaction([
    prisma.member.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.user.deleteMany(),
  ]);
}
```

**Option 2: Drop & Recreate** (Slower, more thorough)
```typescript
export async function clearDatabase() {
  await prisma.$executeRawUnsafe('DROP SCHEMA public CASCADE');
  await prisma.$executeRawUnsafe('CREATE SCHEMA public');
  // Re-run migrations
}
```

---

## Test Helpers

### Available Helper Functions

#### `createTestApp()`
Creates an Express app instance for testing without starting the server.

```typescript
const app = await createTestApp();
```

#### `resetDatabase()`
Clears all data from the test database to ensure test isolation.

```typescript
beforeEach(async () => {
  await resetDatabase();
});
```

#### `createTestUser(params?)`
Creates a user in the test database with hashed password.

```typescript
const { user, plainPassword } = await createTestUser({
  email: 'test@example.com',
  password: 'Test123!',
  firstName: 'John',
  lastName: 'Doe',
  isVerified: true
});
```

**Parameters:**
- `email?`: string - Default: auto-generated
- `password?`: string - Default: 'Test123!@#'
- `firstName?`: string - Default: 'Test'
- `lastName?`: string - Default: 'User'
- `isVerified?`: boolean - Default: true

**Returns:**
- `user`: Created user object
- `plainPassword`: Original password (for login tests)

#### `createAuthenticatedUser(params?)`
Creates a user and generates valid access/refresh tokens.

```typescript
const { user, accessToken, refreshToken, cookies } = await createAuthenticatedUser({
  email: 'auth@example.com'
});
```

**Returns:**
- `user`: Created user object
- `accessToken`: Valid JWT access token
- `refreshToken`: Valid JWT refresh token
- `cookies`: Cookie headers array for requests

#### `createTestOrganization(params)`
Creates an organization in the test database.

```typescript
const organization = await createTestOrganization({
  name: 'Test Org',
  slug: 'test-org',
  ownerId: user.id
});
```

**Parameters:**
- `name?`: string - Default: auto-generated
- `slug?`: string - Default: auto-generated
- `ownerId`: string - **Required**

#### `generateTestToken(userId, email)`
Generates a valid JWT access token for testing.

```typescript
const token = generateTestToken(user.id, user.email);
```

---

## Integration Test Patterns

### Basic Integration Test Structure

```typescript
import request from 'supertest';
import { createTestApp, resetDatabase } from '../setup/test-helpers';
import { Express } from 'express';

describe('GET /api/v1/users/me', () => {
  let app: Express;

  // Setup app once for all tests in this describe block
  beforeAll(async () => {
    app = await createTestApp();
  });

  // Reset database before each test for isolation
  beforeEach(async () => {
    await resetDatabase();
  });

  it('should return user profile when authenticated', async () => {
    // Arrange: Create test data
    const { accessToken, user } = await createAuthenticatedUser();

    // Act: Make request
    const response = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Assert: Verify response
    expect(response.body.code).toBe('SUCCESS_FETCHED');
    expect(response.body.data.user.email).toBe(user.email);
    expect(response.body.data.user.id).toBe(user.id);
  });

  it('should return 401 when not authenticated', async () => {
    const response = await request(app)
      .get('/api/v1/users/me')
      .expect(401);

    expect(response.body.code).toBe('ERROR_UNAUTHORIZED');
  });
});
```

### Testing Authentication Required Endpoints

```typescript
describe('Protected Endpoint', () => {
  let app: Express;
  let accessToken: string;
  let user: any;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
    const authData = await createAuthenticatedUser();
    accessToken = authData.accessToken;
    user = authData.user;
  });

  it('should access protected resource with valid token', async () => {
    const response = await request(app)
      .get('/api/v1/protected-resource')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data).toBeDefined();
  });
});
```

### Testing POST Requests with Validation

```typescript
describe('POST /api/v1/auth/register', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it('should register a new user with valid data', async () => {
    const userData = {
      email: 'newuser@example.com',
      password: 'SecurePass123!'
    };

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.code).toBe('SUCCESS_CREATED');
    expect(response.body.data.user.email).toBe(userData.email);
    expect(response.body.data.user.password).toBeUndefined(); // Password should not be returned
  });

  it('should return validation error for invalid email', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'invalid-email',
        password: 'SecurePass123!'
      })
      .expect(400);

    expect(response.body.code).toBe('ERROR_VALIDATION_ERROR');
  });

  it('should return error when email already exists', async () => {
    const { user } = await createTestUser({ email: 'existing@example.com' });

    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: user.email,
        password: 'AnotherPass123!'
      })
      .expect(409);

    expect(response.body.code).toBe('ERROR_CONFLICT');
  });
});
```

### Testing PATCH/PUT Requests

```typescript
describe('PATCH /api/v1/users/me', () => {
  let app: Express;
  let accessToken: string;
  let user: any;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
    const authData = await createAuthenticatedUser();
    accessToken = authData.accessToken;
    user = authData.user;
  });

  it('should update user profile', async () => {
    const updateData = {
      firstName: 'Updated',
      lastName: 'Name'
    };

    const response = await request(app)
      .patch('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(updateData)
      .expect(200);

    expect(response.body.code).toBe('SUCCESS_UPDATED');
    expect(response.body.data.user.firstName).toBe(updateData.firstName);
    expect(response.body.data.user.lastName).toBe(updateData.lastName);
  });
});
```

### Testing With Cookies (Refresh Token)

```typescript
describe('POST /api/v1/auth/refresh-token', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it('should refresh access token with valid refresh token cookie', async () => {
    const { refreshToken } = await createAuthenticatedUser();

    const response = await request(app)
      .post('/api/v1/auth/refresh-token')
      .set('Cookie', [`refreshToken=${refreshToken}`])
      .expect(200);

    expect(response.body.code).toBe('SUCCESS_DEFAULT');
    expect(response.body.data.accessToken).toBeDefined();
  });
});
```

### Testing DELETE Requests

```typescript
describe('DELETE /api/v1/organizations/:id', () => {
  let app: Express;
  let accessToken: string;
  let user: any;
  let organization: any;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
    const authData = await createAuthenticatedUser();
    accessToken = authData.accessToken;
    user = authData.user;
    organization = await createTestOrganization({ ownerId: user.id });
  });

  it('should delete organization when user is owner', async () => {
    const response = await request(app)
      .delete(`/api/v1/organizations/${organization.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.code).toBe('SUCCESS_DELETED');
  });
});
```

---

## Writing Tests

### Test Organization

**Describe Blocks**: Group tests by endpoint or feature
```typescript
describe('POST /api/v1/auth/login', () => {
  // All login-related tests
});
```

**Test Names**: Use clear, descriptive names starting with "should"
```typescript
it('should return 401 when password is incorrect', async () => {
  // Test implementation
});
```

### AAA Pattern (Arrange-Act-Assert)

Always structure tests using the AAA pattern:

```typescript
it('should update user profile successfully', async () => {
  // Arrange: Set up test data
  const { accessToken, user } = await createAuthenticatedUser();
  const updateData = { firstName: 'Updated' };

  // Act: Perform the action
  const response = await request(app)
    .patch('/api/v1/users/me')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(updateData)
    .expect(200);

  // Assert: Verify the results
  expect(response.body.code).toBe('SUCCESS_UPDATED');
  expect(response.body.data.user.firstName).toBe(updateData.firstName);
});
```

### What to Test

**✅ DO Test:**
- Happy path (successful scenarios)
- Error cases (validation errors, unauthorized access)
- Edge cases (empty strings, boundary values)
- Authentication/authorization requirements
- Response structure and status codes
- Data persistence (verify database changes)

**❌ DON'T Test:**
- Implementation details (internal function calls)
- Third-party library behavior
- Database driver functionality

### Assertions Checklist

For each test, verify:
- [ ] HTTP status code
- [ ] Response `code` field (e.g., `SUCCESS_CREATED`)
- [ ] Response `message` field
- [ ] Response `data` structure
- [ ] Sensitive data is not exposed (e.g., passwords)
- [ ] Database state changed correctly (if applicable)

---

## Best Practices

### 1. **Test Isolation**
- Always call `resetDatabase()` in `beforeEach`
- Don't rely on data from previous tests
- Each test should be runnable independently

### 2. **Use Descriptive Test Names**
```typescript
// ✅ GOOD
it('should return 409 when email already exists', async () => {});

// ❌ BAD
it('test registration', async () => {});
```

### 3. **Keep Tests Focused**
- One assertion concept per test
- Don't test multiple unrelated behaviors in one test

```typescript
// ✅ GOOD: Focused on one behavior
it('should return 401 when token is missing', async () => {});
it('should return 401 when token is invalid', async () => {});

// ❌ BAD: Testing multiple scenarios
it('should handle authentication errors', async () => {
  // Tests missing token, invalid token, expired token all in one
});
```

### 4. **Use Test Helpers**
- Leverage `createTestUser()`, `createAuthenticatedUser()` for setup
- Don't duplicate user creation logic across tests

### 5. **Test Error Messages**
```typescript
expect(response.body.message).toBe('Email already exists');
```

### 6. **Clean Up After Tests**
- Database cleanup is handled by `resetDatabase()`
- Close connections in `afterAll()` if needed

### 7. **Mock External Services**
- Mock email services, payment gateways, etc.
- Don't make real API calls in tests

### 8. **Test Response Structure**
- Verify the complete response matches your API contract

```typescript
expect(response.body).toMatchObject({
  code: 'SUCCESS_CREATED',
  message: expect.any(String),
  data: {
    user: {
      id: expect.any(String),
      email: expect.any(String)
    }
  }
});
```

### 9. **Avoid Hardcoded Values**
```typescript
// ✅ GOOD
const { user } = await createTestUser();
expect(response.body.data.user.id).toBe(user.id);

// ❌ BAD
expect(response.body.data.user.id).toBe('123e4567-e89b-12d3-a456-426614174000');
```

### 10. **Test Async Operations Properly**
- Always use `async/await`
- Don't forget to `await` database operations

---

## Common Testing Scenarios

### Testing Role-Based Access Control (RBAC)

```typescript
describe('Organization Member Management', () => {
  it('should allow owner to add members', async () => {
    const { accessToken, user } = await createAuthenticatedUser();
    const org = await createTestOrganization({ ownerId: user.id });

    const response = await request(app)
      .post(`/api/v1/organizations/${org.id}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: 'newmember@example.com', role: 'MEMBER' })
      .expect(201);

    expect(response.body.code).toBe('SUCCESS_CREATED');
  });

  it('should deny non-owner from adding members', async () => {
    const owner = await createTestUser();
    const org = await createTestOrganization({ ownerId: owner.user.id });
    const { accessToken } = await createAuthenticatedUser(); // Different user

    const response = await request(app)
      .post(`/api/v1/organizations/${org.id}/members`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ email: 'newmember@example.com', role: 'MEMBER' })
      .expect(403);

    expect(response.body.code).toBe('ERROR_FORBIDDEN');
  });
});
```

### Testing Pagination

```typescript
it('should return paginated results', async () => {
  // Create multiple test records
  for (let i = 0; i < 15; i++) {
    await createTestUser({ email: `user${i}@example.com` });
  }

  const response = await request(app)
    .get('/api/v1/users?page=1&limit=10')
    .set('Authorization', `Bearer ${accessToken}`)
    .expect(200);

  expect(response.body.data.users).toHaveLength(10);
  expect(response.body.data.pagination).toMatchObject({
    page: 1,
    limit: 10,
    total: 15,
    totalPages: 2
  });
});
```

### Testing Email Verification Flow

```typescript
describe('Email Verification', () => {
  it('should verify email with valid token', async () => {
    const { user } = await createTestUser({ isVerified: false });
    const token = 'verification-token-123';

    // Update user with verification token
    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken: token }
    });

    const response = await request(app)
      .get(`/api/v1/auth/verify-email?token=${token}`)
      .expect(200);

    expect(response.body.code).toBe('SUCCESS_DEFAULT');

    // Verify user is now verified in database
    const updatedUser = await prisma.user.findUnique({ where: { id: user.id } });
    expect(updatedUser?.isVerified).toBe(true);
  });
});
```

---

## Troubleshooting

### Common Issues

**Database Connection Errors**
```bash
# Ensure test database is running
npm run test:db:up

# Check if port 5433 is available
netstat -an | grep 5433
```

**Tests Failing Due to Data Conflicts**
- Ensure `resetDatabase()` is called in `beforeEach`
- Check for unique constraint violations

**Timeout Errors**
```typescript
// Increase Jest timeout for slow tests
jest.setTimeout(10000); // 10 seconds
```

---

## Quick Reference

### Essential Test Structure

```typescript
import request from 'supertest';
import { createTestApp, resetDatabase, createAuthenticatedUser } from '../setup/test-helpers';
import { Express } from 'express';

describe('[HTTP METHOD] /api/v1/[endpoint]', () => {
  let app: Express;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it('should [expected behavior]', async () => {
    // Arrange
    const { accessToken, user } = await createAuthenticatedUser();

    // Act
    const response = await request(app)
      .get('/api/v1/endpoint')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    // Assert
    expect(response.body.code).toBe('SUCCESS_FETCHED');
    expect(response.body.data).toBeDefined();
  });
});
```

---

**Last Updated**: 2026-02-07  
**Maintainer**: Development Team
