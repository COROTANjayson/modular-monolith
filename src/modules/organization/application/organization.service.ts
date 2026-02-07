/**
 * Application Layer - Organization Service
 */

import { IOrganizationRepository } from "../domain/organization.repository";
import { IMemberRepository } from "../domain/member.repository";
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
} from "./organization.dto";
import {
  Organization,
} from "../domain/organization.entity";
import {
  OrganizationRole,
  OrganizationMemberStatus,
} from "../domain/member.entity";
import { OrganizationPermission, hasPermission } from "../domain/permissions";
import { AppError } from "../../../shared/utils/app-error";
import { ERROR_CODES } from "../../../shared/utils/response-code";
import { ORG_ERROR_CODES } from "../interface/organization.response-codes";

export class OrganizationService {
  constructor(
    private organizationRepository: IOrganizationRepository,
    private memberRepository: IMemberRepository,
  ) {}

  private async ensureHasPermission(
    organizationId: string,
    userId: string,
    permission: OrganizationPermission,
  ): Promise<OrganizationRole> {
    const member = await this.memberRepository.findMember(
      organizationId,
      userId,
    );
    if (!member) {
      throw new AppError(
        "You are not a member of this organization",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }

    if (!hasPermission(member.role, permission)) {
      throw new AppError(
        "You do not have permission to perform this action",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }

    return member.role;
  }

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
    await this.memberRepository.addMember({
      organizationId: organization.id,
      userId: ownerId,
      role: OrganizationRole.OWNER,
      status: OrganizationMemberStatus.ACTIVE,
    });

    return organization;
  }

  async getOrganization(id: string, userId: string): Promise<Organization> {
    await this.ensureHasPermission(id, userId, OrganizationPermission.ORG_READ);

    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new AppError(
        "Organization not found",
        404,
        ORG_ERROR_CODES.ORG_NOT_FOUND,
      );
    }
    return organization;
  }

  async getUserOrganizations(userId: string): Promise<Organization[]> {
    return this.organizationRepository.findAllByUserId(userId);
  }

  async updateOrganization(
    id: string,
    data: UpdateOrganizationDto,
    userId: string,
  ): Promise<Organization> {
    await this.ensureHasPermission(
      id,
      userId,
      OrganizationPermission.ORG_UPDATE,
    );

    const organization = await this.organizationRepository.findById(id);
    if (!organization) {
      throw new AppError(
        "Organization not found",
        404,
        ORG_ERROR_CODES.ORG_NOT_FOUND,
      );
    }

    return this.organizationRepository.update(id, data);
  }
}
