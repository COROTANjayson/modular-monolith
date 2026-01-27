/**
 * User Module - Public API
 */

import { Router } from "express";
import { PrismaUserRepository } from "./infrastructure/prisma-user.repository";
import { UserService } from "./application/user.service";
import { UserController } from "./interface/user.controller";
import { createUserRouter } from "./interface/user.routes";

export function createUserModule(): { router: Router } {
  // Infrastructure
  const userRepo = new PrismaUserRepository();

  // Application
  const userService = new UserService(userRepo);

  // Interface
  const userController = new UserController(userService);

  // Router
  const router = createUserRouter(userController);

  return { router };
}
