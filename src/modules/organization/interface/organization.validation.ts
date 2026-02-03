/**
 * Interface Layer - Organization Validation
 */

import { z } from "zod";

export const createOrganizationSchema = z
  .object({
    name: z.string().min(3).max(50),
  })
  .strict();

export const updateOrganizationSchema = z
  .object({
    name: z.string().min(3).max(50).optional(),
  })
  .strict();
