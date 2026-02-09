/**
 * Auth Module - Public API
 * This is the ONLY file other modules can import from
 * Exports public interfaces and factory functions
 */

import { Router } from "express";

// Infrastructure implementations
import { PrismaAuthUserRepository } from "./infrastructure/prisma-auth-user.repository";
import { BcryptPasswordHasher } from "./infrastructure/bcrypt-password-hasher";
import { JwtTokenGenerator } from "./infrastructure/jwt-token-generator";
import { EmailServiceAdapter } from "./infrastructure/email-service.adapter";

// Use cases
import { RegisterUseCase } from "./application/register.use-case";
import { LoginUseCase } from "./application/login.use-case";
import { RefreshTokenUseCase } from "./application/refresh-token.use-case";
import { LogoutUseCase } from "./application/logout.use-case";
import { VerifyEmailUseCase } from "./application/verify-email.use-case";
import { ResendVerificationUseCase } from "./application/resend-verification.use-case";
import { UpdatePasswordUseCase } from "./application/update-password.use-case";
import { FindOrCreateGoogleUserUseCase } from "./application/find-or-create-google-user.use-case";
import { GoogleStrategyAdapter } from "./infrastructure/google.strategy";

// Interface
import { AuthController } from "./interface/auth.controller";
import { createAuthRouter } from "./interface/auth.routes";

export function createAuthModule(): { router: Router } {
  // Infrastructure (adapters)
  const userRepo = new PrismaAuthUserRepository();
  const passwordHasher = new BcryptPasswordHasher();
  const tokenGenerator = new JwtTokenGenerator();
  const emailService = new EmailServiceAdapter();

  // Use cases (application layer)
  const registerUseCase = new RegisterUseCase(
    userRepo,
    passwordHasher,
    tokenGenerator,
    emailService,
  );
  const loginUseCase = new LoginUseCase(
    userRepo,
    passwordHasher,
    tokenGenerator,
  );
  const refreshTokenUseCase = new RefreshTokenUseCase(userRepo, tokenGenerator);
  const logoutUseCase = new LogoutUseCase(userRepo, tokenGenerator);
  const verifyEmailUseCase = new VerifyEmailUseCase(userRepo);
  const resendVerificationUseCase = new ResendVerificationUseCase(
    userRepo,
    tokenGenerator,
    emailService,
  );
  const updatePasswordUseCase = new UpdatePasswordUseCase(
    userRepo,
    passwordHasher,
  );

  const findOrCreateGoogleUserUseCase = new FindOrCreateGoogleUserUseCase(
    userRepo,
    tokenGenerator
  );
  
  // Initialize Google Strategy (registers itself with Passport)
  new GoogleStrategyAdapter(findOrCreateGoogleUserUseCase);

  // Controller (interface layer)
  const controller = new AuthController(
    registerUseCase,
    loginUseCase,
    refreshTokenUseCase,
    logoutUseCase,
    verifyEmailUseCase,
    resendVerificationUseCase,
    updatePasswordUseCase,
  );

  // Router
  const router = createAuthRouter(controller);

  return { router };
}

// Export middleware for use by other modules
export { authMiddleware } from "./interface/auth.middleware";
