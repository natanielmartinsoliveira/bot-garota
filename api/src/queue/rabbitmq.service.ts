// src/queue/rabbitmq.service.ts
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as amqp from 'amqplib';

@Injectable()
export class RabbitMQService
  implements OnModuleInit, OnModuleDestroy
{
  private connection!: amqp.Connection;
  private channel!: amqp.Channel;

  async onModuleInit() {
    this.connection = await this.connectWithRetry(
      process.env.RABBITMQ_URL || 'amqp://localhost:5672', 10
    );

    this.channel = await this.connection.createChannel();
  }

  async connectWithRetry(url: string, retries = 10) {
    for (let i = 0; i < retries; i++) {
        try {
        return await amqp.connect(url);
        } catch (err) {
        console.log(`🐰 RabbitMQ indisponível, retry ${i + 1}/${retries}`);
        await new Promise(res => setTimeout(res, 3000));
        }
    }
    throw new Error('❌ Não foi possível conectar ao RabbitMQ');
  }

  getChannel(): amqp.Channel {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not initialized');
    }
    return this.channel;
  }

  async onModuleDestroy() {
    await this.channel?.close();
    await this.connection?.close();
  }
}
