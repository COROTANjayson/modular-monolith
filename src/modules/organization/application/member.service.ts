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
import { OrganizationPermission, hasPermission } from "../domain/permissions";
import { AppError } from "../../../shared/utils/app-error";
import { ERROR_CODES } from "../../../shared/utils/response-code";
import { v4 as uuidv4 } from "uuid";

export class MemberService {
  constructor(
    private organizationRepository: IOrganizationRepository,
    private userRepository: IUserRepository,
  ) {}

  private async ensureHasPermission(
    organizationId: string,
    userId: string,
    permission: OrganizationPermission,
  ): Promise<OrganizationRole> {
    const member = await this.organizationRepository.findMember(
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

  async inviteUser(
    organizationId: string,
    data: InviteUserDto,
    inviterId: string,
  ): Promise<OrganizationInvitation> {
    await this.ensureHasPermission(
      organizationId,
      inviterId,
      OrganizationPermission.MEMBER_INVITE,
    );

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

  async listMembers(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMember[]> {
    await this.ensureHasPermission(
      organizationId,
      userId,
      OrganizationPermission.MEMBER_LIST,
    );
    return this.organizationRepository.listMembers(organizationId);
  }

  async updateMemberRole(
    organizationId: string,
    targetUserId: string,
    data: UpdateMemberRoleDto,
    currentUserId: string,
  ): Promise<OrganizationMember> {
    const currentUserRole = await this.ensureHasPermission(
      organizationId,
      currentUserId,
      OrganizationPermission.MEMBER_UPDATE_ROLE,
    );

    const targetMember = await this.organizationRepository.findMember(
      organizationId,
      targetUserId,
    );
    if (!targetMember) {
      throw new AppError("Member not found", 404, ERROR_CODES.NOT_FOUND);
    }

    // Protection logic for Owner remains as business rules
    if (
      targetMember.role === OrganizationRole.OWNER &&
      currentUserRole === OrganizationRole.ADMIN
    ) {
      throw new AppError(
        "Only organization owners can modify their own role",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }

    if (
      targetMember.role === OrganizationRole.OWNER &&
      targetUserId !== currentUserId
    ) {
      throw new AppError("Cannot change role of organization owner", 400);
    }

    if (data.role === OrganizationRole.OWNER) {
      throw new AppError(
        "An organization can only have one owner",
        400,
        ERROR_CODES.BAD_REQUEST,
      );
    }

    return this.organizationRepository.updateMember(
      organizationId,
      targetUserId,
      {
        role: data.role,
      },
    );
  }

  async removeMember(
    organizationId: string,
    targetUserId: string,
    currentUserId: string,
  ): Promise<void> {
    const currentUserRole = await this.ensureHasPermission(
      organizationId,
      currentUserId,
      OrganizationPermission.MEMBER_REMOVE,
    );

    const targetMember = await this.organizationRepository.findMember(
      organizationId,
      targetUserId,
    );
    if (!targetMember) {
      throw new AppError("Member not found", 404, ERROR_CODES.NOT_FOUND);
    }

    // Protection logic for Owner
    if (
      targetMember.role === OrganizationRole.OWNER &&
      currentUserRole !== OrganizationRole.OWNER
    ) {
      throw new AppError(
        "Only owners can remove other owners (if multiple existed), and the primary owner cannot be removed.",
        403,
        ERROR_CODES.FORBIDDEN,
      );
    }

    if (targetMember.role === OrganizationRole.OWNER) {
      throw new AppError(
        "The organization owner cannot be removed",
        400,
        ERROR_CODES.BAD_REQUEST,
      );
    }

    await this.organizationRepository.removeMember(
      organizationId,
      targetUserId,
    );
  }
}
