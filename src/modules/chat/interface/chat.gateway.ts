/**
 * Interface Layer - Chat WebSocket Gateway
 *
 * Handles the /chat Socket.IO namespace.
 * - Authenticates connections via JWT
 * - Allows users to join/leave team chat rooms
 * - Handles real-time message sending via WebSocket
 * - Listens to EventBus for new messages and broadcasts to team rooms
 */

import { Namespace } from "socket.io";
import {
  getIO,
  socketAuthMiddleware,
  joinUserRoom,
} from "../../../shared/infra/websocket";
import { eventBus } from "../../../shared/infra/event-bus";
import { ChatService } from "../application/chat.service";
import { logger } from "../../../shared/infra/logger";

export class ChatGateway {
  private namespace: Namespace | null = null;

  constructor(private chatService: ChatService) {}

  /**
   * Initialize the /chat namespace.
   * Call this after Socket.IO has been initialized (in server.ts).
   */
  initialize(): void {
    try {
      const io = getIO();
      this.namespace = io.of("/chat");

      // Apply JWT auth middleware
      this.namespace.use(socketAuthMiddleware);

      // Handle new connections
      this.namespace.on("connection", (socket) => {
        const userId = socket.data.userId;
        logger.info(
          `[Chat WS] User ${userId} connected (socket: ${socket.id})`,
        );

        // Join personal room for targeted delivery
        joinUserRoom(socket);

        /**
         * Client joins a team chat room.
         * Payload: { teamId: string }
         */
        socket.on("join-team", async (data: { teamId: string }) => {
          try {
            const { teamId } = data;

            // Verify membership via the service (which checks team repo)
            // We do a lightweight check by trying to get messages (limit 0)
            await this.chatService.getMessages(teamId, userId, undefined, 1);

            socket.join(`team:${teamId}`);
            logger.info(
              `[Chat WS] User ${userId} joined team room team:${teamId}`,
            );

            socket.emit("joined-team", { teamId });
          } catch (err: any) {
            logger.warn(
              `[Chat WS] User ${userId} failed to join team: ${err.message}`,
            );
            socket.emit("error", { message: err.message });
          }
        });

        /**
         * Client leaves a team chat room.
         * Payload: { teamId: string }
         */
        socket.on("leave-team", (data: { teamId: string }) => {
          const { teamId } = data;
          socket.leave(`team:${teamId}`);
          logger.info(
            `[Chat WS] User ${userId} left team room team:${teamId}`,
          );
        });

        /**
         * Client sends a message to a team chat.
         * Payload: { teamId: string, content: string }
         */
        socket.on(
          "send-message",
          async (data: { teamId: string; content: string }) => {
            try {
              const { teamId, content } = data;

              if (!content || content.trim().length === 0) {
                socket.emit("error", { message: "Message content is required" });
                return;
              }

              const message = await this.chatService.sendMessage(
                teamId,
                userId,
                content.trim(),
              );

              // The event bus will handle broadcasting (see below)
              // But we also acknowledge the sender
              socket.emit("message-sent", message);
            } catch (err: any) {
              logger.warn(
                `[Chat WS] User ${userId} failed to send message: ${err.message}`,
              );
              socket.emit("error", { message: err.message });
            }
          },
        );

        socket.on("disconnect", () => {
          logger.info(
            `[Chat WS] User ${userId} disconnected (socket: ${socket.id})`,
          );
        });
      });

      // Listen for new messages from EventBus and broadcast to team rooms
      eventBus.on("chat.message_sent", (payload) => {
        if (this.namespace) {
          this.namespace
            .to(`team:${payload.teamId}`)
            .emit("new-message", payload);
        }
      });

      logger.info("✓ Chat WebSocket gateway initialized (/chat)");
    } catch (err) {
      logger.warn(
        "[Chat WS] Could not initialize - Socket.IO may not be available",
      );
    }
  }
}
