// src/messaging/domain/message.ts
export interface Message {
  instanceName: string;
  from: string;
  content: string;
  messageId?: string;
  channel?: string;
}
