import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app, { notificationGateway, chatGateway } from "./app";
import { startEmailWorker, closeEmailWorker } from "./workers/email.worker";
import { closeEmailQueue } from "./queues/email.queue";
import { closeRedis } from "./shared/infra/redis";
import { initializeWebSocket, closeWebSocket } from "./shared/infra/websocket";

import { logger } from "./shared/infra/logger";

const port = process.env.PORT || 3000;

// Start the email worker
startEmailWorker();

// Create HTTP server (needed for Socket.IO to attach)
const httpServer = http.createServer(app);

// Initialize Socket.IO on the HTTP server
initializeWebSocket(httpServer);

// Initialize WebSocket gateways (after Socket.IO is ready)
notificationGateway.initialize();
chatGateway.initialize();

const server = httpServer.listen(port, () => {
  logger.info(`Server listening on http://localhost:${port}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  // Close server to stop accepting new connections
  server.close(async () => {
    logger.info("HTTP server closed");

    try {
      // Close WebSocket
      await closeWebSocket();
      // Close email worker and queue
      await closeEmailWorker();
      await closeEmailQueue();
      await closeRedis();

      logger.info("Graceful shutdown complete");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown:", error);
      process.exit(1);
    }
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000);
};

// Listen for termination signals
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

