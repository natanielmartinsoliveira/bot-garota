import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { AIPort } from '../ai/domain/ai.port';

@Injectable()
export class MemoryService {
  constructor(
    private readonly prisma: PrismaService,

    @Inject('AI_PORT')
    private readonly ai: AIPort,
  ) {}



  /*
   =====================================================
   🗂️ CONVERSATION MANAGEMENT
   =====================================================
  */

  async getOrCreateConversation(
    girlId: string,
    girlClientId: string,
  ) {
    let conversation =
      await this.prisma.conversation.findFirst({
        where: {
          girlClientId,
          isActive: true,
        },
        orderBy: { createdAt: 'desc' },
      });

    if (!conversation) {
      conversation =
        await this.prisma.conversation.create({
          data: {
            girlId,
            girlClientId,
            isActive: true,
          },
        });
    }

    return conversation;
  }

  async saveMessage(
    conversationId: string,
    role: 'USER' | 'ASSISTANT',
    content: string,
  ) {
    return this.prisma.message.create({
      data: {
        conversationId,
        role,
        content,
      },
    });
  }

  /*
   =====================================================
   🧠 SHORT TERM MEMORY
   =====================================================
  */

  async getShortTermMemory(
    conversationId: string,
    limit = 12,
  ) {
    const messages =
      await this.prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

    return messages.reverse();
  }

  /*
   =====================================================
   🗂️ LONG TERM MEMORY
   =====================================================
  */

  async saveLongTermMemory(params: {
    girlId: string;
    girlClientId: string;
    content: string;
    type: 'FACT' | 'EMOTION' | 'PREFERENCE' | 'RELATION';
    importance?: number;
  }) {
    return this.prisma.memory.create({
      data: {
        girlId: params.girlId,
        girlClientId: params.girlClientId,
        content: params.content,
        type: params.type,
        importance: params.importance ?? 5,
      },
    });
  }

  async getRelevantLongTermMemories(
    girlId: string,
    girlClientId: string,
    limit = 5,
  ) {
    const memories =
      await this.prisma.memory.findMany({
        where: {
          girlId,
          girlClientId,
        },
        orderBy: [
          { importance: 'desc' },
          { createdAt: 'desc' },
        ],
        take: limit,
      });

    // Atualiza lastAccessed
    await Promise.all(
      memories.map((m) =>
        this.prisma.memory.update({
          where: { id: m.id },
          data: { lastAccessedAt: new Date() },
        }),
      ),
    );

    return memories;
  }

  /*
   =====================================================
   🍂 MEMORY DECAY
   =====================================================
  */

  async applyMemoryDecay() {
    const thresholdDate = new Date(
      Date.now() - 1000 * 60 * 60 * 24 * 30, // 30 dias
    );

    const oldMemories =
      await this.prisma.memory.findMany({
        where: {
          createdAt: { lt: thresholdDate },
          importance: { gt: 1 },
        },
      });

    await Promise.all(
      oldMemories.map((m) =>
        this.prisma.memory.update({
          where: { id: m.id },
          data: { importance: m.importance - 1 },
        }),
      ),
    );
  }

  async getScore(
    clientId: string,
    girlId: string,
  ): Promise<number> {
    const messages = await this.prisma.message.count({
      where: {
        conversation: {
          girlClientId: clientId,
          girlId,
        },
      },
    });

  const memories = await this.prisma.memory.count({
    where: {
      girlClientId: clientId,
      girlId,
    },
  });

  // Peso maior para memórias persistidas
  const score =
    messages * 0.5 +
    memories * 3;

  return Math.min(100, Math.floor(score));
}

  /*
   =====================================================
   🔍 MEMORY EXTRACTION
   =====================================================
  */

  async extractAndStoreMemories(params: {
    girlId: string;
    girlClientId: string;
    conversationWindow: {
      role: string;
      content: string;
    }[];
  }) {
    const conversationText =
      params.conversationWindow
        .map((m) => `${m.role}: ${m.content}`)
        .join('\n');

    const extractionPrompt = `
        Extraia fatos importantes sobre o usuário.
        Retorne apenas JSON válido:

        [
          {
            "type": "FACT | EMOTION | PREFERENCE | RELATION",
            "content": "string",
            "importance": number (1-10)
          }
        ]

        Conversa:
        ${conversationText}
    `;

    const response =
      await this.ai.generate(extractionPrompt);

    let parsed;

    try {
      parsed = JSON.parse(response);
    } catch {
      return;
    }

    if (!Array.isArray(parsed)) return;

    for (const item of parsed) {
      if (
        item.content &&
        item.importance >= 6
      ) {
        await this.saveLongTermMemory({
          girlId: params.girlId,
          girlClientId: params.girlClientId,
          content: item.content,
          type: item.type,
          importance: item.importance,
        });
      }
    }
  }

  /*
   =====================================================
   🧩 PROMPT BUILDER
   =====================================================
  */

  buildPromptContext(params: {
    girlName: string;
    personality: string;
    shortTermMemory: any[];
    longTermMemory: any[];
    newMessage: string;
  }) {
    const {
      girlName,
      personality,
      shortTermMemory,
      longTermMemory,
      newMessage,
    } = params;

    const shortHistory =
      shortTermMemory
        .map((m) =>
          `${m.role === 'USER'
            ? 'Usuário'
            : girlName
          }: ${m.content}`,
        )
        .join('\n');

    const longHistory =
      longTermMemory.length > 0
        ? longTermMemory
            .map((m) => `- ${m.content}`)
            .join('\n')
        : 'Nenhuma memória relevante ainda.';

        return `
            Você é ${girlName}.
            Personalidade: ${personality}

            Memórias importantes sobre o usuário:
            ${longHistory}

            Histórico recente:
            ${shortHistory}

            Mensagem atual:
            ${newMessage}

            Responda mantendo:
            - personalidade consistente
            - emoção coerente
            - continuidade natural
            `;
       }
}
