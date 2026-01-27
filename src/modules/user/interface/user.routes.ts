/**
 * Interface Layer - User Routes
 */

import { Router } from "express";
import { UserController } from "./user.controller";
import { authMiddleware } from "../../auth/interface/auth.middleware";

export function createUserRouter(userController: UserController): Router {
  const router = Router();

  router.get("/me", authMiddleware, (req, res) =>
    userController.getMe(req, res),
  );
  router.patch("/me", authMiddleware, (req, res) =>
    userController.updateMe(req, res),
  );

  return router;
}
