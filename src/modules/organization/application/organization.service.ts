/**
 * Application Layer - Organization Service
 */

import { IOrganizationRepository } from "../domain/ports";
import {
  CreateOrganizationDto,
  UpdateOrganizationDto,
  InviteUserDto,
  UpdateMemberRoleDto,
} from "./organization.dto";
import {
  Organization,
  OrganizationMember,
  OrganizationInvitation,
  OrganizationRole,
  OrganizationMemberStatus,
} from "../domain/organization.entity";
import { AppError } from "../../../shared/utils/app-error";
import { v4 as uuidv4 } from "uuid";

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

  async inviteUser(
    organizationId: string,
    data: InviteUserDto,
  ): Promise<OrganizationInvitation> {
    const organization = await this.getOrganization(organizationId);

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    return this.organizationRepository.createInvitation({
      organizationId,
      email: data.email,
      role: data.role,
      token,
      expiresAt,
    });
  }

  async acceptInvitation(token: string, userId: string): Promise<void> {
    const invitation =
      await this.organizationRepository.findInvitationByToken(token);

    if (!invitation) {
      throw new AppError("Invalid or expired invitation token", 400);
    }

    if (invitation.acceptedAt) {
      throw new AppError("Invitation already accepted", 400);
    }

    if (invitation.expiresAt < new Date()) {
      throw new AppError("Invitation expired", 400);
    }

    // Mark invitation as accepted
    await this.organizationRepository.updateInvitation(invitation.id, {
      acceptedAt: new Date(),
    });

    // Add member
    await this.organizationRepository.addMember({
      organizationId: invitation.organizationId,
      userId,
      role: invitation.role,
      status: OrganizationMemberStatus.ACTIVE,
    });
  }

  async listMembers(organizationId: string): Promise<OrganizationMember[]> {
    await this.getOrganization(organizationId);
    return this.organizationRepository.listMembers(organizationId);
  }

  async updateMemberRole(
    organizationId: string,
    userId: string,
    data: UpdateMemberRoleDto,
  ): Promise<OrganizationMember> {
    const member = await this.organizationRepository.findMember(
      organizationId,
      userId,
    );
    if (!member) {
      throw new AppError("Member not found", 404);
    }

    if (member.role === OrganizationRole.OWNER) {
      throw new AppError("Cannot change role of organization owner", 400);
    }

    return this.organizationRepository.updateMember(organizationId, userId, {
      role: data.role,
    });
  }

  async removeMember(organizationId: string, userId: string): Promise<void> {
    const member = await this.organizationRepository.findMember(
      organizationId,
      userId,
    );
    if (!member) {
      throw new AppError("Member not found", 404);
    }

    if (member.role === OrganizationRole.OWNER) {
      throw new AppError("Cannot remove organization owner", 400);
    }

    await this.organizationRepository.removeMember(organizationId, userId);
  }
}
