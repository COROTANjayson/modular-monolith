import { AuthRules } from "../domain/auth-rules";
import { IAuthUserRepository, IPasswordHasher } from "./ports";
import { UpdatePasswordInput } from "./auth.dto";
import { AppError } from "../../../shared/utils/app-error";
import { ERROR_CODES } from "../../../shared/utils/response-code";
import { AUTH_ERROR_CODES } from "../interface/auth.response-codes";

export class UpdatePasswordUseCase {
  constructor(
    private userRepo: IAuthUserRepository,
    private passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: UpdatePasswordInput): Promise<void> {
    // Find user
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new AppError(
        "User not found",
        404,
        AUTH_ERROR_CODES.AUTH_USER_NOT_FOUND,
      );
    }

    // Check if user has a password (Google-only accounts don't)
    if (!user.password) {
      throw new AppError(
        "This account uses Google Sign-In and does not have a password. Password changes are not available for Google accounts.",
        400,
        AUTH_ERROR_CODES.AUTH_INVALID_CREDENTIALS,
      );
    }

    // Verify old password if provided
    if (input.oldPassword) {
      if (input.oldPassword === input.newPassword) {
        throw new AppError(
          "New password cannot be the same as the old password",
          400,
          ERROR_CODES.BAD_REQUEST,
        );
      }

      const isPasswordValid = await this.passwordHasher.compare(
        input.oldPassword,
        user.password,
      );
      if (!isPasswordValid) {
        throw new AppError(
          "Invalid old password",
          401,
          AUTH_ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        );
      }
    }

    // Validate new password rules
    const passwordValidation = AuthRules.isValidPassword(input.newPassword);
    if (!passwordValidation.valid) {
      throw new AppError(
        passwordValidation.reason || "Invalid new password",
        400,
        AUTH_ERROR_CODES.AUTH_INVALID_PASSWORD,
      );
    }

    // Hash new password
    const hashedPassword = await this.passwordHasher.hash(input.newPassword);

    // Update user
    await this.userRepo.update(user.id, {
      password: hashedPassword,
      currentTokenId: null, // Invalidate current sessions for security
    });
  }
}
