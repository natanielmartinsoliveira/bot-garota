import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { WhatsappAdapter } from './messaging/adapters/whatsapp.adapter';


dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const whatsapp = app.get(WhatsappAdapter);
  await whatsapp.onModuleInit();
  app.enableCors();
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
