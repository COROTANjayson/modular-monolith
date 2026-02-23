import { ChatMessage, ChatMessageCreateData } from "./chat-message.entity";

export interface IChatMessageRepository {
  create(data: ChatMessageCreateData): Promise<ChatMessage>;
  findByTeamId(
    teamId: string,
    options?: { cursor?: string; limit?: number }
  ): Promise<ChatMessage[]>;
  findById(id: string): Promise<ChatMessage | null>;
}
