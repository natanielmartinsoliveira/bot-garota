import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WebhookModule } from './webhook/webhook.module';
//import { OpenAIModule } from './ai/openai.module';
import { RedisModule } from './cache/redis.module';
import { ConfigModule } from '@nestjs/config';
import { GirlModule } from './girl/girl.module';
import { ClientsModule } from './clients/clients.module';
import { AiModule } from './ai/ai.module';
import { AppRabbitMQModule } from './queue/rabbitmq.module';
import { TestModule } from './test/test.module';
import { PrismaModule } from './prisma/prisma.module';
import { MediaModule } from './mediaengine/media.module';

@Module({
  imports: [ConfigModule.forRoot({
       isGlobal: true, // 👈 MUITO IMPORTANTE
       envFilePath: '.env',
    }),
    PrismaModule,
    MediaModule,
    WebhookModule, 
    AppRabbitMQModule, 
    RedisModule, 
    ClientsModule,
    GirlModule, 
    AiModule,
    TestModule],
  controllers: [AppController],
  providers: [AppService],
  
})
export class AppModule {}
