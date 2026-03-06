import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { MediaContext } from '../domain/media-context';

interface MediaInput {
  url: string;
  type: 'image' | 'video' | 'audio';
  userMessage?: string;
  girlId: string;
  clientId: string;
}

@Injectable()
export class MediaEngine {
  private readonly logger = new Logger(MediaEngine.name);

  constructor(private readonly config: ConfigService) {}

  async analyze(input: MediaInput): Promise<MediaContext> {
    const webhook = this.config.get<string>('N8N_MEDIA_WEBHOOK');

    if (!webhook) {
      throw new Error('N8N_MEDIA_WEBHOOK não configurado');
    }

    try {
      const response = await axios.post(webhook, {
        url: input.url,
        type: input.type,
        userMessage: input.userMessage,
        girlId: input.girlId,
        clientId: input.clientId,
      });

      const data = response.data;

      const context: MediaContext = {
        type: input.type,
        description: data.description || 'Unknown media',
        mood: data.mood || 'neutral',
        heatScore: data.heatScore ?? 0,
        desireScore: data.desireScore ?? 0,
        nsfwLevel: data.nsfwLevel ?? 0,
        objects: data.objects || [],
        transcript: data.transcript,
        duration: data.duration,
      };

      this.logger.debug(`Media analisada: ${context.description}`);

      return context;
    } catch (error) {
      this.logger.error('Falha no MediaEngine', error.message);

      return {
        type: input.type,
        description: 'Media could not be analyzed',
      };
    }
  }

  buildMediaPrompt(context: MediaContext): string {
    let prompt = `
        [MEDIA CONTEXT]
        Type: ${context.type}
        Description: ${context.description}
        Mood: ${context.mood}
        HeatScore: ${context.heatScore}
        DesireScore: ${context.desireScore}
        NSFW Level: ${context.nsfwLevel}
    `;

    if (context.objects?.length) {
      prompt += `Objects: ${context.objects.join(', ')}\n`;
    }

    if (context.transcript) {
      prompt += `Transcript: ${context.transcript}\n`;
    }

    return prompt;
  }
}