// src/queue/publishers/outgoing-message.publisher.ts
import { Injectable } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';

@Injectable()
export class OutgoingMessagePublisher {
  private readonly queue = 'outgoing.messages';

  constructor(private readonly rabbit: RabbitMQService) {}

  async publish(payload: any) {
    const channel = this.rabbit.getChannel();
    console.log('📤 Publicando mensagem na fila saida:', payload);
    await channel.assertQueue(this.queue, { durable: true });

    channel.sendToQueue(
      this.queue,
      Buffer.from(JSON.stringify(payload)),
      { persistent: true },
    );
  }
}
