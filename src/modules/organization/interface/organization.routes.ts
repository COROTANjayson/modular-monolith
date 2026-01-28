/**
 * Interface Layer - Organization Routes
 */

import { Router } from "express";
import { OrganizationController } from "./organization.controller";
import { authMiddleware } from "../../auth/interface/auth.middleware";

export function createOrganizationRouter(
  controller: OrganizationController,
): Router {
  const router = Router();

  // All organization routes require authentication
  router.use(authMiddleware);

  router.post("/", (req, res) => controller.create(req, res));
  router.patch("/:id", (req, res) => controller.update(req, res));

  router.post("/:id/invitations", (req, res) => controller.invite(req, res));
  router.post("/invitations/:token/accept", (req, res) =>
    controller.acceptInvitation(req, res),
  );

  router.get("/:id/members", (req, res) => controller.listMembers(req, res));
  router.patch("/:id/members/:userId", (req, res) =>
    controller.updateMemberRole(req, res),
  );
  router.delete("/:id/members/:userId", (req, res) =>
    controller.removeMember(req, res),
  );

  return router;
}
