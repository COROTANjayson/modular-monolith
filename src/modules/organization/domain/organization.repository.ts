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
}
