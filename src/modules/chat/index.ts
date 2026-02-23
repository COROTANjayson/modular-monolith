/**
 * Chat Module - Public API
 */

import { Router } from "express";
import { PrismaChatMessageRepository } from "./infrastructure/prisma-chat-message.repository";
import { PrismaTeamRepository } from "../organization/infrastructure/prisma-team.repository";
import { ChatService } from "./application/chat.service";
import { ChatController } from "./interface/chat.controller";
import { createChatRouter } from "./interface/chat.routes";
import { ChatGateway } from "./interface/chat.gateway";

export function createChatModule(): {
  router: Router;
  chatGateway: ChatGateway;
} {
  // Infrastructure
  const chatMessageRepo = new PrismaChatMessageRepository();
  const teamRepo = new PrismaTeamRepository();

  // Application
  const chatService = new ChatService(chatMessageRepo, teamRepo);

  // Interface - REST
  const chatController = new ChatController(chatService);
  const router = createChatRouter(chatController);

  // Interface - WebSocket
  const chatGateway = new ChatGateway(chatService);

  return { router, chatGateway };
}
