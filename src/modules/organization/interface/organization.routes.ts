/**
 * Interface Layer - Organization Routes
 */

import { Router } from "express";
import { OrganizationController } from "./organization.controller";
import { authMiddleware } from "../../auth/interface/auth.middleware";

export function createOrganizationRouter(
  orgController: OrganizationController,
): Router {
  const router = Router();

  // All organization routes require authentication
  router.use(authMiddleware);

  //  Organization Management
  router.get("/", (req, res) => orgController.getAll(req, res));
  router.post("/", (req, res) => orgController.create(req, res));

  router.get("/:id", (req, res) => orgController.getById(req, res));
  router.patch("/:id", (req, res) => orgController.update(req, res));

  return router;
}
