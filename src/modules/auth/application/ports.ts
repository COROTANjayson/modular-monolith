/**
 * Application Layer - Ports (Interfaces)
 * Defines contracts for infrastructure implementations
 * Domain + Application layers depend on these, Infrastructure implements them
 */

import { User, UserCreateData, UserUpdateData } from "../domain/user.entity";

/**
 * Repository port - defines data access contract
 */
export interface IUserRepository {
  create(data: UserCreateData): Promise<User>;
  update(id: string, data: UserUpdateData): Promise<User>;
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByVerificationToken(token: string): Promise<User | null>;
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
