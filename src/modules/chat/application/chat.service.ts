/**
 * Application Layer - Chat Service
 */

import { IChatMessageRepository } from "../domain/chat-message.repository";
import { ChatMessage } from "../domain/chat-message.entity";
import { IOrganizationAuthorization } from "../../organization/public/organization-authorization";
import { AppError } from "../../../shared/utils/app-error";
import { ERROR_CODES } from "../../../shared/utils/response-code";
import { eventBus } from "../../../shared/infra/event-bus";

export class ChatService {
  constructor(
    private chatMessageRepo: IChatMessageRepository,
    private organizationAuthorization: IOrganizationAuthorization,
  ) {}

  /**
   * Verify the user is a member of the team (or the leader).
   */
  private async ensureTeamMember(
    organizationId: string,
    teamId: string,
    userId: string
  ): Promise<void> {
    const allowed = await this.organizationAuthorization.hasTeamAccess(
      organizationId,
      teamId,
      userId,
      "chat",
    );
    if (!allowed) {
      throw new AppError(
        "You are not authorized to access this team chat",
        403,
        ERROR_CODES.FORBIDDEN
      );
    }
  }

  /**
   * Send a message to a team chat.
   */
  async sendMessage(
    organizationId: string,
    teamId: string,
    senderId: string,
    content: string
  ): Promise<ChatMessage> {
    await this.ensureTeamMember(organizationId, teamId, senderId);

    const message = await this.chatMessageRepo.create({
      teamId,
      senderId,
      content,
    });

    // Emit event for real-time delivery
    eventBus.emit("chat.message_sent", {
      id: message.id,
      teamId: message.teamId,
      senderId: message.senderId,
      content: message.content,
      createdAt: message.createdAt,
      sender: message.sender,
    });

    return message;
  }

  /**
   * Get paginated message history for a team.
   */
  async getMessages(
    organizationId: string,
    teamId: string,
    userId: string,
    cursor?: string,
    limit?: number
  ): Promise<ChatMessage[]> {
    await this.ensureTeamMember(organizationId, teamId, userId);

    return await this.chatMessageRepo.findByTeamId(teamId, {
      cursor,
      limit: limit ?? 50,
    });
  }
}
