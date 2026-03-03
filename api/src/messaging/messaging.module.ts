// src/messaging/messaging.module.ts
import { Module } from '@nestjs/common';
import { ReceiveMessageUseCase } from './application/receive-message.usecase';
import { WhatsappAdapter } from './adapters/whatsapp.adapter';
import { EvolutionAdapter } from './adapters/evolution.adapter';
import { AiModule } from 'src/ai/ai.module';
import { MessagingController } from './messaging.controller';
import { IncomingMessageConsumer } from 'src/queue/consumers/incoming-message.consumer';
import { OutgoingMessageConsumer } from 'src/queue/consumers/outgoing-message.consumer';
import { RabbitMQModule as GolevelupRabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { AppRabbitMQModule } from 'src/queue/rabbitmq.module';
import { MemoryModule } from '../memory/memory.module';
import { GirlModule } from '../girl/girl.module';
import { ConversationEngineModule } from 'src/conversation-engine/conversation-engine.module';

@Module({
  imports: [
    ConversationEngineModule, // 👈 AQUI
    GirlModule,
    MemoryModule,
    AiModule,
    AppRabbitMQModule,
    GolevelupRabbitMQModule.forRoot({
      uri: process.env.RABBITMQ_URI,
      exchanges: [
        {
          name: 'evolution',
          type: 'topic',
        },
      ],
      enableControllerDiscovery: true,
    }),
  ],
  controllers: [MessagingController],
  providers: [
    ReceiveMessageUseCase,
    WhatsappAdapter,

    // 🔥 Evolution configurado corretamente
    {
      provide: EvolutionAdapter,
      useFactory: () => {
        return new EvolutionAdapter(
          process.env.EVOLUTION_URL!,
          process.env.EVOLUTION_API_KEY!,
          process.env.EVOLUTION_INSTANCE!,
        );
      },
    },

    // 🔥 Multi-channel provider
    {
      provide: 'MESSAGE_CHANNELS',
      useFactory: (
        whatsapp: WhatsappAdapter,
        evolution: EvolutionAdapter,
      ) => {
        const provider = process.env.WHATSAPP_PROVIDER;

        if (provider === 'evolution') return [evolution];
        if (provider === 'web') return [whatsapp];

        return [whatsapp, evolution];
      },
      inject: [WhatsappAdapter, EvolutionAdapter],
    },

    IncomingMessageConsumer,
    OutgoingMessageConsumer,
  ],
  exports: [ReceiveMessageUseCase],
})
export class MessagingModule {}
