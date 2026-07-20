import { OrganizationAuthorizationService } from "../../../src/modules/organization/application/organization-authorization.service";
import {
  DefaultRoleNames,
  OrganizationMember,
  OrganizationMemberStatus,
} from "../../../src/modules/organization/domain/member.entity";
import { IMemberRepository } from "../../../src/modules/organization/domain/member.repository";
import { OrganizationPermission } from "../../../src/modules/organization/domain/permissions";
import { ITeamRepository } from "../../../src/modules/organization/domain/team.repository";

const member = (
  status: OrganizationMemberStatus,
  roleName: string,
  permissions: OrganizationPermission[] = [],
): OrganizationMember => ({
  id: "membership-1",
  organizationId: "org-1",
  userId: "user-1",
  roleId: "role-1",
  role: {
    id: "role-1",
    organizationId: "org-1",
    name: roleName,
    permissions,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  status,
  invitedAt: new Date(),
  joinedAt: new Date(),
});

describe("OrganizationAuthorizationService", () => {
  const memberRepository = {
    findMember: jest.fn(),
  } as unknown as jest.Mocked<IMemberRepository>;
  const teamRepository = {
    findById: jest.fn(),
    findMember: jest.fn(),
  } as unknown as jest.Mocked<ITeamRepository>;
  const authorization = new OrganizationAuthorizationService(
    memberRepository,
    teamRepository,
  );

  beforeEach(() => jest.clearAllMocks());

  it("uses persisted permissions for custom roles", async () => {
    memberRepository.findMember.mockResolvedValue(
      member(OrganizationMemberStatus.ACTIVE, "content_manager", [
        OrganizationPermission.ROLE_READ,
      ]),
    );

    await expect(
      authorization.hasPermission(
        "org-1",
        "user-1",
        OrganizationPermission.ROLE_READ,
      ),
    ).resolves.toBe(true);
  });

  it("allows active owners to bypass individual permissions", async () => {
    memberRepository.findMember.mockResolvedValue(
      member(OrganizationMemberStatus.ACTIVE, DefaultRoleNames.OWNER),
    );

    await expect(
      authorization.hasPermission(
        "org-1",
        "user-1",
        OrganizationPermission.ROLE_DELETE,
      ),
    ).resolves.toBe(true);
  });

  it.each([
    OrganizationMemberStatus.INVITED,
    OrganizationMemberStatus.SUSPENDED,
    OrganizationMemberStatus.LEFT,
  ])("denies permissions for %s memberships", async (status) => {
    memberRepository.findMember.mockResolvedValue(
      member(status, DefaultRoleNames.OWNER),
    );

    await expect(
      authorization.hasPermission(
        "org-1",
        "user-1",
        OrganizationPermission.ORG_READ,
      ),
    ).resolves.toBe(false);
  });

  it("rejects a team from another organization", async () => {
    memberRepository.findMember.mockResolvedValue(
      member(OrganizationMemberStatus.ACTIVE, DefaultRoleNames.OWNER),
    );
    teamRepository.findById.mockResolvedValue({
      id: "team-1",
      organizationId: "org-2",
      leaderId: "user-1",
      name: "Other team",
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      authorization.hasTeamAccess(
        "org-1",
        "team-1",
        "user-1",
        "chat",
      ),
    ).resolves.toBe(false);
  });

  it("allows team leaders to manage a matching team", async () => {
    memberRepository.findMember.mockResolvedValue(
      member(OrganizationMemberStatus.ACTIVE, DefaultRoleNames.MEMBER),
    );
    teamRepository.findById.mockResolvedValue({
      id: "team-1",
      organizationId: "org-1",
      leaderId: "user-1",
      name: "Team",
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await expect(
      authorization.hasTeamAccess(
        "org-1",
        "team-1",
        "user-1",
        "manage-members",
      ),
    ).resolves.toBe(true);
  });

  it("requires team membership for chat", async () => {
    memberRepository.findMember.mockResolvedValue(
      member(OrganizationMemberStatus.ACTIVE, DefaultRoleNames.ADMIN, [
        OrganizationPermission.TEAM_READ,
      ]),
    );
    teamRepository.findById.mockResolvedValue({
      id: "team-1",
      organizationId: "org-1",
      leaderId: "leader-1",
      name: "Team",
      description: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    teamRepository.findMember.mockResolvedValue(null);

    await expect(
      authorization.hasTeamAccess(
        "org-1",
        "team-1",
        "user-1",
        "chat",
      ),
    ).resolves.toBe(false);

    teamRepository.findMember.mockResolvedValue({
      id: "team-member-1",
      teamId: "team-1",
      userId: "user-1",
      joinedAt: new Date(),
    });
    await expect(
      authorization.hasTeamAccess(
        "org-1",
        "team-1",
        "user-1",
        "chat",
      ),
    ).resolves.toBe(true);
  });
});
