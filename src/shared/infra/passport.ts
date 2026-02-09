import passport from "passport";
import { Express } from "express";

export const configurePassport = (app: Express) => {
  app.use(passport.initialize());
  // We don't need passport.session() if we are using JWTs and not sessions
};
