import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config'; // Importação necessária
import { HeatLevel } from '../domain/heat-level.enum';
import axios from 'axios';

interface DesireInput {
  totalMessages: number;
  memoryScore: number;
  heat: HeatLevel;
  userMessage: string;
  previousDesire?: number;
}

@Injectable()
export class DesireEngine {
  private readonly logger = new Logger(DesireEngine.name);

  constructor(private configService: ConfigService) {}

  async calculate(input: DesireInput): Promise<number> {
    const {
      totalMessages,
      memoryScore,
      heat,
      userMessage,
      previousDesire = 0,
    } = input;

    // Buscando a URL das variáveis de ambiente (.env)
    const n8nWebhookUrl = this.configService.get<string>('N8N_DESIRE_WEBHOOK_URL');

    let score = previousDesire;

    // 📈 Cálculos Numéricos Base
    score += totalMessages * 0.3;
    score += memoryScore * 0.8;

    const heatBonus = {
      [HeatLevel.FLIRTY]: 5,
      [HeatLevel.HOT]: 10,
      [HeatLevel.ADULT]: 18,
    };
    score += heatBonus[heat] || 0;

    // 🤖 INTEGRAÇÃO COM IA VIA N8N
    if (n8nWebhookUrl) {
      try {
        const response = await axios.post(n8nWebhookUrl, {
          message: userMessage,
          heatLevel: heat,
          currentScore: score
        });

        // A IA retorna um peso (ex: de -15 a +15) baseado no contexto
        const aiImpact = response.data.aiImpact || 0;
        score += aiImpact;
        
        this.logger.debug(`Impacto da IA: ${aiImpact} para a mensagem: "${userMessage}"`);
      } catch (error) {
        this.logger.error('Falha ao consultar n8n, seguindo com lógica base.', error.message);
      }
    }

    // 🕰 Decaimento e Limites
    score -= 2;
    score = Math.max(0, Math.min(100, score));

    return Math.floor(score);
  }
}