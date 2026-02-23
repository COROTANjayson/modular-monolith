import { prisma } from "../../../shared/infra/prisma";
import {
  ChatMessage,
  ChatMessageCreateData,
} from "../domain/chat-message.entity";
import { IChatMessageRepository } from "../domain/chat-message.repository";

const SENDER_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  avatar: true,
};

export class PrismaChatMessageRepository implements IChatMessageRepository {
  async create(data: ChatMessageCreateData): Promise<ChatMessage> {
    return await prisma.chatMessage.create({
      data: {
        teamId: data.teamId,
        senderId: data.senderId,
        content: data.content,
      },
      include: {
        sender: { select: SENDER_SELECT },
      },
    });
  }

  async findByTeamId(
    teamId: string,
    options?: { cursor?: string; limit?: number }
  ): Promise<ChatMessage[]> {
    const limit = options?.limit ?? 50;

    return await prisma.chatMessage.findMany({
      where: { teamId },
      include: {
        sender: { select: SENDER_SELECT },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(options?.cursor
        ? {
            cursor: { id: options.cursor },
            skip: 1, // skip the cursor itself
          }
        : {}),
    });
  }

  async findById(id: string): Promise<ChatMessage | null> {
    return await prisma.chatMessage.findUnique({
      where: { id },
      include: {
        sender: { select: SENDER_SELECT },
      },
    });
  }
}
