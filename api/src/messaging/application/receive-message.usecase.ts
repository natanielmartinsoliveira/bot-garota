import { Inject, Injectable } from '@nestjs/common';
import { Message } from '../domain/message';
import { MessageChannelPort } from '../domain/message-channel.port';
import type { AIPort } from '../../ai/domain/ai.port';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryService } from '../../memory/memory.service';
import { GirlResolveService } from '../../girl/application/girl-resolve.service';
import { ResponseBuilderService } from 'src/conversation-engine/application/response-builder.service';

@Injectable()
export class ReceiveMessageUseCase {
  constructor(
    @Inject('MESSAGE_CHANNELS')
    private readonly channels: MessageChannelPort[],

    @Inject('AI_PORT')
    private readonly ai: AIPort,

    private readonly prisma: PrismaService,
    private readonly memoryService: MemoryService,
    private readonly girlResolver: GirlResolveService,
    private readonly responseBuilder: ResponseBuilderService,
    
  ) {}

  async execute(message: Message) {
    console.log(`📨 ${message.channel} | ${message.from}:`, message.content);

    const channel = this.channels.find(
      (c) => c.channelName === message.channel,
    );
    if (!channel) return;

    /*
    =====================================
    1️⃣ Resolver Girl via GirlResolveService
    =====================================
    */
    if (!message.channel) return;
    const girlContext =
      await this.girlResolver.resolveFromChannel(
        message.channel,
      );

    if (!girlContext) return;

    /*
     =====================================
     2️⃣ Resolver Client + GirlClient
     =====================================
    */
    const client = await this.prisma.client.upsert({
      where: { phone: message.from },
      update: {},
      create: { phone: message.from },
    });

    const girlClient = await this.prisma.girlClient.upsert({
      where: {
        girlId_clientId: {
          girlId: girlContext.girlId,
          clientId: client.id,
        },
      },
      update: {},
      create: {
        girlId: girlContext.girlId,
        clientId: client.id,
      },
    });

    /*
     =====================================
     🧠 3️⃣ MEMORY ENGINE
     =====================================
    */

    const conversation =
      await this.memoryService.getOrCreateConversation(
        girlContext.girlId,
        girlClient.id,
      );

    // Salva mensagem do usuário
    await this.memoryService.saveMessage(
      conversation.id,
      'USER',
      message.content,
    );

    // Short term
    const shortTerm =
      await this.memoryService.getShortTermMemory(
        conversation.id,
        12,
      );

    // Long term
    const longTerm =
      await this.memoryService.getRelevantLongTermMemories(
        girlContext.girlId,
        girlClient.id,
        5,
      );

    /*
     =====================================
     🎯 4️⃣ INTENT CLASSIFICATION
     =====================================
    */

    const intent = await this.ai.classifyIntent(
      message.content,
    );

    console.log('🎯 Intent:', intent);

    /*
     =====================================
     🧩 5️⃣ GIRL CONTEXT + PROMPT
     =====================================
    */

    const prompt =
      this.memoryService.buildPromptContext({
        girlName: girlContext.name,
        personality: girlContext.personality,
        shortTermMemory: shortTerm,
        longTermMemory: longTerm,
        newMessage: message.content,
      });

    /*
     =====================================
     🤖 6️⃣ AI GENERATION
     =====================================
    */

     const totalMessages = await this.prisma.message.count({
        where: {
          conversationId: conversation.id,
        },
      });

     const reply =
      await this.responseBuilder.generateReply({
        girl: {
          id: girlContext.girlId,
          name: girlContext.name,
          personality: girlContext.personality,
          tone: girlContext.tone || 'friendly',
        },
        userId: client.id,
        message: message.content,
        totalMessages: totalMessages,
      });

    /*const reply = await this.ai.generate(`
      ${prompt}

      Intenção detectada: ${intent}

      Responda mantendo:
      - personalidade consistente
      - continuidade emocional
      - naturalidade humana
      `);*/

    console.log('🤖 Reply:', reply);

    /*
     =====================================
     💾 7️⃣ Persistir resposta
     =====================================
    */

    await this.memoryService.saveMessage(
      conversation.id,
      'ASSISTANT',
      reply,
    );

    /*
     =====================================
     🧠 8️⃣ Memory Extraction
     =====================================
    */

    await this.memoryService.extractAndStoreMemories({
      girlId: girlContext.girlId,
      girlClientId: girlClient.id,
      conversationWindow: shortTerm,
    });

    /*
     =====================================
     📤 9️⃣ Enviar mensagem
     =====================================
    */

    await channel.send({
      to: message.from,
      content: reply,
      channel: message.channel,
      from: 'bot',
    } as any);
  }
}
