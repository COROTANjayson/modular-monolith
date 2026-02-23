/**
 * Application Layer - Chat Service
 */

import { IChatMessageRepository } from "../domain/chat-message.repository";
import { ChatMessage } from "../domain/chat-message.entity";
import { ITeamRepository } from "../../organization/domain/team.repository";
import { AppError } from "../../../shared/utils/app-error";
import { ERROR_CODES } from "../../../shared/utils/response-code";
import { eventBus } from "../../../shared/infra/event-bus";

export class ChatService {
  constructor(
    private chatMessageRepo: IChatMessageRepository,
    private teamRepo: ITeamRepository
  ) {}

  /**
   * Verify the user is a member of the team (or the leader).
   */
  private async ensureTeamMember(
    teamId: string,
    userId: string
  ): Promise<void> {
    const team = await this.teamRepo.findById(teamId);
    if (!team) {
      throw new AppError("Team not found", 404, ERROR_CODES.NOT_FOUND);
    }

    // Leaders are implicitly members
    if (team.leaderId === userId) return;

    const member = await this.teamRepo.findMember(teamId, userId);
    if (!member) {
      throw new AppError(
        "You are not a member of this team",
        403,
        ERROR_CODES.FORBIDDEN
      );
    }
  }

  /**
   * Send a message to a team chat.
   */
  async sendMessage(
    teamId: string,
    senderId: string,
    content: string
  ): Promise<ChatMessage> {
    await this.ensureTeamMember(teamId, senderId);

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
    teamId: string,
    userId: string,
    cursor?: string,
    limit?: number
  ): Promise<ChatMessage[]> {
    await this.ensureTeamMember(teamId, userId);

    return await this.chatMessageRepo.findByTeamId(teamId, {
      cursor,
      limit: limit ?? 50,
    });
  }
}
