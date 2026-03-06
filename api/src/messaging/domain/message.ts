// src/messaging/domain/message.ts
export interface Message {
  instanceName: string;
  from: string;
  content: string;
  type?: 'text' | 'image' | 'video' | 'audio';
  mediaUrl?: string;
  messageId?: string;
  channel?: string;
}


