/**
 * Domain Layer - Organization Permissions
 */
import { DefaultRoleNames } from "./member.entity";

export enum OrganizationPermission {
  ORG_READ = "org:read",
  ORG_UPDATE = "org:update",
  ORG_DELETE = "org:delete",

  MEMBER_LIST = "member:list",
  MEMBER_INVITE = "member:invite",
  MEMBER_INVITE_REVOKE = "member:invite-revoke",
  MEMBER_UPDATE_ROLE = "member:update-role",
  MEMBER_UPDATE_STATUS = "member:update-status",
  MEMBER_REMOVE = "member:remove",

  TEAM_CREATE = "team:create",
  TEAM_UPDATE = "team:update",
  TEAM_DELETE = "team:delete",
  TEAM_READ = "team:read",

  ROLE_CREATE = "role:create",
  ROLE_UPDATE = "role:update",
  ROLE_DELETE = "role:delete",
  ROLE_READ = "role:read",
}

export const ROLE_PERMISSIONS: Record<string, OrganizationPermission[]> = {
  [DefaultRoleNames.OWNER]: [
    // Owner is treated as super-user and bypasses checks in hasPermission
  ],
  [DefaultRoleNames.ADMIN]: [
    OrganizationPermission.ORG_READ,
    OrganizationPermission.ORG_UPDATE,
    OrganizationPermission.MEMBER_LIST,
    OrganizationPermission.MEMBER_INVITE,
    OrganizationPermission.MEMBER_INVITE_REVOKE,
    OrganizationPermission.MEMBER_UPDATE_ROLE,
    OrganizationPermission.MEMBER_UPDATE_STATUS,
    OrganizationPermission.MEMBER_REMOVE,
    OrganizationPermission.TEAM_CREATE,
    OrganizationPermission.TEAM_UPDATE,
    OrganizationPermission.TEAM_DELETE,
    OrganizationPermission.TEAM_READ,
    OrganizationPermission.ROLE_CREATE,
    OrganizationPermission.ROLE_UPDATE,
    OrganizationPermission.ROLE_DELETE,
    OrganizationPermission.ROLE_READ,
  ],
  [DefaultRoleNames.TEAM_LEAD]: [
    OrganizationPermission.ORG_READ,
    OrganizationPermission.MEMBER_LIST,
    OrganizationPermission.TEAM_CREATE,
    OrganizationPermission.TEAM_UPDATE,
    OrganizationPermission.TEAM_READ,
  ],
  [DefaultRoleNames.MEMBER]: [
    OrganizationPermission.ORG_READ,
    OrganizationPermission.MEMBER_LIST,
    OrganizationPermission.TEAM_READ,
  ],
};
