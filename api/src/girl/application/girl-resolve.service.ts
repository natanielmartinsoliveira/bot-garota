// src/girl/application/girl-resolve.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GirlContext } from '../domain/girl-context';

@Injectable()
export class GirlResolveService {
  constructor(private readonly prisma: PrismaService) {}

  async resolveFromChannel(
    channelName: string,
  ): Promise<GirlContext | null> {
    const instance = await this.prisma.instance.findUnique({
      where: { name: channelName },
      include: {
        girl: true,
      },
    });

    if (!instance || !instance.girl) {
      return null;
    }

    const girl = instance.girl;

    if (!girl.isActive) {
      return null;
    }

    return {
      girlId: girl.id,
      name: girl.name,
      personality: girl.personality,
      isActive: girl.isActive,
      instanceName: instance.name,
    };
  }
}
