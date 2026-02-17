/*import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type Redis from 'ioredis';

@Injectable()
export class OpenAIService {
  private client: OpenAI;

  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,

    private readonly config: ConfigService,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }

    this.client = new OpenAI({ apiKey });
  }

  async classifyIntent(text: string): Promise<string> {
    const cacheKey = `intent:${this.hash(text)}`;

    // 🔍 tenta cache
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    // 🤖 chama IA
    const response = await this.client.responses.create({
      model: 'gpt-4.1-mini',
      input: `
Classifique a intenção da mensagem abaixo.
Responda apenas com UMA palavra:

casual | negociacao | excitado | risco

Mensagem:
"${text}"
      `,
    });

    const intent = response.output_text.trim().toLowerCase();

    // 💾 salva no Redis por 10 minutos
    await this.redis.set(
      cacheKey,
      intent,
      'EX',
      600,
    );

    return intent;
  }

  /**
   * Evita keys gigantes e dados sensíveis no Redis
   */
  /*private hash(text: string): string {
    return Buffer.from(text).toString('base64').slice(0, 64);
  }
}*/
