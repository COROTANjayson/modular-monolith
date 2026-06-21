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

export const createRoleSchema = z
  .object({
    name: z.string().min(2).max(50),
    permissions: z.array(z.string()).optional(),
  })
  .strict();

export const updateRoleSchema = z
  .object({
    name: z.string().min(2).max(50).optional(),
    permissions: z.array(z.string()).optional(),
  })
  .strict();

