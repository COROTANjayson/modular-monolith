/**
 * Domain Layer - Organization Permissions
 */
import { OrganizationRole } from "./organization.entity";

export enum OrganizationPermission {
  ORG_READ = "org:read",
  ORG_UPDATE = "org:update",
  ORG_DELETE = "org:delete",

  MEMBER_LIST = "member:list",
  MEMBER_INVITE = "member:invite",
  MEMBER_UPDATE_ROLE = "member:update-role",
  MEMBER_REMOVE = "member:remove",
}

const ROLE_PERMISSIONS: Record<OrganizationRole, OrganizationPermission[]> = {
  [OrganizationRole.OWNER]: [
    OrganizationPermission.ORG_READ,
    OrganizationPermission.ORG_UPDATE,
    OrganizationPermission.ORG_DELETE,
    OrganizationPermission.MEMBER_LIST,
    OrganizationPermission.MEMBER_INVITE,
    OrganizationPermission.MEMBER_UPDATE_ROLE,
    OrganizationPermission.MEMBER_REMOVE,
  ],
  [OrganizationRole.ADMIN]: [
    OrganizationPermission.ORG_READ,
    OrganizationPermission.ORG_UPDATE,
    OrganizationPermission.MEMBER_LIST,
    OrganizationPermission.MEMBER_INVITE,
    OrganizationPermission.MEMBER_UPDATE_ROLE,
    OrganizationPermission.MEMBER_REMOVE,
  ],
  [OrganizationRole.MEMBER]: [
    OrganizationPermission.ORG_READ,
    OrganizationPermission.MEMBER_LIST,
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
