// src/queue/rabbitmq.module.ts
import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { IncomingMessagePublisher } from './publishers/incoming-message.publisher';
import { OutgoingMessagePublisher } from './publishers/outgoing-message.publisher';

@Module({
  providers: [
    RabbitMQService,
    IncomingMessagePublisher,
    OutgoingMessagePublisher,
  ],
  exports: [
    RabbitMQService,
    IncomingMessagePublisher,
    OutgoingMessagePublisher,
  ],
})
export class AppRabbitMQModule {}
