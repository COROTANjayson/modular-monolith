/**
 * Interface Layer - Auth Routes
 * HTTP route definitions
 */

import { Router } from "express";
import { AuthController } from "./auth.controller";

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

  return router;
}
