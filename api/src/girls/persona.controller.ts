import { Controller, Get, Query } from '@nestjs/common';
import { PersonaService } from './persona.service';

@Controller('girls')
export class PersonaController {
  constructor(private readonly personaService: PersonaService) {}

  @Get('persona')
  getPersona(@Query('id') girlId: string) {
    return this.personaService.getPersona(girlId);
  }
}