# Modular Monolith API - Architecture Guide

> **Purpose**: This guide serves as a comprehensive reference for AI-assisted development tools and developers working on this modular monolith API project. It documents the architectural patterns, folder structure, and conventions used throughout the codebase.

---

## Table of Contents
- [Architecture Overview](#architecture-overview)
- [Module Structure](#module-structure)
- [Layer Responsibilities](#layer-responsibilities)
- [Shared Resources](#shared-resources)
- [Testing Strategy](#testing-strategy)
- [Module Integration](#module-integration)
- [Naming Conventions](#naming-conventions)
- [Best Practices](#best-practices)

---

## Architecture Overview

This project follows a **Modular Monolith** architecture pattern, combining the simplicity of a monolithic deployment with the modularity of microservices. Each module is self-contained and follows **Clean Architecture** principles with clear layer separation.

### Core Principles

1. **Dependency Rule**: Dependencies flow inward (Infrastructure → Application → Domain)
2. **Module Independence**: Each module is a vertical slice with its own layers
3. **Explicit Contracts**: Modules expose only what's necessary through their `index.ts`
4. **Testability**: Each layer can be tested independently

### Technology Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Queue**: Redis with BullMQ
- **Email**: MJML templates
- **Testing**: Jest with Supertest

---

## Module Structure

All business logic is organized into self-contained modules under `src/modules/`. Each module follows a consistent 4-layer architecture.

### Standard Module Layout

```
src/modules/[module_name]/
├── application/          # Business logic & use cases
│   ├── [name].dto.ts     # Data Transfer Objects (pure interfaces)
│   ├── [name].use-case.ts # Use cases (only for complex operations)
│   ├── [name].service.ts  # Service classes (for simpler CRUD)
│   └── ports.ts          # Interface contracts (optional)
├── domain/               # Business rules & entities
│   ├── [name].entity.ts  # Domain models & types
│   ├── [name].repository.ts # Repository interfaces
│   └── [name]-rules.ts   # Business validation rules (optional)
├── infrastructure/       # External dependencies
│   ├── prisma-[name].repository.ts # Database implementations
│   ├── [service]-adapter.ts # Third-party service adapters
│   └── [other]-[name].ts # Other infrastructure (email, etc.)
├── interface/            # HTTP layer
│   ├── [name].controller.ts # Request handlers
│   ├── [name].routes.ts  # Route definitions
│   ├── [name].middleware.ts # Module-specific middleware (optional)
│   ├── [name].response-codes.ts # Response code constants
│   └── validation.ts     # Zod schemas for request validation
└── index.ts              # Module public API & dependency wiring
```

---

## Layer Responsibilities

### 1. Application Layer (`application/`)

**Purpose**: Orchestrates business logic and coordinates between domain and infrastructure layers.

#### Files

##### `[name].dto.ts`
- **Purpose**: Define Data Transfer Objects as **pure TypeScript interfaces**
- **Content**: Type definitions for request/response data structures
- **Rules**:
  - No Zod schemas (those go in `validation.ts`)
  - No validation logic
  - Only interface/type definitions

```typescript
// ✅ CORRECT: Pure interfaces
export interface RegisterDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  accessToken: string;
  user: UserDto;
}
```

##### `[name].use-case.ts`
- **Purpose**: Complex business operations with multiple steps
- **When to Use**: Authentication flows, multi-step processes, operations requiring multiple repositories
- **Pattern**: One class per use case, single `execute()` method
- **Example**: `login.use-case.ts`, `register.use-case.ts`, `refresh-token.use-case.ts`

```typescript
export class RegisterUseCase {
  constructor(
    private userRepo: IAuthUserRepository,
    private passwordHasher: IPasswordHasher,
    private tokenGenerator: ITokenGenerator,
    private emailService: IEmailService
  ) {}

  async execute(data: RegisterDto): Promise<AuthUser> {
    // Multi-step business logic
  }
}
```

##### `[name].service.ts`
- **Purpose**: Simpler CRUD operations and straightforward business logic
- **When to Use**: User profiles, organization management, member operations
- **Pattern**: Multiple related methods in one service class
- **Example**: `user.service.ts`, `organization.service.ts`

```typescript
export class UserService {
  constructor(private userRepo: IUserRepository) {}

  async getUserById(id: string) { /* ... */ }
  async updateUser(id: string, data: UpdateUserDto) { /* ... */ }
}
```

##### `ports.ts` (Optional)
- **Purpose**: Define strict contracts between application and infrastructure layers
- **When to Use**: When you need explicit interface definitions for infrastructure implementations
- **Content**: TypeScript interfaces for repositories, external services, and adapters
- **Example**: Auth module uses ports for `IAuthUserRepository`, `IPasswordHasher`, `ITokenGenerator`, `IEmailService`

```typescript
// Defines contracts that infrastructure must implement
export interface IAuthUserRepository {
  create(data: AuthUserCreateData): Promise<AuthUser>;
  findByEmail(email: string): Promise<AuthUser | null>;
}

export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}
```

> **When to skip `ports.ts`**: For simpler modules like User and Organization, you can import repository classes directly if strict contracts aren't necessary.

---

### 2. Domain Layer (`domain/`)

**Purpose**: Core business entities, rules, and repository interfaces. This layer has **NO** external dependencies.

#### Files

##### `[name].entity.ts`
- **Purpose**: Define domain models and their types
- **Content**: TypeScript types/interfaces representing core business entities
- **Rules**: No database mapping, no external dependencies

```typescript
export interface AuthUser {
  id: string;
  email: string;
  password: string;
  isVerified: boolean;
  verificationToken: string | null;
  currentTokenId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export type AuthUserCreateData = Omit<AuthUser, 'id' | 'createdAt' | 'updatedAt'>;
export type AuthUserUpdateData = Partial<AuthUser>;
```

##### `[name].repository.ts` (Optional)
- **Purpose**: Repository interface definitions
- **When to Use**: When you want to define repository contracts in the domain layer
- **Alternative**: Can also be defined in `ports.ts` in the application layer

##### `[name]-rules.ts` (Optional)
- **Purpose**: Business validation rules and domain logic
- **When to Use**: When you have complex validation or business rules
- **Pattern**: Static methods in a class for reusability

```typescript
export class AuthRules {
  static isValidPassword(password: string): { valid: boolean; reason?: string } {
    if (password.length < 6) {
      return { valid: false, reason: "Password must be at least 6 characters" };
    }
    return { valid: true };
  }

  static isTokenExpired(expiresAt: Date | null): boolean {
    if (!expiresAt) return true;
    return expiresAt < new Date();
  }
}
```

---

### 3. Infrastructure Layer (`infrastructure/`)

**Purpose**: Implementations of ports, external service integrations, and framework-specific code.

#### Files

##### `prisma-[name].repository.ts`
- **Purpose**: Database access implementation using Prisma
- **Pattern**: Implements repository interfaces from ports or domain layer
- **Example**: `prisma-auth-user.repository.ts`, `prisma-organization.repository.ts`

```typescript
export class PrismaAuthUserRepository implements IAuthUserRepository {
  async create(data: AuthUserCreateData): Promise<AuthUser> {
    return await prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<AuthUser | null> {
    return await prisma.user.findUnique({ where: { email } });
  }
}
```

##### `[service]-adapter.ts`
- **Purpose**: Adapters for third-party services (email, payment, etc.)
- **Example**: `email-service.adapter.ts`

##### Other Infrastructure Files
- `bcrypt-password-hasher.ts` - Password hashing implementation
- `jwt-token-generator.ts` - JWT token operations
- Any other external service integrations

---

### 4. Interface Layer (`interface/`)

**Purpose**: HTTP/API layer - handles requests, responses, and routing.

#### Files

##### `[name].controller.ts`
- **Purpose**: HTTP request handlers
- **Responsibilities**:
  - Extract data from requests
  - Call use cases/services
  - Format responses using response utilities
  - Handle errors

```typescript
export class AuthController {
  constructor(
    private registerUseCase: RegisterUseCase,
    private loginUseCase: LoginUseCase
  ) {}

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await this.registerUseCase.execute(req.body);
      return success(res, AUTH_RESPONSE_CODES.REGISTER_SUCCESS, { user });
    } catch (error) {
      next(error);
    }
  }
}
```

##### `[name].routes.ts`
- **Purpose**: Define HTTP routes and wire up controllers
- **Pattern**: Export a factory function that creates the router

```typescript
export function createAuthRouter(controller: AuthController): Router {
  const router = Router();
  
  router.post('/register', validateRequest(registerSchema), (req, res, next) =>
    controller.register(req, res, next)
  );
  
  return router;
}
```

##### `validation.ts`
- **Purpose**: Zod schemas for request validation
- **Content**: Input validation schemas only
- **Usage**: Used with `validateRequest()` middleware in routes

```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
  }),
});
```

##### `[name].response-codes.ts`
- **Purpose**: Module-specific response codes for API consistency
- **Pattern**: Const objects with success and error codes

```typescript
import { SUCCESS_CODES, ERROR_CODES } from '@/shared/utils/response-code';

export const AUTH_RESPONSE_CODES = {
  REGISTER_SUCCESS: {
    code: SUCCESS_CODES.CREATED,
    message: 'User registered successfully',
  },
  LOGIN_SUCCESS: {
    code: SUCCESS_CODES.DEFAULT,
    message: 'Login successful',
  },
  EMAIL_ALREADY_EXISTS: {
    code: ERROR_CODES.CONFLICT,
    message: 'Email already exists',
  },
} as const;
```

##### `[name].middleware.ts` (Optional)
- **Purpose**: Module-specific middleware
- **When to Use**: When middleware is specific to this module
- **Example**: `auth.middleware.ts` for authentication checks

---

### 5. Module Entry Point (`index.ts`)

**Purpose**: 
- Wire up all dependencies (Dependency Injection)
- Expose only the public API of the module
- Create routers and export them

**Pattern**:
1. Instantiate infrastructure implementations
2. Instantiate use cases/services with dependencies
3. Instantiate controllers
4. Create and return router
5. Export any middleware needed by other modules

```typescript
/**
 * Auth Module - Public API
 * This is the ONLY file other modules can import from
 */

import { Router } from "express";
import { PrismaAuthUserRepository } from "./infrastructure/prisma-auth-user.repository";
import { BcryptPasswordHasher } from "./infrastructure/bcrypt-password-hasher";
import { RegisterUseCase } from "./application/register.use-case";
import { AuthController } from "./interface/auth.controller";
import { createAuthRouter } from "./interface/auth.routes";

export function createAuthModule(): { router: Router } {
  // Infrastructure (adapters)
  const userRepo = new PrismaAuthUserRepository();
  const passwordHasher = new BcryptPasswordHasher();
  
  // Application (use cases)
  const registerUseCase = new RegisterUseCase(userRepo, passwordHasher);
  
  // Interface (controller)
  const controller = new AuthController(registerUseCase);
  
  // Router
  const router = createAuthRouter(controller);
  
  return { router };
}

// Export middleware for use by other modules
export { authMiddleware } from "./interface/auth.middleware";
```

---

## Shared Resources

### `src/shared/`

#### `infra/` - Shared Infrastructure
- **Purpose**: Infrastructure services used across all modules
- **Files**:
  - `prisma.ts` - Prisma client singleton
  - `redis.ts` - Redis client configuration
  - `logger.ts` - Winston logger setup
  - `supabase.ts` - Supabase client (if used)

#### `utils/` - Shared Utilities
- **Purpose**: Common utilities used across modules
- **Files**:
  - `app-error.ts` - Custom error class for application errors
  - `response-code.ts` - Generic success/error code constants
  - `response.util.ts` - Response formatting utilities (`success()`, `error()`)
  - `config.ts` - Environment configuration
  - `validate.ts` - Validation middleware factory
  - `helpers.ts` - General helper functions
  - `email.service.ts` - Email sending service
  - `email-renderer.ts` - MJML template rendering

---

### `src/templates/`

#### `emails/`
- **Purpose**: Email templates in MJML format
- **Files**: `*.mjml` files for each email type
- **Examples**:
  - `verification-email.mjml`
  - `password-reset.mjml`

---

### `src/queues/`

- **Purpose**: Queue setup and configuration
- **Files**: `[queue-name].queue.ts`
- **Example**: `email.queue.ts` - Email queue setup using BullMQ

---

### `src/workers/`

- **Purpose**: Background job processors
- **Files**: `[worker-name].worker.ts`
- **Example**: `email.worker.ts` - Processes email queue jobs

---

### `src/middlewares/`

- **Purpose**: Global middleware used across all modules
- **Files**:
  - `authMiddleware.ts` - JWT authentication middleware
  - `csrfMiddleware.ts` - CSRF protection middleware

---

## Testing Strategy

This project uses **Integration Testing** to verify that all layers work correctly together. For comprehensive testing documentation, see **[TESTING_GUIDE.md](TESTING_GUIDE.md)**.

### Quick Overview

- **Test Framework**: Jest with Supertest
- **Test Database**: PostgreSQL in Docker (isolated from development)
- **Test Location**: `tests/integration/` organized by module
- **Test Helpers**: Reusable utilities in `tests/setup/test-helpers.ts`

### Essential Commands

```bash
# Start test database
npm run test:db:up

# Run integration tests
npm run test:integration

# Stop test database
npm run test:db:down
```

### Basic Test Pattern

```typescript
import request from 'supertest';
import { createTestApp, resetDatabase, createAuthenticatedUser } from '../setup/test-helpers';

describe('GET /api/v1/users/me', () => {
  let app;

  beforeAll(async () => { app = await createTestApp(); });
  beforeEach(async () => { await resetDatabase(); });

  it('should return user profile when authenticated', async () => {
    const { accessToken, user } = await createAuthenticatedUser();

    const response = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.data.user.email).toBe(user.email);
  });
});
```

**For detailed testing patterns, helper functions, and best practices, see [TESTING_GUIDE.md](TESTING_GUIDE.md).**

---

## Module Integration

### How Modules Work Together

1. **Module Creation**: Each module exports a factory function from `index.ts`
2. **Dependency Wiring**: Dependencies are injected in the factory function
3. **Router Export**: Each module returns its Express router
4. **App Registration**: `app.ts` imports and registers all module routers

### Example: `app.ts`

```typescript
import { createAuthModule } from "./modules/auth";
import { createUserModule } from "./modules/user";
import { createOrganizationModule } from "./modules/organization";

const app = express();

// ... middleware setup ...

// Module registration
const { router: authRouter } = createAuthModule();
app.use("/api/v1/auth", authRouter);

const { router: userRouter } = createUserModule();
app.use("/api/v1/users", userRouter);

const { router: orgRouter } = createOrganizationModule();
app.use("/api/v1/organizations", orgRouter);

export default app;
```

### Inter-Module Communication

- **Preferred**: Import shared utilities from `src/shared/`
- **Allowed**: Import exported middleware from other modules (e.g., `authMiddleware` from auth module)
- **Forbidden**: Direct imports from other module's internal layers

**Example - Correct**:
```typescript
// ✅ CORRECT: Import from module's public API
import { authMiddleware } from "@/modules/auth";

// ✅ CORRECT: Import shared utilities
import { AppError } from "@/shared/utils/app-error";
```

**Example - Incorrect**:
```typescript
// ❌ WRONG: Don't import from internal layers
import { LoginUseCase } from "@/modules/auth/application/login.use-case";
```

---

## Naming Conventions

### Files

| Type | Pattern | Example |
|------|---------|---------|
| DTO | `[name].dto.ts` | `auth.dto.ts`, `user.dto.ts` |
| Use Case | `[action].use-case.ts` | `login.use-case.ts`, `register.use-case.ts` |
| Service | `[name].service.ts` | `user.service.ts`, `organization.service.ts` |
| Entity | `[name].entity.ts` | `auth-user.entity.ts`, `member.entity.ts` |
| Repository | `prisma-[name].repository.ts` | `prisma-user.repository.ts` |
| Controller | `[name].controller.ts` | `auth.controller.ts` |
| Routes | `[name].routes.ts` | `auth.routes.ts` |
| Middleware | `[name].middleware.ts` | `auth.middleware.ts` |
| Validation | `validation.ts` | `validation.ts` (in each module) |
| Response Codes | `[name].response-codes.ts` | `auth.response-codes.ts` |

### Classes

- **Use Cases**: `[Action]UseCase` (e.g., `LoginUseCase`, `RefreshTokenUseCase`)
- **Services**: `[Name]Service` (e.g., `UserService`, `OrganizationService`)
- **Controllers**: `[Name]Controller` (e.g., `AuthController`)
- **Repositories**: `Prisma[Name]Repository` (e.g., `PrismaAuthUserRepository`)
- **Rules**: `[Name]Rules` (e.g., `AuthRules`)

---

## Best Practices

### 1. **Keep DTOs Pure**
- Only TypeScript interfaces/types in `*.dto.ts`
- No Zod schemas (use `validation.ts` instead)
- No validation logic

### 2. **Use Case vs Service**
- **Use Case**: Complex, multi-step operations (auth flows, payment processing)
- **Service**: Simple CRUD and straightforward operations (user profile, organization management)

### 3. **Ports Are Optional**
- Use `ports.ts` when you need strict contracts between layers
- Skip for simpler modules where direct imports suffice

### 4. **Response Consistency**
- Always use `success()` and `error()` utilities from `response.util.ts`
- Define module-specific codes in `[name].response-codes.ts`
- Include `code` and `message` in all responses

### 5. **Error Handling**
- Throw `AppError` for application-level errors
- Use appropriate HTTP status codes
- Include application-specific error codes

### 6. **Module Independence**
- Each module should be self-contained
- Only expose what's necessary through `index.ts`
- Avoid tight coupling between modules

### 7. **Testing**
- Write integration tests for all endpoints
- Use test helpers for common setup
- Reset database between tests for isolation

### 8. **Validation**
- Use Zod schemas in `validation.ts`
- Apply validation at the route level with `validateRequest()`
- Keep business rules separate (in `[name]-rules.ts`)

---

## Response Format Standard

All API responses follow this structure:

### Success Response
```typescript
{
  "code": "SUCCESS_CREATED",
  "message": "User registered successfully",
  "data": {
    "user": { /* ... */ }
  }
}
```

### Error Response
```typescript
{
  "code": "ERROR_CONFLICT",
  "message": "Email already exists",
  "error": "Detailed error information"
}
```

---

## Quick Reference Checklist

When creating a new module, ensure you have:

- [ ] `index.ts` - Module factory function
- [ ] `application/[name].dto.ts` - Pure interfaces
- [ ] `application/[name].service.ts` or `[action].use-case.ts` - Business logic
- [ ] `domain/[name].entity.ts` - Domain models
- [ ] `infrastructure/prisma-[name].repository.ts` - Database access
- [ ] `interface/[name].controller.ts` - Request handlers
- [ ] `interface/[name].routes.ts` - Route definitions
- [ ] `interface/validation.ts` - Zod schemas
- [ ] `interface/[name].response-codes.ts` - Response codes
- [ ] Integration tests in `tests/integration/[module]/`

**Optional based on needs:**
- [ ] `application/ports.ts` - Interface contracts
- [ ] `domain/[name]-rules.ts` - Business rules
- [ ] `interface/[name].middleware.ts` - Module-specific middleware

---

## Additional Resources

- **Prisma Schema**: `prisma/schema.prisma`
- **Docker Setup**: `docker-compose.yml`, `docker-compose.test.yml`
- **Environment Config**: Use `src/shared/utils/config.ts`
- **Logging**: Use `src/shared/infra/logger.ts`

---

**Last Updated**: 2026-02-07  
**Maintainer**: Development Team
