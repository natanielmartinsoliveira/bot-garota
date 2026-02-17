import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { WebhookService } from './webhook.service';
import { AiModule } from 'src/ai/ai.module';
import { MessagingModule } from 'src/messaging/messaging.module';

@Module({
  imports: [AiModule, MessagingModule], // 👈 traz o AIService para o contexto
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
