/**
 * Application Layer - Organization Service
 */

import { IOrganizationRepository } from "../domain/ports";
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from "./organization.dto";
import {
  Organization,
  OrganizationRole,
  OrganizationMemberStatus,
} from "../domain/organization.entity";
import { AppError } from "../../../shared/utils/app-error";

export class OrganizationService {
  constructor(private organizationRepository: IOrganizationRepository) {}

  async createOrganization(
    ownerId: string,
    data: CreateOrganizationDto,
  ): Promise<Organization> {
    const slug = data.name.toLowerCase().replace(/ /g, "-") + "-" + Date.now();
    const organization = await this.organizationRepository.create({
      name: data.name,
      slug,
      ownerId,
    });

    // Add owner as active member
    await this.organizationRepository.addMember({
      organizationId: organization.id,
      userId: ownerId,
      role: OrganizationRole.OWNER,
      status: OrganizationMemberStatus.ACTIVE,
    });

    return organization;
  }

  async getOrganization(id: string): Promise<Organization> {
    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new AppError("Organization not found", 404);
    }
    return organization;
  }

  async updateOrganization(
    id: string,
    data: UpdateOrganizationDto,
  ): Promise<Organization> {
    const organization = await this.getOrganization(id);
    return this.organizationRepository.update(id, data);
  }
}
