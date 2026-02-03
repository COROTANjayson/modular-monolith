/**
 * Interface Layer - Member Validation
 */

import { z } from "zod";
import { OrganizationRole } from "../domain/member.entity";

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
