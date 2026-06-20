/**
 * Application Layer - Organization DTOs
 */


export interface CreateOrganizationDto {
  name: string;
}

export interface UpdateOrganizationDto {
  name?: string;
}

export interface InviteUserDto {
  email: string;
  roleId: string;
}

export interface AcceptInvitationDto {
  token: string;
}

export interface UpdateMemberRoleDto {
  roleId: string;
}
