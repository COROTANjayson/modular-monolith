import { AuthRules } from "../domain/auth-rules";
import { IAuthUserRepository, ITokenGenerator, IEmailService } from "./ports";
import { AppError } from "../../../shared/utils/app-error";

export class ResendVerificationUseCase {
  constructor(
    private userRepo: IAuthUserRepository,
    private tokenGenerator: ITokenGenerator,
    private emailService: IEmailService,
  ) {}

  async execute(email: string): Promise<{ message: string }> {
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (user.isVerified) {
      throw new AppError("Email already verified", 400);
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
