/**
 * Interface Layer - Notification Validation Schemas
 */

import { z } from "zod";

export const notificationListQuerySchema = z.object({
  isRead: z
    .enum(["true", "false"])
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20)),
});
