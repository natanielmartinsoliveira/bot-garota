import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HeatLevel } from '../domain/heat-level.enum';
import axios from 'axios';

@Injectable()
export class HeatEngine {
  private readonly logger = new Logger(HeatEngine.name);

  constructor(private configService: ConfigService) {}

  async calculate(
    memoryScore: number,
    userMessage: string,
  ): Promise<HeatLevel> {
    const n8nWebhookUrl = this.configService.get<string>('N8N_HEAT_WEBHOOK_URL');
    
    // Fallback inicial (valor padrão de segurança)
    let heat = HeatLevel.SAFE;

    // 1. Lógica Base por Pontuação de Memória (Mínimos necessários)
    if (memoryScore > 20) heat = HeatLevel.HOT;
    else if (memoryScore > 10) heat = HeatLevel.FLIRTY;

    // 🤖 2. CONSULTA AO N8N PARA CLASSIFICAÇÃO DE SENTIMENTO
    if (n8nWebhookUrl) {
      try {
        const response = await axios.post(n8nWebhookUrl, {
          message: userMessage,
          memoryScore,
          context: "Classificação de nível de calor/intimidade da conversa"
        });

        // O n8n deve retornar um dos enums: SAFE, FLIRTY, HOT, ADULT
        const aiHeat = response.data.heatLevel;
        
        if (Object.values(HeatLevel).includes(aiHeat)) {
          heat = aiHeat;
        }

        this.logger.debug(`Nível de calor definido pela IA: ${heat}`);
      } catch (error) {
        this.logger.error('Falha ao consultar n8n no HeatEngine.', error.message);
      }
    }

    return heat;
  }
}