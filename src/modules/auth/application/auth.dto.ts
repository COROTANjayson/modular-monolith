export interface RegisterInput {
  email: string;
  password: string;
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
export interface UpdatePasswordInput {
  userId: string;
  oldPassword?: string; // Optional if we allow admin update, but for self-update it should be required
  newPassword: string;
}
