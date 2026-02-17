// src/queue/consumers/outgoing-message.consumer.ts
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';
import { MessageChannelPort } from '../../messaging/domain/message-channel.port';

@Injectable()
export class OutgoingMessageConsumer implements OnModuleInit {
  private readonly queue = 'outgoing.messages';

  constructor(
    private readonly rabbit: RabbitMQService,
    @Inject('MESSAGE_CHANNELS')
    private readonly channels: MessageChannelPort[],
  ) {}

  async onModuleInit() {
    const channel = this.rabbit.getChannel();

    await channel.assertQueue(this.queue, { durable: true });

    channel.consume(this.queue, async (msg) => {
      if (!msg) return;

      const payload = JSON.parse(msg.content.toString());

      const adapter = this.channels.find(
        c => c.channelName === payload.channel,
      );
      console.log('📤 Enviando mensagem para canal:', payload.channel, payload);

      if (adapter) {
        await adapter.send(payload);
      }

      channel.ack(msg);
    });
  }
}
