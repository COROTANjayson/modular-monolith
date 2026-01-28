/**
 * Interface Layer - Organization Validation
 */

import { z } from "zod";
import { OrganizationRole } from "../domain/organization.entity";

export const createOrganizationSchema = z.object({
  name: z.string().min(3).max(50),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(3).max(50).optional(),
});

export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(OrganizationRole),
});

export const acceptInvitationSchema = z.object({
  token: z.string().uuid(),
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(OrganizationRole),
});
