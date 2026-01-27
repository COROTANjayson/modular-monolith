import { AuthRules } from "../domain/auth-rules";
import { IAuthUserRepository, IPasswordHasher } from "./ports";
import { UpdatePasswordInput } from "./auth.dto";

export class UpdatePasswordUseCase {
  constructor(
    private userRepo: IAuthUserRepository,
    private passwordHasher: IPasswordHasher,
  ) {}

  async execute(input: UpdatePasswordInput): Promise<void> {
    // Find user
    const user = await this.userRepo.findById(input.userId);
    if (!user) {
      throw new Error("User not found");
    }

    // Verify old password if provided
    if (input.oldPassword) {
      const isPasswordValid = await this.passwordHasher.compare(
        input.oldPassword,
        user.password,
      );
      if (!isPasswordValid) {
        throw new Error("Invalid old password");
      }
    }

    // Validate new password rules
    const passwordValidation = AuthRules.isValidPassword(input.newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.reason || "Invalid new password");
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
