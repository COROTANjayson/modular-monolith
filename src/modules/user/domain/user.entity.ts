/**
 * Domain Layer - User Entity
 */

export interface User {
  id: string;
  googleId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  age: number | null;
  gender: string | null;
  avatar: string | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  age?: number;
  gender?: string;
  avatar?: string;
}
