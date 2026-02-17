// src/ai/domain/ai.port.ts
export interface AIResponse {
  text: string;
  intent?: string;
}

export interface AIPort {
  generate(prompt: string): Promise<string>;
  classifyIntent(text: string): Promise<string>;
}
