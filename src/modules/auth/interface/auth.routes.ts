/**
 * Interface Layer - Auth Routes
 * HTTP route definitions
 */

import { Router } from "express";
import { AuthController } from "./auth.controller";
import { authMiddleware } from "./auth.middleware";

import passport from "passport";

export function createAuthRouter(controller: AuthController): Router {
  const router = Router();

  router.post("/register", controller.register.bind(controller));
  router.post("/login", controller.login.bind(controller));
  router.post("/refresh", controller.refresh.bind(controller));
  router.post("/verify-email", controller.verifyEmail.bind(controller));
  router.post(
    "/resend-verification",
    controller.resendVerification.bind(controller),
  );
  router.post("/logout", controller.logout.bind(controller));

  // Google Auth Routes
  router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"], session: false })
  );

  router.get(
    "/google/callback",
    passport.authenticate("google", {
      failureRedirect: "/api/auth/login", // Or frontend failure page
      session: false,
    }),
    controller.googleCallback.bind(controller)
  );

  // Protected routes
  router.patch(
    "/password",
    authMiddleware,
    controller.updatePassword.bind(controller),
  );

  return router;
}
