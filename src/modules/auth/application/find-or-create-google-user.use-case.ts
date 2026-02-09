import { AuthUser } from "../domain/auth-user.entity";
import { IAuthUserRepository, ITokenGenerator } from "./ports";

export class FindOrCreateGoogleUserUseCase {
  constructor(
    private userRepo: IAuthUserRepository,
    private tokenGenerator: ITokenGenerator
  ) {}

  async execute(profile: {
    googleId: string;
    email: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }): Promise<{ user: AuthUser; accessToken: string; refreshToken: string }> {
    // 1. Check if user exists by googleId
    let user = await this.userRepo.findByEmail(profile.email);

    if (user) {
      // 2. If user exists but no googleId (and we trust the email from Google), link it
      if (!user.googleId) {
        user = await this.userRepo.update(user.id, {
          googleId: profile.googleId,
          avatar: user.avatar || profile.avatar, // Update avatar if missing
          isVerified: true, // Google emails are verified
        });
      }
    } else {
      // 3. Create new user
      const newTokenId = this.tokenGenerator.generateUUID(); // Needed for refresh token rotation

      user = await this.userRepo.create({
        email: profile.email,
        googleId: profile.googleId,
        avatar: profile.avatar,
        isVerified: true,
        password: undefined, // Explicitly undefined as it's optional
        // verificationToken and verificationTokenExpires are required relative to CreateData interface?
        // Let's check CreateData again. 
        // It had verificationToken etc as optional in my update?
        // Yes, "verificationToken?: string;" in step 123.
      });
    }
    
    // 4. Generate Tokens
    // We need to generate a JTI for refresh token
    const jti = this.tokenGenerator.generateUUID();

    // Update user with currentTokenId (for rotation)
    await this.userRepo.update(user.id, { currentTokenId: jti });

    const accessToken = this.tokenGenerator.generateAccessToken({ id: user.id, email: user.email });
    const refreshToken = this.tokenGenerator.generateRefreshToken({ 
      id: user.id, 
      email: user.email,
      jti: jti 
    });

    return { user, accessToken, refreshToken };
  }
}
