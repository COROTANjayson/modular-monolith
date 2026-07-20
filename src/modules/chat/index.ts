/**
 * Chat Module - Public API
 */

import { Router } from "express";
import { PrismaChatMessageRepository } from "./infrastructure/prisma-chat-message.repository";
import { IOrganizationAuthorization } from "../organization/public/organization-authorization";
import { ChatService } from "./application/chat.service";
import { ChatController } from "./interface/chat.controller";
import { createChatRouter } from "./interface/chat.routes";
import { ChatGateway } from "./interface/chat.gateway";

export function createChatModule(
  organizationAuthorization: IOrganizationAuthorization,
): {
  router: Router;
  chatGateway: ChatGateway;
} {
  // Infrastructure
  const chatMessageRepo = new PrismaChatMessageRepository();

  // Application
  const chatService = new ChatService(
    chatMessageRepo,
    organizationAuthorization,
  );

  // Interface - REST
  const chatController = new ChatController(chatService);
  const router = createChatRouter(chatController, organizationAuthorization);

  // Interface - WebSocket
  const chatGateway = new ChatGateway(chatService);

  return { router, chatGateway };
}
