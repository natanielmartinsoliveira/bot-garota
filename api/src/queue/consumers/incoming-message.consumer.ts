// src/queue/consumers/incoming-message.consumer.ts

import { Injectable, OnModuleInit } from '@nestjs/common';
import { RabbitMQService } from '../rabbitmq.service';
import { ReceiveMessageUseCase } from '../../messaging/application/receive-message.usecase';
import { ConsumeMessage } from 'amqplib';

@Injectable()
export class IncomingMessageConsumer implements OnModuleInit {
  private readonly queue = 'incoming.messages';
  private readonly exchange = 'botgarota';
  private readonly routingKey = '#.messages.upsert';

  constructor(
    private readonly rabbit: RabbitMQService,
    private readonly receiveMessage: ReceiveMessageUseCase,
  ) {
    console.log('🐇 IncomingMessageConsumer inicializado');
  }

  async onModuleInit() {
    const channel = this.rabbit.getChannel();

    // Garante exchange
    await channel.assertExchange(this.exchange, 'topic', {
      durable: true,
    });

    // Garante queue
    await channel.assertQueue(this.queue, {
      durable: true,
    });

    // Faz bind da queue ao exchange
    await channel.bindQueue(
      this.queue,
      this.exchange,
      this.routingKey,
    );

    console.log(
      `📡 Escutando ${this.exchange} → ${this.routingKey}`,
    );

    channel.consume(
      this.queue,
      async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        try {
          const raw = JSON.parse(
            msg.content.toString(),
          );

          console.log(
            '📥 Evento recebido:',
            raw.event,
          );

          console.log(
            '📥 dados recebido:',
            
          );

          // 1️⃣ Apenas mensagens recebidas
          if (raw.event !== 'messages.upsert') {
            channel.ack(msg);
            return;
          }

          const data = raw.data;
//console.log('📨------------------- Mensagem :', data);
          // 2️⃣ Ignora mensagens enviadas pelo próprio bot
          if (data?.key?.fromMe) {
            channel.ack(msg);
            return;
          }

          const from = data?.key?.remoteJidAlt || data?.key?.remoteJid;
          
          // 3️⃣ Ignora grupos
          if (from?.includes('@g.us')) {
            channel.ack(msg);
            return;
          }

          // 4️⃣ Extrai texto em múltiplos formatos
          const text =
            data?.message?.conversation ||
            data?.message?.extendedTextMessage?.text ||
            data?.message?.imageMessage?.caption ||
            data?.message?.videoMessage?.caption ||
            data?.message?.buttonsResponseMessage
              ?.selectedDisplayText ||
            data?.message?.listResponseMessage
              ?.title;

          if (!text) {
            channel.ack(msg);
            return;
          }

          const messageId = data?.key?.id;

          const normalizedPayload = {
            instanceName: channel, // ou raw.instance
            messageId,
            from,
            content: text,
            channel: 'whatsapp',
          };

          console.log(
            '📨 Mensagem normalizada:',
            normalizedPayload,
          );

          await this.receiveMessage.execute(
            normalizedPayload,
          );

          channel.ack(msg);
        } catch (error) {
          console.error(
            '❌ Erro ao processar mensagem:',
            error,
          );

          // Evita loop infinito de reprocessamento
          channel.nack(msg, false, false);
        }
      },
      { noAck: false },
    );
  }
}
