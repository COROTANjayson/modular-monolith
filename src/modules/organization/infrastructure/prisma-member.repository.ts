/**
 * Infrastructure Layer - Prisma Member Repository
 */

import { prisma } from "../../../shared/infra/prisma";
import { IMemberRepository } from "../domain/member.repository";
import {
  OrganizationMember,
  OrganizationInvitation,
} from "../domain/member.entity";
import { ROLE_PERMISSIONS } from "../domain/permissions";

export class PrismaMemberRepository implements IMemberRepository {
  async addMember(data: {
    organizationId: string;
    userId: string;
    roleId: string;
    status: any;
  }): Promise<OrganizationMember> {
    return (await prisma.organizationMember.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        roleId: data.roleId,
        status: data.status as any,
        joinedAt: new Date(),
      },
      include: { role: true },
    })) as unknown as OrganizationMember;
  }

  async findMember(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMember | null> {
    return (await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      include: { role: true },
    })) as unknown as OrganizationMember | null;
  }

  async listMembers(organizationId: string): Promise<OrganizationMember[]> {
    return (await prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        role: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })) as unknown as OrganizationMember[];
  }

  async updateMember(
    organizationId: string,
    userId: string,
    data: Partial<OrganizationMember>,
  ): Promise<OrganizationMember> {
    const updateData: any = { ...data };
    if (data.roleId) updateData.roleId = data.roleId;
    if (data.status) updateData.status = data.status as any;
    delete updateData.role; // don't try to update the relation object

    return (await prisma.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      data: updateData,
      include: { role: true },
    })) as unknown as OrganizationMember;
  }

  async removeMember(organizationId: string, userId: string): Promise<void> {
    await prisma.organizationMember.delete({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });
  }

  async createInvitation(data: {
    organizationId: string;
    inviterId: string;
    email: string;
    roleId: string;
    token: string;
    expiresAt: Date;
  }): Promise<OrganizationInvitation> {
    return (await prisma.organizationInvitation.create({
      data: {
        organizationId: data.organizationId,
        inviterId: data.inviterId,
        email: data.email,
        roleId: data.roleId,
        token: data.token,
        expiresAt: data.expiresAt,
      },
      include: { role: true },
    })) as unknown as OrganizationInvitation;
  }

  async findInvitationByToken(
    token: string,
  ): Promise<OrganizationInvitation | null> {
    return (await prisma.organizationInvitation.findUnique({
      where: { token },
      include: { role: true },
    })) as unknown as OrganizationInvitation | null;
  }

  async updateInvitation(
    id: string,
    data: Partial<OrganizationInvitation>,
  ): Promise<OrganizationInvitation> {
    const updateData: any = { ...data };
    if (data.roleId) updateData.roleId = data.roleId;
    delete updateData.role; // don't update relation object

    return (await prisma.organizationInvitation.update({
      where: { id },
      data: updateData,
      include: { role: true },
    })) as unknown as OrganizationInvitation;
  }

  async listInvitations(organizationId: string): Promise<OrganizationInvitation[]> {
    return (await prisma.organizationInvitation.findMany({
      where: { 
        organizationId,
        acceptedAt: null,
        expiresAt: {
          gt: new Date()
        }
      },
      include: { role: true },
    })) as unknown as OrganizationInvitation[];
  }

  async createDefaultRoles(organizationId: string): Promise<Record<string, string>> {
    const roles = ['owner', 'admin', 'team_lead', 'member'];
    const roleIds: Record<string, string> = {};

    for (const roleName of roles) {
      const role = await prisma.role.create({
        data: {
          organizationId,
          name: roleName,
          permissions: ROLE_PERMISSIONS[roleName] || [],
          isDefault: true,
        }
      });
      roleIds[roleName] = role.id;
    }

    return roleIds;
  }

  async deleteInvitation(id: string): Promise<void> {
    await prisma.organizationInvitation.delete({
      where: { id },
    });
  }
}
