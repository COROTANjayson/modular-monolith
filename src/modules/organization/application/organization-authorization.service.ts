import {
  DefaultRoleNames,
  OrganizationMemberStatus,
} from "../domain/member.entity";
import { IMemberRepository } from "../domain/member.repository";
import { OrganizationPermission } from "../domain/permissions";
import { ITeamRepository } from "../domain/team.repository";
import {
  IOrganizationAuthorization,
  OrganizationAccess,
  TeamAccessAction,
} from "../public/organization-authorization";

export class OrganizationAuthorizationService
  implements IOrganizationAuthorization
{
  constructor(
    private readonly memberRepository: IMemberRepository,
    private readonly teamRepository: ITeamRepository,
  ) {}

  async getAccess(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationAccess | null> {
    const member = await this.memberRepository.findMember(
      organizationId,
      userId,
    );
    if (!member) return null;

    return {
      organizationId,
      userId,
      status: member.status,
      roleName: member.role?.name ?? null,
      permissions: (member.role?.permissions ?? []) as OrganizationPermission[],
    };
  }

  async hasPermission(
    organizationId: string,
    userId: string,
    permission: OrganizationPermission,
  ): Promise<boolean> {
    const access = await this.getAccess(organizationId, userId);
    return this.accessHasPermission(access, permission);
  }

  async hasTeamAccess(
    organizationId: string,
    teamId: string,
    userId: string,
    action: TeamAccessAction,
  ): Promise<boolean> {
    const access = await this.getAccess(organizationId, userId);
    if (!access || access.status !== OrganizationMemberStatus.ACTIVE) {
      return false;
    }

    const team = await this.teamRepository.findById(teamId);
    if (!team || team.organizationId !== organizationId) return false;

    const isLeader = team.leaderId === userId;
    if (isLeader) return true;

    if (action === "chat") {
      return Boolean(await this.teamRepository.findMember(teamId, userId));
    }

    if (action === "read") {
      const isTeamMember = Boolean(
        await this.teamRepository.findMember(teamId, userId),
      );
      return (
        isTeamMember ||
        this.accessHasPermission(access, OrganizationPermission.TEAM_READ)
      );
    }

    const permission =
      action === "delete"
        ? OrganizationPermission.TEAM_DELETE
        : OrganizationPermission.TEAM_UPDATE;
    return this.accessHasPermission(access, permission);
  }

  private accessHasPermission(
    access: OrganizationAccess | null,
    permission: OrganizationPermission,
  ): boolean {
    if (!access || access.status !== OrganizationMemberStatus.ACTIVE) {
      return false;
    }
    if (access.roleName === DefaultRoleNames.OWNER) return true;
    return access.permissions.includes(permission);
  }
}
