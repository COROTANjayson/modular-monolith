/**
 * Domain Layer - Auth User Entity
 * Pure business logic - NO infrastructure dependencies
 */

export interface AuthUser {
  id: string;
  email: string;
  password: string | null; // Made optional
  googleId: string | null; // Added
  avatar: string | null;   // Added
  isVerified: boolean;
  verificationToken: string | null;
  verificationTokenExpires: Date | null;
  currentTokenId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthUserCreateData {
  email: string;
  password?: string; // Made optional
  googleId?: string; // Added
  avatar?: string;   // Added
  verificationToken?: string;
  verificationTokenExpires?: Date;
  isVerified?: boolean;
}

export interface AuthUserUpdateData {
  password?: string;
  googleId?: string; // Added
  avatar?: string;   // Added
  currentTokenId?: string | null;
  isVerified?: boolean;
  verificationToken?: string | null;
  verificationTokenExpires?: Date | null;
}
