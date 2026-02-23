import { z } from "zod";

export const getMessagesSchema = z.object({
  params: z.object({
    orgId: z.string().min(1, "Organization ID is required"),
    teamId: z.string().min(1, "Team ID is required"),
  }),
  query: z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().int().min(1).max(100).optional(),
  }),
});
