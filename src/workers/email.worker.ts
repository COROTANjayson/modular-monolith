import { Worker, Job } from "bullmq";
import { getRedisClient } from "../shared/infra/redis";
import { EmailJobData } from "../queues/email.queue";
import {
  EMAIL_QUEUE_RATE_LIMIT,
  EMAIL_QUEUE_RATE_DURATION,
} from "../shared/utils/config";
import { logger } from "../shared/infra/logger";
import { EmailService } from "../shared/utils/email.service";

let emailWorker: Worker<EmailJobData> | null = null;

export function startEmailWorker(): Worker<EmailJobData> | null {
  if (emailWorker) {
    logger.info("Email worker already running");
    return emailWorker;
  }

  const redisClient = getRedisClient();
  if (!redisClient) {
    logger.warn("Redis not available. Email worker will not start.");
    return null;
  }

  const emailService = new EmailService();

  emailWorker = new Worker<EmailJobData>(
    "email",
    async (job: Job<EmailJobData>) => {
      logger.info(
        `Processing email job ${job.id} (attempt ${job.attemptsMade + 1}/${
          job.opts.attempts
        })`,
      );

      try {
        // Simply pass all job data to sendEmail - no switch needed!
        await emailService.sendEmail(job.data);

        const recipients =
          typeof job.data.to === "string"
            ? job.data.to
            : job.data.to.join(", ");
        logger.info(`✓ Email sent: ${job.data.subject} to ${recipients}`);

        return { success: true };
      } catch (error: any) {
        logger.error(`✗ Email job ${job.id} failed:`, error.message || error);
        throw error;
      }
    },
    {
      connection: redisClient,
      limiter: EMAIL_QUEUE_RATE_LIMIT
        ? {
            max: EMAIL_QUEUE_RATE_LIMIT,
            duration: EMAIL_QUEUE_RATE_DURATION,
          }
        : undefined,
      concurrency: 1,
    },
  );

  // Event listeners for monitoring
  emailWorker.on("completed", (job) => {
    logger.info(`✓ Email job ${job.id} completed successfully`);
  });

  emailWorker.on("failed", (job, err) => {
    logger.error(`✗ Email job ${job?.id} failed permanently:`, err.message);
  });

  emailWorker.on("error", (err) => {
    logger.error("Email worker error:", err);
  });

  logger.info("✓ Email worker started");

  return emailWorker;
}

/**
 * Gracefully close the email worker
 */
export async function closeEmailWorker(): Promise<void> {
  if (emailWorker) {
    await emailWorker.close();
    emailWorker = null;
    logger.info("Email worker closed");
  }
}

export default emailWorker;
