import { Router } from "express";
import { UsersController } from "./user.controller";
import { authMiddleware } from "../../modules/auth";
const router = Router();
const ctrl = new UsersController();

// Protected: get current user
router.get("/me", authMiddleware, ctrl.me.bind(ctrl));

export { router as usersRouter };
