import { OrganizationMemberStatus } from "../domain/member.entity";
import { OrganizationPermission } from "../domain/permissions";

export { OrganizationPermission } from "../domain/permissions";

export interface OrganizationAccess {
  organizationId: string;
  userId: string;
  status: OrganizationMemberStatus;
  roleName: string | null;
  permissions: OrganizationPermission[];
}

export type TeamAccessAction =
  | "read"
  | "update"
  | "delete"
  | "manage-members"
  | "chat";

export interface IOrganizationAuthorization {
  getAccess(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationAccess | null>;
  hasPermission(
    organizationId: string,
    userId: string,
    permission: OrganizationPermission,
  ): Promise<boolean>;
  hasTeamAccess(
    organizationId: string,
    teamId: string,
    userId: string,
    action: TeamAccessAction,
  ): Promise<boolean>;
}
