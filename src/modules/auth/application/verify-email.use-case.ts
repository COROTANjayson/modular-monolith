/**
 * Application Layer - Verify Email Use Case
 * Orchestrates domain logic and depends only on Domain + Ports
 * NO direct infrastructure imports
 */

import { AuthRules } from "../domain/auth-rules";
import { IUserRepository } from "./ports";

export class VerifyEmailUseCase {
  constructor(private userRepo: IUserRepository) {}

  async execute(token: string): Promise<{ message: string }> {
    const user = await this.userRepo.findByVerificationToken(token);

    if (!user) {
      throw new Error("Invalid token");
    }

    // Check if token expired using domain rules
    if (AuthRules.isTokenExpired(user.verificationTokenExpires)) {
      throw new Error("Token expired");
    }

    // Mark as verified
    await this.userRepo.update(user.id, {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    });

    return { message: "Email verified successfully" };
  }
}
