import { Injectable, Inject } from '@nestjs/common';
import type { AIPort } from '../../ai/domain/ai.port';
//import { HeatEngine } from './heat.engine';
//import { DesireEngine } from './desire.engine';
import { TemplateEngine } from './template.engine';
import { MemoryService } from '../../memory/memory.service';
import { DesireStateService } from './desire-state.service';
import { ConversationAnalysisEngine } from './conversation-analysis.engine';

interface GenerateReplyParams {
  girl: {
    id: string;
    name: string;
    personality: string;
    tone: string;
  };
  userId: any;
  message: string;
  totalMessages: number;
}

@Injectable()
export class ResponseBuilderService {
  constructor(
    private readonly analysisEngine: ConversationAnalysisEngine,
    private readonly desireState: DesireStateService,
    private readonly templateEngine: TemplateEngine,
    private readonly memoryService: MemoryService,

    @Inject('AI_PORT')
    private readonly ai: AIPort,
  ) {}

  async generateReply(
    params: GenerateReplyParams,
    ): Promise<string> {
    const { girl, userId, message, totalMessages } = params;

    const memoryScore =
        await this.memoryService.getScore(
        userId,
        girl.id,
        );

    const previousDesire =
        await this.desireState.getDesire(
        girl.id,
        userId,
        );

    const { heat, desire } =
        await this.analysisEngine.analyze({
        message,
        memoryScore,
        previousDesire,
        totalMessages,
        });

    await this.desireState.updateDesire(
        girl.id,
        userId,
        desire,
        heat,
    );

    /**
     * 🔥 Adult override
     */
    if (heat === 3 || desire > 80) {
        const adultTemplate =
        await this.templateEngine.getRawTemplate(
            girl.id,
            'ADULT',
        );

        if (adultTemplate) {
        return adultTemplate
            .replace('{{name}}', girl.name)
            .replace('{{desire}}', String(desire));
        }
    }

    const prompt =
        await this.templateEngine.build({
        girlId: girl.id,
        girlName: girl.name,
        personality: girl.personality,
        tone: girl.tone,
        heat,
        desire,
        userMessage: message,
        });

    return this.ai.generate(prompt);
    }
}