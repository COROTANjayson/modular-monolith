import { Strategy as GoogleStrategy, Profile, VerifyCallback } from "passport-google-oauth20";
import passport from "passport";
import { FindOrCreateGoogleUserUseCase } from "../application/find-or-create-google-user.use-case";

export class GoogleStrategyAdapter {
  constructor(private findOrCreateUseCase: FindOrCreateGoogleUserUseCase) {
    this.init();
  }

  init() {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID || "",
          clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
          callbackURL: process.env.GOOGLE_CALLBACK_URL || "",
        },
        async (
          accessToken: string,
          refreshToken: string,
          profile: Profile,
          done: VerifyCallback
        ) => {
          try {
            const email = profile.emails?.[0]?.value;
            const googleId = profile.id;
            const avatar = profile.photos?.[0]?.value;
            const firstName = profile.name?.givenName;
            const lastName = profile.name?.familyName;

            if (!email) {
              return done(new Error("No email found from Google"), undefined);
            }

            const result = await this.findOrCreateUseCase.execute({
              email,
              googleId,
              avatar,
              firstName,
              lastName,
            });

            return done(null, result);
          } catch (error) {
            return done(error as Error, undefined);
          }
        }
      )
    );
  }
}
