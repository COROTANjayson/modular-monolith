// auth-user.ts
export type AuthUser = {
  id: string
  email: string
  role: 'user' | 'admin'
  isEmailVerified: boolean
}
