import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DesireStateService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async getDesire(
    girlId: string,
    clientId: string,
  ): Promise<number> {
    const record =
      await this.prisma.girlClient.findUnique({
        where: {
          girlId_clientId: {
            girlId,
            clientId: Number(clientId),
          },
        },
      });

    return record?.score ?? 0;
  }

  async updateDesire(
    girlId: string,
    clientId: string,
    desire: number,
    heat: number,
  ): Promise<void> {
    await this.prisma.girlClient.update({
      where: {
        girlId_clientId: {
          girlId,
          clientId: Number(clientId),
        },
      },
      data: {
        score: desire,
        lastHeat: heat,
      },
    });
  }
}