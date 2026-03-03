import { Injectable } from '@nestjs/common';
import { TemplateRepository } from '../infrastructure/template.repository';
import { HeatLevel } from '../domain/heat-level.enum';
import { TemplateType } from '../domain/template-type.enum';

interface BuildTemplateParams {
  girlId: string;
  girlName: string;
  personality: string;
  tone: string;
  heat: HeatLevel;
  desire: number;
  userMessage: string;
}

@Injectable()
export class TemplateEngine {
  constructor(
    private readonly templateRepo: TemplateRepository,
  ) {}
  async getRawTemplate(
    girlId: string,
    type: TemplateType | string,
  ): Promise<string | null> {
    const template =
      await this.templateRepo.findTemplate(
        girlId,
        type as TemplateType,
      );

    return template ?? null;
  }
  async build(params: BuildTemplateParams): Promise<string> {
    const {
      girlId,
      girlName,
      personality,
      tone,
      heat,
      desire,
      userMessage,
    } = params;

    const base =
      await this.templateRepo.findTemplate(
        girlId,
        TemplateType.BASE,
      );

    const heatType =
      heat === HeatLevel.ADULT
        ? TemplateType.ADULT
        : heat === HeatLevel.HOT
        ? TemplateType.HOT
        : heat === HeatLevel.FLIRTY
        ? TemplateType.FLIRTY
        : TemplateType.BASE;

    const dynamic =
      await this.templateRepo.findTemplate(
        girlId,
        heatType,
      );

    return `
          You are ${girlName}.
          Personality: ${personality}
          Tone: ${tone}
          Desire level: ${desire}/100
          Heat level: ${heat}

          Base style:
          ${base ?? ''}

          Intensity style:
          ${dynamic ?? ''}

          User said:
          "${userMessage}"

          If heat is high, increase intensity.
          If desire is high, show emotional craving.
          Stay in character.
          Avoid repetition.`;
  }
}