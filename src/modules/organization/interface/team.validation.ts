/**
 * Interface Layer - Team Validation
 */

import { z } from "zod";

export const createTeamSchema = z
  .object({
    name: z.string().min(3).max(50),
    description: z.string().max(255).optional(),
  })
  .strict();

export const updateTeamSchema = z
  .object({
    name: z.string().min(3).max(50).optional(),
    description: z.string().max(255).optional(),
  })
  .strict();

export const addTeamMemberSchema = z
  .object({
    userId: z.string().uuid(),
  })
  .strict();
