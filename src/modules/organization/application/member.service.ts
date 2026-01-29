/**
 * Application Layer - Member Service
 */

import { IOrganizationRepository } from "../domain/ports";
import { IUserRepository } from "../../user/application/ports";
import { InviteUserDto, UpdateMemberRoleDto } from "./organization.dto";
import {
  OrganizationMember,
  OrganizationInvitation,
  OrganizationRole,
  OrganizationMemberStatus,
} from "../domain/organization.entity";
import { AppError } from "../../../shared/utils/app-error";
import { ERROR_CODES } from "../../../shared/utils/response-code";
import { v4 as uuidv4 } from "uuid";

export class MemberService {
  constructor(
    private organizationRepository: IOrganizationRepository,
    private userRepository: IUserRepository,
  ) {}

  async inviteUser(
    organizationId: string,
    data: InviteUserDto,
    inviterId: string,
  ): Promise<OrganizationInvitation> {
    const organization =
      await this.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new AppError(
        "Organization not found",
        404,
        ERROR_CODES.ORG_NOT_FOUND,
      );
    }

    if (data.role === OrganizationRole.OWNER) {
      throw new AppError(
        "An organization can only have one owner",
        400,
        ERROR_CODES.BAD_REQUEST,
      );
    }

    const userToInvite = await this.userRepository.findByEmail(data.email);
    if (userToInvite) {
      const existingMember = await this.organizationRepository.findMember(
        organizationId,
        userToInvite.id,
      );
      if (existingMember) {
        throw new AppError(
          "User is already a member of this organization",
          400,
          ERROR_CODES.ORG_ALREADY_MEMBER,
        );
      }
    }

    const token = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

    return this.organizationRepository.createInvitation({
      organizationId,
      inviterId,
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
      throw new AppError(
        "Invalid or expired invitation token",
        400,
        ERROR_CODES.ORG_INVITATION_INVALID,
      );
    }

    if (invitation.inviterId === userId) {
      throw new AppError(
        "You cannot accept an invitation you sent yourself",
        400,
        ERROR_CODES.ORG_INVITATION_INVALID,
      );
    }

    const user = await this.userRepository.findById(userId);
    if (!user || user.email !== invitation.email) {
      throw new AppError(
        "This invitation was sent to a different email address",
        400,
        ERROR_CODES.ORG_INVITATION_INVALID,
      );
    }

    if (invitation.acceptedAt) {
      throw new AppError(
        "Invitation already accepted",
        400,
        ERROR_CODES.ORG_ALREADY_MEMBER,
      );
    }

    if (invitation.expiresAt < new Date()) {
      throw new AppError(
        "Invitation expired",
        400,
        ERROR_CODES.ORG_INVITATION_EXPIRED,
      );
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
    const organization =
      await this.organizationRepository.findById(organizationId);
    if (!organization) {
      throw new AppError(
        "Organization not found",
        404,
        ERROR_CODES.ORG_NOT_FOUND,
      );
    }
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
      throw new AppError("Member not found", 404, ERROR_CODES.NOT_FOUND);
    }

    if (member.role === OrganizationRole.OWNER) {
      throw new AppError("Cannot change role of organization owner", 400);
    }

    // Rule: only one owner (cannot update someone to owner)
    if (data.role === OrganizationRole.OWNER) {
      throw new AppError(
        "An organization can only have one owner",
        400,
        ERROR_CODES.BAD_REQUEST,
      );
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
      throw new AppError("Member not found", 404, ERROR_CODES.NOT_FOUND);
    }

    if (member.role === OrganizationRole.OWNER) {
      throw new AppError("Cannot remove organization owner", 400);
    }

    await this.organizationRepository.removeMember(organizationId, userId);
  }
}
