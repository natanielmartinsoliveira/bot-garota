import { Injectable, OnModuleInit, OnModuleDestroy, Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MemoryModule } from '../memory/memory.module';
import { AiModule } from '../ai/ai.module';

import { TemplateRepository } from './infrastructure/template.repository';
import { TemplateEngine } from './application/template.engine';
import { HeatEngine } from './application/heat.engine';
import { DesireEngine } from './application/desire.engine';
import { ResponseBuilderService } from './application/response-builder.service';
import { DesireStateService } from './application/desire-state.service';
import { ConversationAnalysisEngine } from './application/conversation-analysis.engine';

@Module({
  imports: [
    PrismaModule,
    MemoryModule,
    AiModule,
  ],
  providers: [
    ConversationAnalysisEngine,
    TemplateRepository,
    TemplateEngine,
    HeatEngine,
    DesireEngine,
    DesireStateService,
    ResponseBuilderService,
  ],
  exports: [
    ResponseBuilderService, // 👈 ESSENCIAL
  ],
})
export class ConversationEngineModule {}