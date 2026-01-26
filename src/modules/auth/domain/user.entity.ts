/**
 * Domain Layer - User Entity
 * Pure business logic - NO infrastructure dependencies
 */

export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age?: number | null;
  isVerified: boolean;
  verificationToken: string | null;
  verificationTokenExpires: Date | null;
  currentTokenId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCreateData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age?: number;
  verificationToken: string;
  verificationTokenExpires: Date;
  isVerified: boolean;
}

export interface UserUpdateData {
  currentTokenId?: string | null;
  isVerified?: boolean;
  verificationToken?: string | null;
  verificationTokenExpires?: Date | null;
}
