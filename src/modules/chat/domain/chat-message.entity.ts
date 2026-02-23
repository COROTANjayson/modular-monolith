export interface ChatMessage {
  id: string;
  teamId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  sender?: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    avatar: string | null;
  };
}

export type ChatMessageCreateData = Pick<ChatMessage, "teamId" | "senderId" | "content">;
