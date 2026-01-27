/**
 * Domain Layer - Auth User Entity
 * Pure business logic - NO infrastructure dependencies
 */

export interface AuthUser {
  id: string;
  email: string;
  password: string;
  isVerified: boolean;
  verificationToken: string | null;
  verificationTokenExpires: Date | null;
  currentTokenId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUserCreateData {
  email: string;
  password: string;
  verificationToken: string;
  verificationTokenExpires: Date;
  isVerified: boolean;
}

export interface AuthUserUpdateData {
  password?: string;
  currentTokenId?: string | null;
  isVerified?: boolean;
  verificationToken?: string | null;
  verificationTokenExpires?: Date | null;
}
