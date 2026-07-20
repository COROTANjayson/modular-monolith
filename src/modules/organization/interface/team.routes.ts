/**
 * Interface Layer - Team Routes
 */

import { Router } from "express";
import { TeamController } from "./team.controller";
import { authMiddleware } from "../../auth/interface/auth.middleware";
import {
  IOrganizationAuthorization,
  OrganizationPermission,
} from "../public/organization-authorization";
import {
  requireOrganizationPermission,
  requireTeamAccess,
} from "./authorization.middleware";

export function createTeamRouter(
  teamController: TeamController,
  authorization: IOrganizationAuthorization,
): Router {
  const router = Router();

  // All team routes require authentication
  router.use(authMiddleware);

  // My Teams
  router.get(
    "/:organizationId/teams/mine",
    requireOrganizationPermission(
      authorization,
      OrganizationPermission.TEAM_READ,
      "organizationId",
    ),
    (req, res, next) => teamController.getMyTeams(req, res, next),
  );

  // Team Management
  router.post(
    "/:organizationId/teams",
    requireOrganizationPermission(
      authorization,
      OrganizationPermission.TEAM_CREATE,
      "organizationId",
    ),
    (req, res, next) => teamController.createTeam(req, res, next),
  );
  router.get(
    "/:organizationId/teams",
    requireOrganizationPermission(
      authorization,
      OrganizationPermission.TEAM_READ,
      "organizationId",
    ),
    (req, res, next) => teamController.getTeams(req, res, next),
  );
  router.get(
    "/:organizationId/teams/:teamId",
    requireTeamAccess(authorization, "read", "organizationId", "teamId"),
    (req, res, next) => teamController.getTeam(req, res, next),
  );
  router.patch(
    "/:organizationId/teams/:teamId",
    requireTeamAccess(authorization, "update", "organizationId", "teamId"),
    (req, res, next) => teamController.updateTeam(req, res, next),
  );
  router.delete(
    "/:organizationId/teams/:teamId",
    requireTeamAccess(authorization, "delete", "organizationId", "teamId"),
    (req, res, next) => teamController.deleteTeam(req, res, next),
  );

  // Team Member Management
  router.get(
    "/:organizationId/teams/:teamId/members",
    requireTeamAccess(authorization, "read", "organizationId", "teamId"),
    (req, res, next) => teamController.getTeamMembers(req, res, next),
  );
  router.post(
    "/:organizationId/teams/:teamId/members",
    requireTeamAccess(
      authorization,
      "manage-members",
      "organizationId",
      "teamId",
    ),
    (req, res, next) => teamController.addMembers(req, res, next),
  );
  router.delete(
    "/:organizationId/teams/:teamId/members/:userId",
    requireTeamAccess(
      authorization,
      "manage-members",
      "organizationId",
      "teamId",
    ),
    (req, res, next) => teamController.removeMember(req, res, next),
  );

  return router;
}
