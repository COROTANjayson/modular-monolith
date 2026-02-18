/**
 * Interface Layer - Organization Routes
 */

import { Router } from "express";
import { OrganizationController } from "./organization.controller";
import { TeamController } from "./team.controller";
import { authMiddleware } from "../../auth/interface/auth.middleware";

export function createOrganizationRouter(
  orgController: OrganizationController,
  teamController: TeamController
): Router {
  const router = Router();

  // All organization routes require authentication
  router.use(authMiddleware);

  //  Organization Management
  router.get("/", (req, res) => orgController.getAll(req, res));
  router.post("/", (req, res) => orgController.create(req, res));
  
  // Team Management
  router.post("/:organizationId/teams", (req, res, next) => teamController.createTeam(req, res, next));
  router.get("/:organizationId/teams", (req, res, next) => teamController.getTeams(req, res, next));
  router.get("/:organizationId/teams/:teamId", (req, res, next) => teamController.getTeam(req, res, next));
  router.patch("/:organizationId/teams/:teamId", (req, res, next) => teamController.updateTeam(req, res, next));
  router.get("/:organizationId/teams/:teamId/members", (req, res, next) => teamController.getTeamMembers(req, res, next));
  router.post("/:organizationId/teams/:teamId/members", (req, res, next) => teamController.addMember(req, res, next));
  router.delete("/:organizationId/teams/:teamId/members/:userId", (req, res, next) => teamController.removeMember(req, res, next));

  router.get("/:id", (req, res) => orgController.getById(req, res));
  router.patch("/:id", (req, res) => orgController.update(req, res));

  return router;
}
