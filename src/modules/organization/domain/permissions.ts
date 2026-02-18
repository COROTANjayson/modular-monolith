/**
 * Domain Layer - Organization Permissions
 */
import { OrganizationRole } from "./member.entity";

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
}

const ROLE_PERMISSIONS: Record<OrganizationRole, OrganizationPermission[]> = {
  [OrganizationRole.OWNER]: [
    OrganizationPermission.ORG_READ,
    OrganizationPermission.ORG_UPDATE,
    OrganizationPermission.ORG_DELETE,
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
  ],
  [OrganizationRole.ADMIN]: [
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
  ],
  [OrganizationRole.TEAM_LEAD]: [
    OrganizationPermission.ORG_READ,
    OrganizationPermission.MEMBER_LIST,
    OrganizationPermission.TEAM_CREATE,
    OrganizationPermission.TEAM_UPDATE,
    OrganizationPermission.TEAM_READ,
  ],
  [OrganizationRole.MEMBER]: [
    OrganizationPermission.ORG_READ,
    OrganizationPermission.MEMBER_LIST,
    OrganizationPermission.TEAM_READ,
  ],
};

/**
 * Checks if a given role has a specific permission
 */
export function hasPermission(
  role: OrganizationRole,
  permission: OrganizationPermission,
): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) || false;
}
