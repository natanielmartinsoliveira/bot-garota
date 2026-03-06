import { Inject, Injectable } from '@nestjs/common';
import { Message } from '../domain/message';
import { MessageChannelPort } from '../domain/message-channel.port';
import type { AIPort } from '../../ai/domain/ai.port';
import { PrismaService } from '../../prisma/prisma.service';
import { MemoryService } from '../../memory/memory.service';
import { GirlResolveService } from '../../girl/application/girl-resolve.service';
import { ResponseBuilderService } from 'src/conversation-engine/application/response-builder.service';
import { MediaEngine } from 'src/mediaengine/application/media.engine';

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
    private readonly mediaEngine: MediaEngine,
  ) {}

  async execute(message: Message) {
    console.log(`📨 ${message.channel} | ${message.from}:`, message.content);

    const channel = this.channels.find(
      (c) => c.channelName === message.channel,
    );
    if (!channel) return;

    /*
    =====================================
    1️⃣ Resolver Girl
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
    2️⃣ Resolver Client
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
    🎬 3️⃣ MEDIA INTERPRETATION
    =====================================
    */

    let interpretedContent = message.content || '';

    if (
      message.type === 'image' ||
      message.type === 'video' ||
      message.type === 'audio'
    ) {
      try {
        const mediaContext = await this.mediaEngine.analyze({
          url: message.mediaUrl!,
          type: message.type,
          userMessage: message.content,
          girlId: girlContext.girlId,
          clientId: client.id.toString(),
        });

        interpretedContent =
          this.mediaEngine.buildMediaPrompt(mediaContext);

        console.log('🖼 Media interpreted:', interpretedContent);
      } catch (error) {
        console.log('⚠️ MediaEngine falhou:', error.message);
      }
    }

    /*
    =====================================
    🧠 4️⃣ MEMORY ENGINE
    =====================================
    */

    const conversation =
      await this.memoryService.getOrCreateConversation(
        girlContext.girlId,
        girlClient.id,
      );

    await this.memoryService.saveMessage(
      conversation.id,
      'USER',
      interpretedContent,
    );

    const shortTerm =
      await this.memoryService.getShortTermMemory(
        conversation.id,
        12,
      );

    const longTerm =
      await this.memoryService.getRelevantLongTermMemories(
        girlContext.girlId,
        girlClient.id,
        5,
      );

    /*
    =====================================
    🎯 5️⃣ INTENT CLASSIFICATION
    =====================================
    */

    const intent = await this.ai.classifyIntent(
      interpretedContent,
    );

    console.log('🎯 Intent:', intent);

    /*
    =====================================
    🧩 6️⃣ PROMPT CONTEXT
    =====================================
    */

    const prompt =
      this.memoryService.buildPromptContext({
        girlName: girlContext.name,
        personality: girlContext.personality,
        shortTermMemory: shortTerm,
        longTermMemory: longTerm,
        newMessage: interpretedContent,
      });

    /*
    =====================================
    🤖 7️⃣ RESPONSE GENERATION
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
        message: interpretedContent,
        totalMessages: totalMessages,
      });

    console.log('🤖 Reply:', reply);

    /*
    =====================================
    💾 8️⃣ SALVAR RESPOSTA
    =====================================
    */

    await this.memoryService.saveMessage(
      conversation.id,
      'ASSISTANT',
      reply,
    );

    /*
    =====================================
    🧠 9️⃣ MEMORY EXTRACTION
    =====================================
    */

    await this.memoryService.extractAndStoreMemories({
      girlId: girlContext.girlId,
      girlClientId: girlClient.id,
      conversationWindow: shortTerm,
    });

    /*
    =====================================
    📤 10️⃣ ENVIAR RESPOSTA
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