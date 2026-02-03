/**
 * Infrastructure Layer - Prisma Member Repository
 */

import { prisma } from "../../../shared/infra/prisma";
import { IMemberRepository } from "../domain/member.repository";
import {
  OrganizationMember,
  OrganizationInvitation,
  OrganizationRole,
} from "../domain/member.entity";

export class PrismaMemberRepository implements IMemberRepository {
  async addMember(data: {
    organizationId: string;
    userId: string;
    role: OrganizationRole;
    status: any;
  }): Promise<OrganizationMember> {
    return (await prisma.organizationMember.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId,
        role: data.role as any,
        status: data.status as any,
        joinedAt: new Date(),
      },
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
    })) as unknown as OrganizationMember | null;
  }

  async listMembers(organizationId: string): Promise<OrganizationMember[]> {
    return (await prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
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
    if (data.role) updateData.role = data.role as any;
    if (data.status) updateData.status = data.status as any;

    return (await prisma.organizationMember.update({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
      data: updateData,
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
    role: OrganizationRole;
    token: string;
    expiresAt: Date;
  }): Promise<OrganizationInvitation> {
    return (await prisma.organizationInvitation.create({
      data: {
        organizationId: data.organizationId,
        inviterId: data.inviterId,
        email: data.email,
        role: data.role as any,
        token: data.token,
        expiresAt: data.expiresAt,
      },
    })) as unknown as OrganizationInvitation;
  }

  async findInvitationByToken(
    token: string,
  ): Promise<OrganizationInvitation | null> {
    return (await prisma.organizationInvitation.findUnique({
      where: { token },
    })) as unknown as OrganizationInvitation | null;
  }

  async updateInvitation(
    id: string,
    data: Partial<OrganizationInvitation>,
  ): Promise<OrganizationInvitation> {
    const updateData: any = { ...data };
    if (data.role) updateData.role = data.role as any;

    return (await prisma.organizationInvitation.update({
      where: { id },
      data: updateData,
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
    })) as unknown as OrganizationInvitation[];
  }
}
