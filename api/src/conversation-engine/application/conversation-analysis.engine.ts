import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { HeatLevel } from '../domain/heat-level.enum';

interface AnalysisInput {
  message: string;
  memoryScore: number;
  previousDesire: number;
  totalMessages: number;
}

interface AnalysisResult {
  heat: HeatLevel;
  desire: number;
}

@Injectable()
export class ConversationAnalysisEngine {
  private readonly logger = new Logger(ConversationAnalysisEngine.name);

  constructor(private configService: ConfigService) {}

  async analyze(input: AnalysisInput): Promise<AnalysisResult> {
    const webhookUrl =
      this.configService.get<string>('N8N_CONVERSATION_ANALYSIS_URL');

    let heat: HeatLevel = HeatLevel.SAFE;
    let desire = input.previousDesire;

    /**
     * 🔹 FALLBACK LOCAL BASE
     */
    if (input.memoryScore > 20) heat = HeatLevel.HOT;
    else if (input.memoryScore > 10) heat = HeatLevel.FLIRTY;

    desire += input.totalMessages * 0.3;
    desire += input.memoryScore * 0.8;

    /**
     * 🔹 EXTERNAL ANALYSIS
     */
    if (webhookUrl) {
      try {
        const response = await axios.post(
          webhookUrl,
          input,
          { timeout: 3000 },
        );

        const aiHeatRaw = response.data?.heatLevel;
        const aiImpact = response.data?.desireImpact ?? 0;

        if (typeof aiHeatRaw === 'string') {
          const normalized = aiHeatRaw.trim().toUpperCase();
          if (Object.values(HeatLevel).includes(normalized as unknown as HeatLevel)) {
            heat = normalized as unknown as HeatLevel;
          }
        }

        desire += aiImpact;

        this.logger.debug(
          `AI Analysis → Heat: ${heat}, Impact: ${aiImpact}`,
        );
      } catch (error) {
        this.logger.warn(
          'n8n analysis failed, using fallback.',
        );
      }
    }

    /**
     * 🔹 LIMITS & DECAY
     */
    desire -= 2;
    desire = Math.max(0, Math.min(100, desire));

    /**
     * 🔹 SAFETY GUARD
     */
    if (heat === HeatLevel.ADULT && input.memoryScore < 5) {
      heat = HeatLevel.FLIRTY;
    }

    return {
      heat,
      desire: Math.floor(desire),
    };
  }
}