import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenRouterService {
  private readonly client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': 'http://localhost:3000',
        'X-Title': 'bot-api',
      },
    });
  }

  async test() {
    const response = await this.client.chat.completions.create({
      model: 'stepfun/step-3.5-flash:free',
      messages: [
        {
          role: 'user',
          content: 'What is the meaning of life?',
        },
      ],
    });

    return response.choices[0].message.content;
  }
}
