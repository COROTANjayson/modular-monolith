# Integration Testing Guide

## Quick Start

### 1. Start the Test Database

```bash
npm run test:db:up
```

This starts a PostgreSQL test database in Docker on port 5433 (to avoid conflicts with your production database).

### 2. Run Tests

```bash
# Run all tests
npm test

# Run only integration tests
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### 3. Stop the Test Database

```bash
npm run test:db:down
```

---

## Test Database Configuration

The test database runs in Docker using `docker-compose.test.yml`:

- **Host**: `localhost:5433`
- **Database**: `modular_monolith_test`
- **Username**: `testuser`
- **Password**: `testpassword`
- **Storage**: tmpfs (in-memory, fast and auto-cleared)

The database configuration is in `.env.test`.

---

## Writing Integration Tests

### Test File Structure

```
tests/
├── setup/
│   ├── global-setup.ts       # Runs migrations before all tests
│   ├── global-teardown.ts    # Closes connections after all tests
│   ├── test-db.ts            # Database utilities
│   └── test-helpers.ts       # Helper functions
│
└── integration/
    ├── auth/
    │   ├── register.integration.test.ts
    │   ├── login.integration.test.ts
    │   └── ...
    │
    ├── user/
    │   └── get-profile.integration.test.ts
    │
    └── organization/
        └── ...
```

### Example Integration Test

```typescript
import request from 'supertest';
import { Express } from 'express';
import { createTestApp, resetDatabase, createAuthenticatedUser } from '../../setup/test-helpers';
import { getPrismaTestClient } from '../../setup/test-db';

describe('User - Get Profile', () => {
  let app: Express;
  let prisma: ReturnType<typeof getPrismaTestClient>;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = getPrismaTestClient();
  });

  beforeEach(async () => {
    await resetDatabase(); // Clear database before each test
  });

  describe('GET /api/v1/users/me', () => {
    it('should return user profile for authenticated user', async () => {
      const { user, accessToken } = await createAuthenticatedUser({
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });

      const response = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data).toMatchObject({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      });
    });
  });
});
```

---

## Helper Functions

### `resetDatabase()`

Clears all tables in the test database. Call this in `beforeEach()` to ensure test isolation:

```typescript
beforeEach(async () => {
  await resetDatabase();
});
```

### `createTestUser(params?)`

Creates a user in the test database:

```typescript
const { user, plainPassword } = await createTestUser({
  email: 'test@example.com',
  password: 'Password123!',
  firstName: 'John',
  lastName: 'Doe',
});
```

### `createAuthenticatedUser(params?)`

Creates a user and returns authentication tokens:

```typescript
const { user, accessToken, refreshToken, cookies } = await createAuthenticatedUser({
  email: 'test@example.com',
});

// Use in requests
const response = await request(app)
  .get('/api/v1/users/me')
  .set('Authorization', `Bearer ${accessToken}`)
  .expect(200);
```

### `createTestOrganization(params)`

Creates an organization:

```typescript
const organization = await createTestOrganization({
  name: 'Test Organization',
  slug: 'test-org',
  ownerId: user.id,
});
```

---

## Best Practices

### 1. Test Isolation

Always reset the database between tests:

```typescript
beforeEach(async () => {
  await resetDatabase();
});
```

### 2. Test Both Success and Error Cases

```typescript
it('should successfully create a user', async () => {
  // Test success case
});

it('should return error when email already exists', async () => {
  // Test error case
});
```

### 3. Verify Database State

Don't just check HTTP responses—verify the database:

```typescript
const response = await request(app)
  .post('/api/v1/auth/register')
  .send(userData)
  .expect(201);

// Verify in database
const dbUser = await prisma.user.findUnique({
  where: { email: userData.email },
});

expect(dbUser).toBeTruthy();
expect(dbUser?.email).toBe(userData.email);
```

### 4. Use Descriptive Test Names

```typescript
describe('POST /api/v1/auth/register', () => {
  it('should successfully register a new user', async () => { ... });
  it('should return error when email already exists', async () => { ... });
  it('should return validation error for invalid email', async () => { ... });
});
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_USER: testuser
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: modular_monolith_test
        ports:
          - 5433:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://testuser:testpassword@localhost:5433/modular_monolith_test
```

---

## Troubleshooting

### "Database connection failed"

Make sure the test database is running:

```bash
npm run test:db:up
```

Verify it's healthy:

```bash
docker ps
```

### "Tests are interfering with each other"

Ensure you're calling `resetDatabase()` in `beforeEach()`:

```typescript
beforeEach(async () => {
  await resetDatabase();
});
```

### "Cannot connect to test database"

Check that port 5433 is not already in use:

```bash
# Windows
netstat -ano | findstr "5433"

# Stop the container and restart
npm run test:db:down
npm run test:db:up
```

---

## What's NOT Mocked

Integration tests run against real infrastructure:

- ✅ **PostgreSQL Database** - Real test database
- ✅ **HTTP Server** - Real Express app (without `listen()`)
- ✅ **Prisma ORM** - Real database queries
- ✅ **Authentication** - Real JWT tokens
- ✅ **Password Hashing** - Real bcrypt

## What IS Disabled/Mocked

- ❌ **Redis** - Disabled (queues run synchronously)
- ❌ **Email Workers** - Disabled
- ❌ **Resend API** - Disabled
- ❌ **External Services** - Not called in tests

---

## Next Steps

1. Add more integration tests for your endpoints
2. Configure CI/CD pipeline
3. Add test coverage thresholds
4. Consider adding E2E tests for critical flows
