/**
 * Interface Layer - Member Routes
 */

import { Router } from "express";
import { MemberController } from "./member.controller";
import { authMiddleware } from "../../auth/interface/auth.middleware";

export function createMemberRouter(memberController: MemberController): Router {
  const router = Router();

  // All member routes require authentication
  router.use(authMiddleware);

  // Invitation Management
  router.post("/:id/invitations", (req, res) =>
    memberController.invite(req, res),
  );
  router.post("/invites/accept", (req, res) =>
    memberController.acceptInvitation(req, res),
  );
  router.get("/invites/:token", (req, res) =>
    memberController.getInvitation(req, res),
  );
  router.delete("/:id/invitations/:invitationId", (req, res) =>
    memberController.revokeInvitation(req, res),
  );

  // Member Management
  router.get("/:id/members", (req, res) =>
    memberController.listMembers(req, res),
  );
  router.get("/:id/members/me", (req, res) =>
    memberController.getMe(req, res),
  );
  router.get("/:id/invitations", (req, res) =>
    memberController.listInvitations(req, res),
  );
  router.patch("/:id/members/:userId/role", (req, res) =>
    memberController.updateMemberRole(req, res),
  );
  router.patch("/:id/members/:userId/status", (req, res) =>
    memberController.updateMemberStatus(req, res),
  );
  router.delete("/:id/members/:userId", (req, res) =>
    memberController.removeMember(req, res),
  );

  return router;
}
