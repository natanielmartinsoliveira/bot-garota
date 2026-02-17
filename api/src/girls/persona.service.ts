// src/girls/persona.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class PersonaService {
  async getPersona(girlId: string) {
    // MVP: mock | depois DB
    return {
      id: girlId,
      name: 'Ana',
      style: 'carinhosa, confiante, sem pressa',
      limits: 'não responde agressividade ou pedidos ilegais',
      objective: 'converter conversa em encontro',
    };
  }
}
