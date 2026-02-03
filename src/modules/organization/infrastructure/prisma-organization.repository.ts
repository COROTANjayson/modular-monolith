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
}
