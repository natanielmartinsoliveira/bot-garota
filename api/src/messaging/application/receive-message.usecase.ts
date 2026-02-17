// src/messaging/application/receive-message.usecase.ts
import { Inject, Injectable } from '@nestjs/common';
import { Message } from '../domain/message';
import { MessageChannelPort } from '../domain/message-channel.port';
import type { AIPort } from '../../ai/domain/ai.port';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
@Injectable()
export class ReceiveMessageUseCase {
  constructor(private prisma: PrismaService) {}

  async execute(payload: {
    instanceName: string;
    from: string;
    content: string;
  }) {
    const { instanceName, from, content } = payload;

    // 1️⃣ Resolver garota pela instância
    const instance = await this.prisma.instance.findUnique({
      where: { name: instanceName },
      include: { girl: true },
    });

    if (!instance?.girl) return;

    const girl = instance.girl;

    // 2️⃣ Buscar ou criar cliente global
    const client = await this.prisma.client.upsert({
      where: { phone: from },
      update: {},
      create: { phone: from },
    });

    // 3️⃣ Buscar ou criar relacionamento GirlClient
    const girlClient = await this.prisma.girlClient.upsert({
      where: {
        girlId_clientId: {
          girlId: girl.id,
          clientId: client.id,
        },
      },
      update: {},
      create: {
        girlId: girl.id,
        clientId: client.id,
      },
    });

    // 4️⃣ Criar conversa
    const conversation = await this.prisma.conversation.create({
      data: {
        girlId: girl.id,
        girlClientId: girlClient.id,
      },
    });

    // 5️⃣ Salvar mensagem do usuário
    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'USER',
        content,
      },
    });

    // 6️⃣ Registrar interaction
    await this.prisma.interaction.create({
      data: {
        clientId: client.id,
        girlId: girl.id,
        intent: 'MESSAGE_RECEIVED',
      },
    });

    // 7️⃣ Atualizar score simples exemplo
    await this.prisma.girlClient.update({
      where: { id: girlClient.id },
      data: { score: { increment: 1 } },
    });

    await this.prisma.client.update({
      where: { id: client.id },
      data: { score: { increment: 1 } },
    });

    return {
      girl,
      client,
      conversation,
    };
  }
}
