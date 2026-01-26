import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { startEmailWorker, closeEmailWorker } from "./workers/email.worker";
import { closeEmailQueue } from "./queues/email.queue";
import { closeRedis } from "./libs/redis.config";

import { logger } from "./libs/logger";

const port = process.env.PORT || 3000;

// Start the email worker
startEmailWorker();

const server = app.listen(port, () => {
  logger.info(`Server listening on http://localhost:${port}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`\n${signal} received. Starting graceful shutdown...`);

  // Close server to stop accepting new connections
  server.close(async () => {
    logger.info("HTTP server closed");

    try {
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
