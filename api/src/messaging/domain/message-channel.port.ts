// src/messaging/domain/message-channel.port.ts
import { Message } from './message';

export interface MessageChannelPort {
  channelName: string;

  send(message: Message): Promise<void>;
}