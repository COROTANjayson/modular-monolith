import { AuthRules } from "../domain/auth-rules";
import { IAuthUserRepository } from "./ports";
import { AppError } from "../../../shared/utils/app-error";

export class VerifyEmailUseCase {
  constructor(private userRepo: IAuthUserRepository) {}

  async execute(token: string): Promise<{ message: string }> {
    const user = await this.userRepo.findByVerificationToken(token);

    if (!user) {
      throw new AppError("Invalid token", 400);
    }

    if (AuthRules.isTokenExpired(user.verificationTokenExpires)) {
      throw new AppError("Token expired", 400);
    }

    await this.userRepo.update(user.id, {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    });

    return { message: "Email verified successfully" };
  }
}
