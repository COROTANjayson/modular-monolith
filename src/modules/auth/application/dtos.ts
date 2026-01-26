/**
 * Application Layer - DTOs (Data Transfer Objects)
 * Input/Output contracts for use cases
 */

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  age?: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface RegisterOutput extends AuthTokens {
  id: string;
  email: string;
  isVerified: boolean;
}
