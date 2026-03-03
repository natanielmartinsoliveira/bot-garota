import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { MemoryService } from './memory.service';

@Module({
  imports: [
    PrismaModule,
    AiModule, // 🔥 ESSENCIAL
  ],
  providers: [MemoryService],
  exports: [MemoryService],
})
export class MemoryModule {}
