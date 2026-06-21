/**
 * Domain Layer - Organization Repository Port
 */

import { Organization } from "./organization.entity";

export interface IOrganizationRepository {
  create(data: {
    name: string;
    slug: string;
    ownerId: string;
  }): Promise<Organization>;
  findById(id: string): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  findAllByUserId(userId: string): Promise<Organization[]>;
  update(id: string, data: Partial<Organization>): Promise<Organization>;
  getRoles(organizationId: string): Promise<{ id: string; name: string; isDefault: boolean; permissions: string[] }[]>;
  findRole(id: string, organizationId: string): Promise<{ id: string; name: string; isDefault: boolean; permissions: string[] } | null>;
  createRole(organizationId: string, name: string, permissions: string[]): Promise<{ id: string; name: string; isDefault: boolean; permissions: string[] }>;
  updateRole(id: string, organizationId: string, data: { name?: string; permissions?: string[] }): Promise<{ id: string; name: string; isDefault: boolean; permissions: string[] }>;
  deleteRole(id: string, organizationId: string): Promise<void>;
}
