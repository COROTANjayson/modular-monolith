export class AuthRules {
  static isValidPassword(password: string): {
    valid: boolean;
    reason?: string;
  } {
    if (password.length < 6) {
      return { valid: false, reason: "Password must be at least 6 characters" };
    }
    return { valid: true };
  }
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  static isTokenExpired(expiresAt: Date | null): boolean {
    if (!expiresAt) return true;
    return expiresAt < new Date();
  }
  static canLogin(user: { password: string }): {
    allowed: boolean;
    reason?: string;
  } {
    if (!user.password) {
      return { allowed: false, reason: "Invalid user state" };
    }
    return { allowed: true };
  }
  static isRefreshTokenValid(
    tokenJti: string,
    currentTokenId: string | null,
  ): boolean {
    return currentTokenId !== null && tokenJti === currentTokenId;
  }
  static getVerificationTokenExpiry(): Date {
    return new Date(Date.now() + 30 * 60 * 1000);
  }
}
