/**
 * Interface Layer - Organization Routes
 */

import { Router } from "express";
import { OrganizationController } from "./organization.controller";
import { authMiddleware } from "../../auth/interface/auth.middleware";
import {
  IOrganizationAuthorization,
  OrganizationPermission,
} from "../public/organization-authorization";
import { requireOrganizationPermission } from "./authorization.middleware";

export function createOrganizationRouter(
  orgController: OrganizationController,
  authorization: IOrganizationAuthorization,
): Router {
  const router = Router();

  // All organization routes require authentication
  router.use(authMiddleware);

  //  Organization Management
  router.get("/", (req, res) => orgController.getAll(req, res));
  router.post("/", (req, res) => orgController.create(req, res));

  router.get(
    "/:id",
    requireOrganizationPermission(
      authorization,
      OrganizationPermission.ORG_READ,
      "id",
    ),
    (req, res) => orgController.getById(req, res),
  );
  router.patch(
    "/:id",
    requireOrganizationPermission(
      authorization,
      OrganizationPermission.ORG_UPDATE,
      "id",
    ),
    (req, res) => orgController.update(req, res),
  );
  router.get(
    "/:id/roles",
    requireOrganizationPermission(
      authorization,
      OrganizationPermission.ROLE_READ,
      "id",
    ),
    (req, res) => orgController.getRoles(req, res),
  );
  router.post(
    "/:id/roles",
    requireOrganizationPermission(
      authorization,
      OrganizationPermission.ROLE_CREATE,
      "id",
    ),
    (req, res) => orgController.createRole(req, res),
  );
  router.put(
    "/:id/roles/:roleId",
    requireOrganizationPermission(
      authorization,
      OrganizationPermission.ROLE_UPDATE,
      "id",
    ),
    (req, res) => orgController.updateRole(req, res),
  );
  router.delete(
    "/:id/roles/:roleId",
    requireOrganizationPermission(
      authorization,
      OrganizationPermission.ROLE_DELETE,
      "id",
    ),
    (req, res) => orgController.deleteRole(req, res),
  );

  return router;
}
