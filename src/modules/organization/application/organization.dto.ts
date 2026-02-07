/**
 * Application Layer - Organization DTOs
 */

import { OrganizationRole } from "../domain/member.entity";


export interface CreateOrganizationDto {
  name: string;
}

export interface UpdateOrganizationDto {
  name?: string;
}

export interface InviteUserDto {
  email: string;
  role: OrganizationRole;
}

export interface AcceptInvitationDto {
  token: string;
}

export interface UpdateMemberRoleDto {
  role: OrganizationRole;
}
