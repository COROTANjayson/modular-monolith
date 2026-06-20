/**
 * Interface Layer - Member Validation
 */

import { z } from "zod";
import { OrganizationMemberStatus } from "../domain/member.entity";

export const inviteUserSchema = z
  .object({
    email: z.string().email(),
    roleId: z.string().min(1, "Role is required"),
  })
  .strict();

export const acceptInvitationSchema = z
  .object({
    token: z.string().uuid(),
  })
  .strict();

export const updateMemberRoleSchema = z
  .object({
    roleId: z.string().min(1, "Role is required"),
  })
  .strict();
export const updateMemberStatusSchema = z
  .object({
    status: z.nativeEnum(OrganizationMemberStatus),
  })
  .strict();
