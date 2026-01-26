import { Queue } from "bullmq";
import { getRedisClient } from "../libs/redis.config";
import { logger } from "../libs/logger";

/**
 * Generic email job data
 */
export interface EmailJob {
  to: string | string[];
  subject: string;
  template: string;
  variables: Record<string, any>;
  from?: string;
}

export type EmailJobData = EmailJob;

/**
 * Email queue for processing emails asynchronously
 */
let emailQueue: Queue<EmailJobData> | null = null;

export function getEmailQueue(): Queue<EmailJobData> | null {
  if (emailQueue) {
    return emailQueue;
  }

  const redisClient = getRedisClient();
  if (!redisClient) {
    logger.warn("Redis not available. Email queue disabled.");
    return null;
  }

  emailQueue = new Queue<EmailJobData>("email", {
    connection: redisClient,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: {
        age: 24 * 3600,
        count: 100,
      },
      removeOnFail: {
        age: 7 * 24 * 3600,
      },
    },
  });

  logger.info("✓ Email queue initialized");

  return emailQueue;
}

/**
 * Queue an email for asynchronous sending
 */
export async function queueEmail(emailData: EmailJob): Promise<void> {
  const queue = getEmailQueue();
  if (!queue) {
    throw new Error(
      "Email queue not available. Please configure REDIS_URL in environment."
    );
  }

  await queue.add("send-email", emailData, {
    priority: 1,
  });

  const recipients =
    typeof emailData.to === "string" ? emailData.to : emailData.to.join(", ");
  logger.info(`✓ Email queued: ${emailData.subject} to ${recipients}`);
}

/**
 * Gracefully close email queue
 */
export async function closeEmailQueue(): Promise<void> {
  if (emailQueue) {
    await emailQueue.close();
    emailQueue = null;
    logger.info("Email queue closed");
  }
}

export default getEmailQueue();
