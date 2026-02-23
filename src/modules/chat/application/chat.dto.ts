export interface SendMessageDto {
  content: string;
}

export interface GetMessagesQueryDto {
  cursor?: string;
  limit?: number;
}
