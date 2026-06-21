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
  OrganizationMemberStatus,
  DefaultRoleNames,
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
  ): Promise<string | undefined> {
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

    if (member.role?.name !== DefaultRoleNames.OWNER && !member.role?.permissions?.includes(permission)) {
      throw new AppError(
        "You do not have permission to perform this action",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }

    return member.role?.name;
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

    // Create default roles
    const roleIds = await this.memberRepository.createDefaultRoles(organization.id);

    // Add owner as active member
    await this.memberRepository.addMember({
      organizationId: organization.id,
      userId: ownerId,
      roleId: roleIds[DefaultRoleNames.OWNER],
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

  async getOrganizationRoles(id: string, userId: string): Promise<{ id: string; name: string; isDefault: boolean; permissions: string[] }[]> {
    await this.ensureHasPermission(id, userId, OrganizationPermission.ROLE_READ);
    return this.organizationRepository.getRoles(id);
  }

  async createRole(organizationId: string, userId: string, name: string, permissions: string[]): Promise<{ id: string; name: string; isDefault: boolean; permissions: string[] }> {
    await this.ensureHasPermission(organizationId, userId, OrganizationPermission.ROLE_CREATE);
    return this.organizationRepository.createRole(organizationId, name, permissions);
  }

  async updateRole(id: string, organizationId: string, userId: string, data: { name?: string; permissions?: string[] }): Promise<{ id: string; name: string; isDefault: boolean; permissions: string[] }> {
    await this.ensureHasPermission(organizationId, userId, OrganizationPermission.ROLE_UPDATE);

    const role = await this.organizationRepository.findRole(id, organizationId);
    if (!role) {
      throw new AppError("Role not found", 404, ORG_ERROR_CODES.ORG_NOT_FOUND); // Can create a ROLE_NOT_FOUND
    }

    if (role.name === DefaultRoleNames.OWNER) {
      throw new AppError("Cannot update the owner role", 400, ERROR_CODES.BAD_REQUEST);
    }

    return this.organizationRepository.updateRole(id, organizationId, data);
  }

  async deleteRole(id: string, organizationId: string, userId: string): Promise<void> {
    await this.ensureHasPermission(organizationId, userId, OrganizationPermission.ROLE_DELETE);

    const role = await this.organizationRepository.findRole(id, organizationId);
    if (!role) {
      throw new AppError("Role not found", 404, ORG_ERROR_CODES.ORG_NOT_FOUND);
    }

    if (role.isDefault) {
      throw new AppError("Cannot delete default roles", 400, ERROR_CODES.BAD_REQUEST);
    }

    await this.organizationRepository.deleteRole(id, organizationId);
  }
}
