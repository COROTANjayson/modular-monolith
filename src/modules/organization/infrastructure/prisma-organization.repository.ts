/**
 * Infrastructure Layer - Prisma Organization Repository
 */

import { prisma } from "../../../shared/infra/prisma";
import { IOrganizationRepository } from "../domain/ports";
import {
  Organization,
  OrganizationMember,
  OrganizationInvitation,
  OrganizationRole,
} from "../domain/organization.entity";

export class PrismaOrganizationRepository implements IOrganizationRepository {
  async create(data: {
    name: string;
    slug: string;
    ownerId: string;
  }): Promise<Organization> {
    return (await prisma.organization.create({
      data,
    })) as unknown as Organization;
  }

  async findById(id: string): Promise<Organization | null> {
    return (await prisma.organization.findUnique({
      where: { id },
    })) as unknown as Organization | null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    return (await prisma.organization.findUnique({
      where: { slug },
    })) as unknown as Organization | null;
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    return (await prisma.organization.update({
      where: { id },
      data,
    })) as unknown as Organization;
  }

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
    })) as unknown as OrganizationMember[];
  }

  async updateMember(
    organizationId: string,
    userId: string,
    data: Partial<OrganizationMember>,
  ): Promise<OrganizationMember> {
    // Role and Status need to be casted to Prisma's enums
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
    email: string;
    role: OrganizationRole;
    token: string;
    expiresAt: Date;
  }): Promise<OrganizationInvitation> {
    return (await prisma.organizationInvitation.create({
      data: {
        organizationId: data.organizationId,
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
}
