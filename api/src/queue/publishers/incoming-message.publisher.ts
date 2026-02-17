// src/queue/publishers/incoming-message.publisher.ts
import { Injectable } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';

@Injectable()
export class IncomingMessagePublisher {
  private readonly queue = 'incoming.messages';

  constructor(private readonly rabbit: RabbitMQService) {}

  async publish(payload: any) {
    const channel = this.rabbit.getChannel();
    console.log('📤 Publicando mensagem na fila:', payload);
    await channel.assertQueue(this.queue, { durable: true });

    channel.sendToQueue(
      this.queue,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true },
    );
  }
}
