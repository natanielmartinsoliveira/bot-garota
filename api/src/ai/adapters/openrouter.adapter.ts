// src/ai/adapters/openrouter.adapter.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import type { AIPort } from '../domain/ai.port';

@Injectable()
export class OpenRouterAdapter implements AIPort {
  private readonly client: OpenAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('OPENROUTER_API_KEY');

    if (!apiKey) {
      throw new Error('OPENROUTER_API_KEY não configurada');
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'bot-api',
      },
    });
  }

  async generate(prompt: string): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: 'stepfun/step-3.5-flash:free',
      messages: [
        {
          role: 'system',
          content:
            'Você é uma atendente humana, natural, educada e coerente. Nunca pareça um robô.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    return (
      completion.choices[0]?.message?.content?.trim() ?? ''
    );
  }

  async classifyIntent(text: string): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: 'stepfun/step-3.5-flash:free',
      messages: [
        {
          role: 'system',
          content:
            'Classifique a intenção em UMA palavra: casual | negociacao | excitado | risco',
        },
        {
          role: 'user',
          content: text,
        },
      ],
    });

    return (
      completion.choices[0]?.message?.content
        ?.trim()
        .toLowerCase() ?? ''
    );
  }
}
