// src/girls/girls.module.ts
import { Module } from '@nestjs/common';
import { PersonaController } from './persona.controller';
import { PersonaService } from './persona.service';

@Module({
  controllers: [PersonaController],
  providers: [PersonaService],
})
export class GirlsModule {}
