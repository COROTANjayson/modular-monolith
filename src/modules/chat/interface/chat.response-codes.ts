import { SUCCESS_CODES, ERROR_CODES } from "../../../shared/utils/response-code";

export const CHAT_SUCCESS_CODES = {
  MESSAGES_FETCHED: "CHAT_MESSAGES_FETCHED",
  MESSAGE_SENT: "CHAT_MESSAGE_SENT",
} as const;

export const CHAT_ERROR_CODES = {
  TEAM_NOT_FOUND: "CHAT_TEAM_NOT_FOUND",
  NOT_TEAM_MEMBER: "CHAT_NOT_TEAM_MEMBER",
} as const;
