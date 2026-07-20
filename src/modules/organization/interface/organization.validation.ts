/**
 * Interface Layer - Organization Validation
 */

import { z } from "zod";
import { OrganizationPermission } from "../public/organization-authorization";

const permissionSchema = z.enum(OrganizationPermission);

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
    permissions: z.array(permissionSchema).optional(),
  })
  .strict();

export const updateRoleSchema = z
  .object({
    name: z.string().min(2).max(50).optional(),
    permissions: z.array(permissionSchema).optional(),
  })
  .strict();

