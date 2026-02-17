// src/ai/ai-test.controller.ts
import { Controller, Get, Inject, Query } from '@nestjs/common';
import { OpenRouterAdapter } from './adapters/openrouter.adapter';
import type { AIPort } from './domain/ai.port';
@Controller('ai-test')
export class AITestController {
  constructor(
    @Inject('AI_PORT')
    private readonly ai: AIPort,
    ) {}

  @Get()
  async test(@Query('q') q?: string) {
    const prompt = q ?? 'Diga apenas: funcionando';

    const response = await this.ai.generate(prompt);

    return {
      ok: true,
      prompt,
      response,
    };
  }
}
