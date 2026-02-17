// src/ai/ai.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OpenRouterAdapter } from './adapters/openrouter.adapter';
import { AITestController } from './ai-test.controller';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'AI_PORT',
      useClass: OpenRouterAdapter,
    },
  ],
  exports: ['AI_PORT'],
  controllers: [AITestController],
})
export class AiModule {}
