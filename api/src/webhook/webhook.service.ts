import { Injectable, Inject } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { ReceiveMessageUseCase } from 'src/messaging/application/receive-message.usecase';
//import { AIService } from 'src/ai/ai.service';

@Injectable()
export class WebhookService {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    private readonly config: ConfigService,
    private readonly receiveMessage: ReceiveMessageUseCase
  ) {}

  async handleWhatsapp(payload: any) {
    const { from, message } = payload;

    // 🔑 chaves Redis
    const conversationKey = `conversation:${from}`;
    const historyKey = `history:${from}`;

    // 🔍 estado anterior
    const lastStateRaw = await this.redis.get(conversationKey);
    const lastState = lastStateRaw ? JSON.parse(lastStateRaw) : null;

    // 🤖 classifica intenção (cacheada internamente)
    const intent = await this.receiveMessage.execute(message);

    // 🧠 novo estado da conversa
    const newState = {
      lastMessage: message,
      lastIntent: intent,
      updatedAt: Date.now(),
    };

    // 💾 salva estado com TTL (sessão ativa)
    await this.redis.set(
      conversationKey,
      JSON.stringify(newState),
      'EX',
      300, // 5 minutos
    );

    // 🧾 histórico curto (lista)
    await this.redis.lpush(
      historyKey,
      JSON.stringify({
        message,
        intent,
        at: Date.now(),
      }),
    );

    // mantém só os últimos 20 eventos
    await this.redis.ltrim(historyKey, 0, 19);
    await this.redis.expire(historyKey, 600);

    // 🌐 envia tudo para o n8n
    const n8nUrl = this.config.get<string>('N8N_WEBHOOK_URL');
    if (!n8nUrl) {
      throw new Error('N8N_WEBHOOK_URL não configurado');
    }

    await axios.post(n8nUrl, {
      from,
      message,
      intent,
      lastState,
    });

    return {
      status: 'ok',
      intent,
    };
  }
}