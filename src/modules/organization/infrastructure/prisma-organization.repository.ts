/**
 * Infrastructure Layer - Prisma Organization Repository
 */

import { prisma } from "../../../shared/infra/prisma";
import { IOrganizationRepository } from "../domain/organization.repository";
import { Organization } from "../domain/organization.entity";

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

  async findAllByUserId(userId: string): Promise<Organization[]> {
    return (await prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
    })) as unknown as Organization[];
  }

  async update(id: string, data: Partial<Organization>): Promise<Organization> {
    return (await prisma.organization.update({
      where: { id },
      data,
    })) as unknown as Organization;
  }

  async getRoles(organizationId: string): Promise<{ id: string; name: string; isDefault: boolean; permissions: string[] }[]> {
    return await prisma.role.findMany({
      where: { organizationId },
      select: { id: true, name: true, isDefault: true, permissions: true },
      orderBy: { createdAt: 'asc' }
    });
  }

  async findRole(id: string, organizationId: string): Promise<{ id: string; name: string; isDefault: boolean; permissions: string[] } | null> {
    return await prisma.role.findFirst({
      where: { id, organizationId },
      select: { id: true, name: true, isDefault: true, permissions: true }
    });
  }

  async createRole(organizationId: string, name: string, permissions: string[]): Promise<{ id: string; name: string; isDefault: boolean; permissions: string[] }> {
    return await prisma.role.create({
      data: {
        organizationId,
        name,
        permissions,
        isDefault: false
      },
      select: { id: true, name: true, isDefault: true, permissions: true }
    });
  }

  async updateRole(id: string, organizationId: string, data: { name?: string; permissions?: string[] }): Promise<{ id: string; name: string; isDefault: boolean; permissions: string[] }> {
    return await prisma.role.update({
      where: { id },
      data,
      select: { id: true, name: true, isDefault: true, permissions: true }
    });
  }

  async deleteRole(id: string, organizationId: string): Promise<void> {
    await prisma.role.deleteMany({
      where: { id, organizationId }
    });
  }
}
