/**
 * Interface Layer - Organization Validation
 */

import { z } from "zod";
import { OrganizationRole } from "../domain/organization.entity";

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

export const inviteUserSchema = z
  .object({
    email: z.string().email(),
    role: z.nativeEnum(OrganizationRole),
  })
  .strict();

export const acceptInvitationSchema = z
  .object({
    token: z.string().uuid(),
  })
  .strict();

export const updateMemberRoleSchema = z
  .object({
    role: z.nativeEnum(OrganizationRole),
  })
  .strict();
