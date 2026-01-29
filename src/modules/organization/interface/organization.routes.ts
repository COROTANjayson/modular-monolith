/**
 * Interface Layer - Organization Routes
 */

import { Router } from "express";
import { OrganizationController } from "./organization.controller";
import { MemberController } from "./member.controller";
import { authMiddleware } from "../../auth/interface/auth.middleware";

export function createOrganizationRouter(
  orgController: OrganizationController,
  memberController: MemberController,
): Router {
  const router = Router();

  // All organization routes require authentication
  router.use(authMiddleware);

  // --- Organization Management ---
  router.post("/", (req, res) => orgController.create(req, res));
  router.patch("/:id", (req, res) => orgController.update(req, res));

  // --- Member & Invitation Management ---
  router.post("/:id/invitations", (req, res) =>
    memberController.invite(req, res),
  );
  router.post("/invitations/:token/accept", (req, res) =>
    memberController.acceptInvitation(req, res),
  );

  router.get("/:id/members", (req, res) =>
    memberController.listMembers(req, res),
  );
  router.patch("/:id/members/:userId", (req, res) =>
    memberController.updateMemberRole(req, res),
  );
  router.delete("/:id/members/:userId", (req, res) =>
    memberController.removeMember(req, res),
  );

  return router;
}
