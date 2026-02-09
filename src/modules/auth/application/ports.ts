/**
 * Application Layer - Ports (Interfaces)
 * Defines contracts for infrastructure implementations
 * Domain + Application layers depend on these, Infrastructure implements them
 */

import {
  AuthUser,
  AuthUserCreateData,
  AuthUserUpdateData,
} from "../domain/auth-user.entity";

/**
 * Repository port - defines data access contract
 */
export interface IAuthUserRepository {
  create(data: AuthUserCreateData): Promise<AuthUser>;
  update(id: string, data: AuthUserUpdateData): Promise<AuthUser>;
  findById(id: string): Promise<AuthUser | null>;
  findByEmail(email: string): Promise<AuthUser | null>;
  findByVerificationToken(token: string): Promise<AuthUser | null>;
  findByGoogleId(googleId: string): Promise<AuthUser | null>;
}

/**
 * Password hasher port
 */
export interface IPasswordHasher {
  hash(password: string): Promise<string>;
  compare(password: string, hash: string): Promise<boolean>;
}

/**
 * Token generator port
 */
export interface ITokenGenerator {
  generateAccessToken(payload: { id: string; email: string }): string;
  generateRefreshToken(payload: {
    id: string;
    email: string;
    jti: string;
  }): string;
  verifyRefreshToken(token: string): { id: string; email: string; jti: string };
  generateUUID(): string;
}

/**
 * Email service port
 */
export interface IEmailService {
  sendVerificationEmail(email: string, verificationLink: string): Promise<void>;
}
