/**
 * Shared Infrastructure - WebSocket (Socket.IO)
 *
 * Reusable, namespace-based Socket.IO setup.
 * Each feature gets its own namespace (e.g. /notifications, /chat, /collab).
 *
 * Usage:
 *   // In server.ts - initialize once
 *   import { initializeWebSocket } from "./shared/infra/websocket";
 *   initializeWebSocket(httpServer);
 *
 *   // In any module - get the instance
 *   import { getIO } from "./shared/infra/websocket";
 *   const notifNs = getIO().of('/notifications');
 */

import { Server as HttpServer } from "http";
import { Server as SocketIOServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { ACCESS_SECRET, CLIENT_URL } from "../utils/config";
import { logger } from "./logger";

let io: SocketIOServer | null = null;

/**
 * Initialize Socket.IO on the HTTP server.
 * Call this ONCE in server.ts after creating the HTTP server.
 */
export function initializeWebSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: CLIENT_URL || "http://localhost:3000",
      credentials: true,
    },
    // Ping every 25s, timeout after 20s of no pong
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  logger.info("✓ Socket.IO initialized");

  return io;
}

/**
 * Get the Socket.IO server instance.
 * Throws if called before initializeWebSocket().
 */
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error(
      "Socket.IO not initialized. Call initializeWebSocket(httpServer) first.",
    );
  }
  return io;
}

/**
 * Shared JWT authentication middleware for Socket.IO namespaces.
 * Extracts userId from the JWT token and attaches it to socket.data.
 *
 * Usage in a namespace:
 *   const ns = getIO().of('/notifications');
 *   ns.use(socketAuthMiddleware);
 */
export function socketAuthMiddleware(
  socket: Socket,
  next: (err?: Error) => void,
): void {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) {
      return next(new Error("Authentication required"));
    }

    const payload: any = jwt.verify(token, ACCESS_SECRET);
    socket.data.userId = payload.id;
    next();
  } catch (err) {
    next(new Error("Invalid or expired token"));
  }
}

/**
 * Helper: Join a user to their personal room.
 * Call this on 'connection' so you can emit to specific users.
 *
 * Room format: "user:{userId}"
 */
export function joinUserRoom(socket: Socket): void {
  const userId = socket.data.userId;
  if (userId) {
    socket.join(`user:${userId}`);
    logger.debug(`Socket ${socket.id} joined room user:${userId}`);
  }
}

/**
 * Gracefully close Socket.IO
 */
export async function closeWebSocket(): Promise<void> {
  if (io) {
    io.close();
    io = null;
    logger.info("Socket.IO closed");
  }
}
