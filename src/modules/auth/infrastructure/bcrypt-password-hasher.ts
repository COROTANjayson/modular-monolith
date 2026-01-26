/**
 * Infrastructure Layer - Bcrypt Password Hasher Implementation
 * Implements IPasswordHasher port from Application layer
 */

import bcrypt from "bcrypt";
import { IPasswordHasher } from "../application/ports";

export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
