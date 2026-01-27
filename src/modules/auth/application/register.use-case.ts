import { AuthRules } from "../domain/auth-rules";
import {
  IAuthUserRepository,
  IPasswordHasher,
  ITokenGenerator,
  IEmailService,
} from "./ports";
import { RegisterInput, RegisterOutput } from "./auth.dto";

export class RegisterUseCase {
  constructor(
    private userRepo: IAuthUserRepository,
    private passwordHasher: IPasswordHasher,
    private tokenGenerator: ITokenGenerator,
    private emailService: IEmailService,
  ) {}

  async execute(input: RegisterInput): Promise<RegisterOutput> {
    // Validate using domain rules
    if (!AuthRules.isValidEmail(input.email)) {
      throw new Error("Invalid email format");
    }

    const passwordCheck = AuthRules.isValidPassword(input.password);
    if (!passwordCheck.valid) {
      throw new Error(passwordCheck.reason || "Invalid password");
    }

    // Check if user exists
    const existing = await this.userRepo.findByEmail(input.email);
    if (existing) {
      throw new Error("Email already registered");
    }

    // Hash password
    const hashedPassword = await this.passwordHasher.hash(input.password);

    // Generate verification token
    const verificationToken = this.tokenGenerator.generateUUID();
    const verificationTokenExpires = AuthRules.getVerificationTokenExpiry();

    // Create user
    const user = await this.userRepo.create({
      email: input.email,
      password: hashedPassword,
      verificationToken,
      verificationTokenExpires,
      isVerified: false,
    });

    // Send verification email
    const verificationLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    await this.emailService.sendVerificationEmail(user.email, verificationLink);

    // Auto-login after registration
    const jti = this.tokenGenerator.generateUUID();
    await this.userRepo.update(user.id, { currentTokenId: jti });

    const accessToken = this.tokenGenerator.generateAccessToken({
      id: user.id,
      email: user.email,
    });
    const refreshToken = this.tokenGenerator.generateRefreshToken({
      id: user.id,
      email: user.email,
      jti,
    });

    return {
      id: user.id,
      email: user.email,
      isVerified: user.isVerified,
      accessToken,
      refreshToken,
    };
  }
}
