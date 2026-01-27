/**
 * Domain Layer - User Entity
 */

export interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  age: number | null;
  gender: string | null;
}

export interface UserUpdateData {
  firstName?: string;
  lastName?: string;
  age?: number;
  gender?: string;
}
