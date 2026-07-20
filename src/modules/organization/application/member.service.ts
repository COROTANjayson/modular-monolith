/**
 * Application Layer - Member Service
 */

import { IOrganizationRepository } from "../domain/organization.repository";
import { IMemberRepository } from "../domain/member.repository";
import { IUserRepository } from "../../user/domain/user.repository";
import { InviteUserDto, UpdateMemberRoleDto } from "./organization.dto";
import {
  OrganizationMember,
  OrganizationInvitation,
  OrganizationMemberStatus,
  DefaultRoleNames,
} from "../domain/member.entity";
import { AppError } from "../../../shared/utils/app-error";
import { ERROR_CODES } from "../../../shared/utils/response-code";
import { ORG_ERROR_CODES } from "../interface/organization.response-codes";
import { v4 as uuidv4 } from "uuid";
import { eventBus } from "../../../shared/infra/event-bus";

export class MemberService {
  constructor(
    private organizationRepository: IOrganizationRepository,
    private memberRepository: IMemberRepository,
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
        ORG_ERROR_CODES.ORG_NOT_FOUND,
      );
    }

    const invitationRole = await this.organizationRepository.findRole(
      data.roleId,
      organizationId,
    );
    if (!invitationRole) {
      throw new AppError(
        "Role not found in this organization",
        400,
        ERROR_CODES.BAD_REQUEST,
      );
    }

    if (invitationRole.name === DefaultRoleNames.OWNER) {
      throw new AppError(
        "An organization can only have one owner",
        400,
        ERROR_CODES.BAD_REQUEST,
      );
    }

    const userToInvite = await this.userRepository.findByEmail(data.email);
    if (userToInvite) {
      const existingMember = await this.memberRepository.findMember(
        organizationId,
        userToInvite.id,
      );
      if (existingMember) {
        throw new AppError(
          "User is already a member of this organization",
          400,
          ORG_ERROR_CODES.ORG_ALREADY_MEMBER,
        );
      }
    }

    const token = uuidv4();
    const expiresAt = new Date();
    // expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry
    expiresAt.setDate(expiresAt.getDate() + 1); // 1 days expiry


    const invitation = await this.memberRepository.createInvitation({
      organizationId,
      inviterId,
      email: data.email,
      roleId: data.roleId,
      token,
      expiresAt,
    });

    // Emit invitation event
    eventBus.emit("member.invited", {
      organizationId,
      organizationName: organization.name,
      inviterId,
      email: data.email,
      roleId: data.roleId,
      targetUserId: userToInvite?.id,
      token,
      inviteUrl: `${process.env.CLIENT_URL}/invites/accept?token=${token}`,
    });

    return invitation;
  }

  async acceptInvitation(token: string, userId: string): Promise<void> {
    const invitation =
      await this.memberRepository.findInvitationByToken(token);

    if (!invitation) {
      throw new AppError(
        "Invalid or expired invitation token",
        400,
        ORG_ERROR_CODES.ORG_INVITATION_INVALID,
      );
    }

    if (invitation.inviterId === userId) {
      throw new AppError(
        "You cannot accept an invitation you sent yourself",
        400,
        ORG_ERROR_CODES.ORG_INVITATION_INVALID,
      );
    }

    const user = await this.userRepository.findById(userId);
    if (!user || user.email !== invitation.email) {
      throw new AppError(
        "This invitation was sent to a different email address",
        400,
        ORG_ERROR_CODES.ORG_INVITATION_INVALID,
      );
    }
    
    // Check if user is already a member
    const existingMember = await this.memberRepository.findMember(
      invitation.organizationId,
      userId,
    );
    if (existingMember) {
        throw new AppError(
            "User is already a member of this organization",
            400,
            ORG_ERROR_CODES.ORG_ALREADY_MEMBER,
        );
    }

    if (invitation.acceptedAt) {
      throw new AppError(
        "Invitation already accepted",
        400,
        ORG_ERROR_CODES.ORG_ALREADY_MEMBER,
      );
    }

    if (invitation.expiresAt < new Date()) {
      throw new AppError(
        "Invitation expired",
        400,
        ORG_ERROR_CODES.ORG_INVITATION_EXPIRED,
      );
    }

    // Mark invitation as accepted
    await this.memberRepository.updateInvitation(invitation.id, {
      acceptedAt: new Date(),
    });

    // Add member
    await this.memberRepository.addMember({
      organizationId: invitation.organizationId,
      userId,
      roleId: invitation.roleId,
      status: OrganizationMemberStatus.ACTIVE,
    });
  }

  async getInvitationByToken(
    token: string,
    userId?: string,
  ): Promise<{
    invitation: OrganizationInvitation;
    organization: { name: string };
    inviter: { name: string; email: string };
    isExistingMember: boolean;
  }> {
    const invitation =
      await this.memberRepository.findInvitationByToken(token);

    if (!invitation) {
      throw new AppError(
        "Invalid or expired invitation token",
        404,
        ORG_ERROR_CODES.ORG_INVITATION_INVALID,
      );
    }

    if (invitation.expiresAt < new Date()) {
      throw new AppError(
        "Invitation expired",
        400,
        ORG_ERROR_CODES.ORG_INVITATION_EXPIRED,
      );
    }

    const organization =
      await this.organizationRepository.findById(invitation.organizationId);

    if (!organization) {
      throw new AppError(
        "Organization not found",
        404,
        ORG_ERROR_CODES.ORG_NOT_FOUND,
      );
    }

    const inviter = await this.userRepository.findById(invitation.inviterId);

    let isExistingMember = false;
    if (userId) {
        const member = await this.memberRepository.findMember(invitation.organizationId, userId);
        if (member) {
            isExistingMember = true;
        }
    }

    return {
      invitation,
      organization: { name: organization.name },
      inviter: {
        name: inviter ? `${inviter.firstName} ${inviter.lastName}` : "Unknown",
        email: inviter ? inviter.email : "",
      },
      isExistingMember,
    };
  }

  async listMembers(organizationId: string): Promise<OrganizationMember[]> {
    return this.memberRepository.listMembers(organizationId);
  }

  async getCurrentMember(
    organizationId: string,
    userId: string,
  ): Promise<OrganizationMember> {
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
    return member;
  }

  async listInvitations(
    organizationId: string,
  ): Promise<OrganizationInvitation[]> {
    return this.memberRepository.listInvitations(organizationId);
  }

  async updateMemberRole(
    organizationId: string,
    targetUserId: string,
    data: UpdateMemberRoleDto,
    currentUserId: string,
  ): Promise<OrganizationMember> {
    const targetMember = await this.memberRepository.findMember(
      organizationId,
      targetUserId,
    );
    if (!targetMember) {
      throw new AppError("Member not found", 404, ERROR_CODES.NOT_FOUND);
    }

    if (
      targetMember.role?.name === DefaultRoleNames.OWNER &&
      targetUserId !== currentUserId
    ) {
      throw new AppError("Cannot change role of organization owner", 400);
    }

    const nextRole = await this.organizationRepository.findRole(
      data.roleId,
      organizationId,
    );
    if (!nextRole) {
      throw new AppError(
        "Role not found in this organization",
        400,
        ERROR_CODES.BAD_REQUEST,
      );
    }

    if (nextRole.name === DefaultRoleNames.OWNER) {
      throw new AppError(
        "An organization can only have one owner",
        400,
        ERROR_CODES.BAD_REQUEST,
      );
    }

    return this.memberRepository.updateMember(
      organizationId,
      targetUserId,
      {
        roleId: data.roleId,
      },
    );
  }

  async removeMember(
    organizationId: string,
    targetUserId: string,
  ): Promise<void> {
    const targetMember = await this.memberRepository.findMember(
      organizationId,
      targetUserId,
    );
    if (!targetMember) {
      throw new AppError("Member not found", 404, ERROR_CODES.NOT_FOUND);
    }

    if (targetMember.role?.name === DefaultRoleNames.OWNER) {
      throw new AppError(
        "The organization owner cannot be removed",
        400,
        ERROR_CODES.BAD_REQUEST,
      );
    }

    await this.memberRepository.removeMember(
      organizationId,
      targetUserId,
    );
  }

  async revokeInvitation(
    organizationId: string,
    invitationId: string,
  ): Promise<void> {
    const invitations = await this.memberRepository.listInvitations(organizationId);
    const invitation = invitations.find(i => i.id === invitationId);

    if (!invitation) {
      throw new AppError("Invitation not found", 404, ERROR_CODES.NOT_FOUND);
    }

    await this.memberRepository.deleteInvitation(invitationId);
  }

  async updateMemberStatus(
    organizationId: string,
    targetUserId: string,
    status: OrganizationMemberStatus,
  ): Promise<OrganizationMember> {
    const targetMember = await this.memberRepository.findMember(
      organizationId,
      targetUserId,
    );
    if (!targetMember) {
      throw new AppError("Member not found", 404, ERROR_CODES.NOT_FOUND);
    }

    // Protection for Owner
    if (targetMember.role?.name === DefaultRoleNames.OWNER) {
      throw new AppError(
        "Cannot change status of organization owner",
        400,
        ERROR_CODES.BAD_REQUEST,
      );
    }

    return this.memberRepository.updateMember(
      organizationId,
      targetUserId,
      { status },
    );
  }
}
