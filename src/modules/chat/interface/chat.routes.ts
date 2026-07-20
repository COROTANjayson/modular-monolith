/**
 * Interface Layer - Chat Routes
 */

import { Router } from "express";
import { ChatController } from "./chat.controller";
import { authMiddleware } from "../../auth/interface/auth.middleware";
import { IOrganizationAuthorization } from "../../organization/public/organization-authorization";
import { requireTeamAccess } from "../../organization/interface/authorization.middleware";

export function createChatRouter(
  chatController: ChatController,
  authorization: IOrganizationAuthorization,
): Router {
  const router = Router();

  // All chat routes require authentication
  router.use(authMiddleware);

  // Get message history for a team chat
  router.get(
    "/:orgId/teams/:teamId/messages",
    requireTeamAccess(authorization, "chat", "orgId", "teamId"),
    (req, res, next) => chatController.getMessages(req, res, next),
  );

  return router;
}
