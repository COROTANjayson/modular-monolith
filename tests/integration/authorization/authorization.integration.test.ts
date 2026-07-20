import request from "supertest";
import jwt from "jsonwebtoken";
import { randomUUID } from "crypto";
import app from "../../../src/app";
import { clearDatabase, getPrismaTestClient } from "../../setup/test-db";
import { OrganizationPermission } from "../../../src/modules/organization/domain/permissions";

describe("organization authorization integration", () => {
  const prisma = getPrismaTestClient();

  beforeEach(async () => {
    await clearDatabase();
  });

  async function createUser() {
    const user = await prisma.user.create({
      data: {
        email: `authorization-${randomUUID()}@example.com`,
        isVerified: true,
      },
    });
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_ACCESS_TOKEN_SECRET!,
      { expiresIn: "1h" },
    );
    return { user, token };
  }

  async function createMembership(options: {
    status?: "active" | "suspended";
    roleName?: string;
    permissions?: OrganizationPermission[];
  } = {}) {
    const { user, token } = await createUser();
    const organization = await prisma.organization.create({
      data: {
        name: "Authorization Org",
        slug: `authorization-org-${user.id}`,
        ownerId: user.id,
      },
    });
    const role = await prisma.role.create({
      data: {
        organizationId: organization.id,
        name: options.roleName ?? "custom_role",
        permissions: options.permissions ?? [],
      },
    });
    await prisma.organizationMember.create({
      data: {
        organizationId: organization.id,
        userId: user.id,
        roleId: role.id,
        status: options.status ?? "active",
        joinedAt: new Date(),
      },
    });
    return { user, token, organization, role };
  }

  it("honors persisted custom-role permissions", async () => {
    const { token, organization } = await createMembership({
      permissions: [OrganizationPermission.ORG_READ],
    });

    await request(app)
      .get(`/api/v1/organizations/${organization.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(200);
  });

  it("denies a suspended member even when its role has the permission", async () => {
    const { token, organization } = await createMembership({
      status: "suspended",
      permissions: [OrganizationPermission.ORG_READ],
    });

    await request(app)
      .get(`/api/v1/organizations/${organization.id}`)
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
  });

  it("rejects assigning the owner role by role ID", async () => {
    const { token, organization, role } = await createMembership({
      roleName: "owner",
    });

    const response = await request(app)
      .post(`/api/v1/organizations/${organization.id}/invitations`)
      .set("Authorization", `Bearer ${token}`)
      .send({ email: "invitee@example.com", roleId: role.id })
      .expect(400);

    expect(response.body.message).toBe(
      "An organization can only have one owner",
    );
  });

  it("allows matching team chat membership and rejects cross-organization context", async () => {
    const { user, token, organization } = await createMembership();
    const { user: leader } = await createUser();
    const team = await prisma.team.create({
      data: {
        organizationId: organization.id,
        name: "Chat Team",
        leaderId: leader.id,
        members: { create: { userId: user.id } },
      },
    });
    const otherOrganization = await prisma.organization.create({
      data: {
        name: "Other Org",
        slug: `other-org-${user.id}`,
        ownerId: leader.id,
      },
    });

    await request(app)
      .get(
        `/api/v1/chat/${organization.id}/teams/${team.id}/messages`,
      )
      .set("Authorization", `Bearer ${token}`)
      .expect(200);

    await request(app)
      .get(
        `/api/v1/chat/${otherOrganization.id}/teams/${team.id}/messages`,
      )
      .set("Authorization", `Bearer ${token}`)
      .expect(403);
  });
});
