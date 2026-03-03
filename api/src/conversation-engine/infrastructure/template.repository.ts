import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TemplateType } from '../domain/template-type.enum';

@Injectable()
export class TemplateRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTemplate(
    girlId: string,
    type: TemplateType,
  ): Promise<string | null> {
    const templates =
      await this.prisma.girlTemplate.findMany({
        where: {
          girlId,
          type: type as any,
          isActive: true,
        },
      });

    if (!templates.length) {
      return null;
    }

    const random =
      templates[Math.floor(Math.random() * templates.length)];

    return random.content;
  }

  
}