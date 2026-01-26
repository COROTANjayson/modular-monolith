/**
 * Application Layer - Resend Verification Use Case
 * Orchestrates domain logic and depends only on Domain + Ports
 * NO direct infrastructure imports
 */

import { AuthRules } from "../domain/auth-rules";
import { IUserRepository, ITokenGenerator, IEmailService } from "./ports";

export class ResendVerificationUseCase {
  constructor(
    private userRepo: IUserRepository,
    private tokenGenerator: ITokenGenerator,
    private emailService: IEmailService,
  ) {}

  async execute(email: string): Promise<{ message: string }> {
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      throw new Error("User not found");
    }

    if (user.isVerified) {
      throw new Error("Email already verified");
    }

    // Generate new verification token
    const verificationToken = this.tokenGenerator.generateUUID();
    const verificationTokenExpires = AuthRules.getVerificationTokenExpiry();

    await this.userRepo.update(user.id, {
      verificationToken,
      verificationTokenExpires,
    });

    // Send verification email
    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    await this.emailService.sendVerificationEmail(user.email, verificationLink);

    return { message: "Verification email sent" };
  }
}
