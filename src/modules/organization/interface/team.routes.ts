/**
 * Interface Layer - Team Routes
 */

import { Router } from "express";
import { TeamController } from "./team.controller";
import { authMiddleware } from "../../auth/interface/auth.middleware";

export function createTeamRouter(teamController: TeamController): Router {
  const router = Router();

  // All team routes require authentication
  router.use(authMiddleware);

  // My Teams
  router.get("/:organizationId/teams/mine", (req, res, next) =>
    teamController.getMyTeams(req, res, next),
  );

  // Team Management
  router.post("/:organizationId/teams", (req, res, next) =>
    teamController.createTeam(req, res, next),
  );
  router.get("/:organizationId/teams", (req, res, next) =>
    teamController.getTeams(req, res, next),
  );
  router.get("/:organizationId/teams/:teamId", (req, res, next) =>
    teamController.getTeam(req, res, next),
  );
  router.patch("/:organizationId/teams/:teamId", (req, res, next) =>
    teamController.updateTeam(req, res, next),
  );

  // Team Member Management
  router.get("/:organizationId/teams/:teamId/members", (req, res, next) =>
    teamController.getTeamMembers(req, res, next),
  );
  router.post("/:organizationId/teams/:teamId/members", (req, res, next) =>
    teamController.addMember(req, res, next),
  );
  router.delete(
    "/:organizationId/teams/:teamId/members/:userId",
    (req, res, next) => teamController.removeMember(req, res, next),
  );

  return router;
}
