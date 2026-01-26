/**
 * Domain Layer - Authorization Rules
 * Pure business logic for authentication and authorization
 * NO infrastructure dependencies
 */

export class AuthRules {
  /**
   * Check if password meets requirements
   */
  static isValidPassword(password: string): {
    valid: boolean;
    reason?: string;
  } {
    if (password.length < 6) {
      return { valid: false, reason: "Password must be at least 6 characters" };
    }
    return { valid: true };
  }

  /**
   * Check if email is valid format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check if verification token is expired
   */
  static isTokenExpired(expiresAt: Date | null): boolean {
    if (!expiresAt) return true;
    return expiresAt < new Date();
  }

  /**
   * Check if user can login
   */
  static canLogin(user: { password: string }): {
    allowed: boolean;
    reason?: string;
  } {
    if (!user.password) {
      return { allowed: false, reason: "Invalid user state" };
    }
    return { allowed: true };
  }

  /**
   * Check if refresh token is still valid for user
   */
  static isRefreshTokenValid(
    tokenJti: string,
    currentTokenId: string | null,
  ): boolean {
    return currentTokenId !== null && tokenJti === currentTokenId;
  }

  /**
   * Generate verification token expiry (30 minutes from now)
   */
  static getVerificationTokenExpiry(): Date {
    return new Date(Date.now() + 30 * 60 * 1000);
  }
}
