import { AuthRules } from "../domain/auth-rules";
import { IAuthUserRepository } from "./ports";
import { AppError } from "../../../shared/utils/app-error";
import { ERROR_CODES } from "../../../shared/utils/response-code";

export class VerifyEmailUseCase {
  constructor(private userRepo: IAuthUserRepository) {}

  async execute(token: string): Promise<{ message: string }> {
    const user = await this.userRepo.findByVerificationToken(token);

    if (!user) {
      throw new AppError("Invalid token", 400, ERROR_CODES.AUTH_INVALID_TOKEN);
    }

    if (AuthRules.isTokenExpired(user.verificationTokenExpires)) {
      throw new AppError("Token expired", 400, ERROR_CODES.AUTH_TOKEN_EXPIRED);
    }

    await this.userRepo.update(user.id, {
      isVerified: true,
      verificationToken: null,
      verificationTokenExpires: null,
    });

    return { message: "Email verified successfully" };
  }
}
