/**
 * Interface Layer - Member Routes
 */

import { Router } from "express";
import { MemberController } from "./member.controller";
import { authMiddleware } from "../../auth/interface/auth.middleware";
import {
  IOrganizationAuthorization,
  OrganizationPermission,
} from "../public/organization-authorization";
import {
  requireOrganizationMembership,
  requireOrganizationPermission,
} from "./authorization.middleware";

export function createMemberRouter(
  memberController: MemberController,
  authorization: IOrganizationAuthorization,
): Router {
  const router = Router();

  // All member routes require authentication
  router.use(authMiddleware);

  // Invitation Management
  router.post(
    "/:id/invitations",
    requireOrganizationPermission(
      authorization,
      OrganizationPermission.MEMBER_INVITE,
      "id",
    ),
    (req, res) => memberController.invite(req, res),
  );
  router.post("/invites/accept", (req, res) =>
    memberController.acceptInvitation(req, res),
  );
  router.get("/invites/:token", (req, res) =>
    memberController.getInvitation(req, res),
  );
  router.delete(
    "/:id/invitations/:invitationId",
    requireOrganizationPermission(
      authorization,
      OrganizationPermission.MEMBER_INVITE_REVOKE,
      "id",
    ),
    (req, res) => memberController.revokeInvitation(req, res),
  );

  // Member Management
  router.get(
    "/:id/members",
    requireOrganizationPermission(
      authorization,
      OrganizationPermission.MEMBER_LIST,
      "id",
    ),
    (req, res) => memberController.listMembers(req, res),
  );
  router.get(
    "/:id/members/me",
    requireOrganizationMembership(authorization, "id"),
    (req, res) => memberController.getMe(req, res),
  );
  router.get(
    "/:id/invitations",
    requireOrganizationPermission(
      authorization,
      OrganizationPermission.MEMBER_LIST,
      "id",
    ),
    (req, res) => memberController.listInvitations(req, res),
  );
  router.patch(
    "/:id/members/:userId/role",
    requireOrganizationPermission(
      authorization,
      OrganizationPermission.MEMBER_UPDATE_ROLE,
      "id",
    ),
    (req, res) => memberController.updateMemberRole(req, res),
  );
  router.patch(
    "/:id/members/:userId/status",
    requireOrganizationPermission(
      authorization,
      OrganizationPermission.MEMBER_UPDATE_STATUS,
      "id",
    ),
    (req, res) => memberController.updateMemberStatus(req, res),
  );
  router.delete(
    "/:id/members/:userId",
    requireOrganizationPermission(
      authorization,
      OrganizationPermission.MEMBER_REMOVE,
      "id",
    ),
    (req, res) => memberController.removeMember(req, res),
  );

  return router;
}
