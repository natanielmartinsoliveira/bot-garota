import { Injectable, OnModuleInit } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class EvolutionAdapter implements OnModuleInit {
  
  channelName = 'whatsapp';

  constructor(
    private readonly baseUrl = process.env.EVOLUTION_BASE_URL,
    private readonly apiKey = process.env.EVOLUTION_API_KEY,
    private readonly instance = process.env.EVOLUTION_INSTANCE,
  ) {}
  async onModuleInit() {
    await this.ensureInstance();
  }

  private get headers() {
    return {
      apikey: this.apiKey,
      'Content-Type': 'application/json',
    };
  }

  /* ------------------------------------------------ */
  /* INSTANCE MANAGEMENT                             */
  /* ------------------------------------------------ */

  private async ensureInstance() {
    const { data } = await axios.get(
      `${this.baseUrl}/instance/fetchInstances`,
      { headers: this.headers },
    );

    const exists = data?.some(
      (inst: any) => inst.name === this.instance,
    );

    if (!exists) {
      await axios.post(
        `${this.baseUrl}/instance/create`,
        {
          instanceName: this.instance,
          integration: 'WHATSAPP-BAILEYS',
          rabbitmq: {
            enabled: true,
            events: ['MESSAGES_UPSERT'],
          },
        },
        { headers: this.headers },
      );
    }
  }

  async isConnected(): Promise<boolean> {
    const { data } = await axios.get(
      `${this.baseUrl}/instance/fetchInstances`,
      { headers: this.headers },
    );

    const instance = data?.find(
      (inst: any) => inst.name === this.instance,
    );

    return instance?.connectionStatus === 'open';
  }

  private async ensureConnected() {
    const connected = await this.isConnected();
    if (!connected) {
      throw new Error(
        `Evolution instance ${this.instance} is not connected`,
      );
    }
  }

  /* ------------------------------------------------ */
  /* SEND METHODS                                     */
  /* ------------------------------------------------ */

  async sendText(to: string, text: string) {
    await this.ensureConnected();

    await axios.post(
      `${this.baseUrl}/message/sendText/${this.instance}`,
      {
        number: this.formatNumber(to),
        text,
      },
      { headers: this.headers },
    );
  }

   async send(message) {
   // await this.onModuleInit();
  //console.log('TESTE:',message);
   await axios.post(
      `${this.baseUrl}/message/sendText/${this.instance}`,
      {
        number: this.formatNumber(message.to),
        text: message.content,
      },
      { headers: this.headers },
    );
  }

  async sendImage(to: string, imageUrl: string, caption?: string) {
    await this.ensureConnected();

    await axios.post(
      `${this.baseUrl}/message/sendMedia/${this.instance}`,
      {
        number: this.formatNumber(to),
        mediatype: 'image',
        media: imageUrl,
        caption,
      },
      { headers: this.headers },
    );
  }

  async sendAudio(to: string, audioUrl: string) {
    await this.ensureConnected();

    await axios.post(
      `${this.baseUrl}/message/sendMedia/${this.instance}`,
      {
        number: this.formatNumber(to),
        mediatype: 'audio',
        media: audioUrl,
      },
      { headers: this.headers },
    );
  }

  async sendDocument(
    to: string,
    documentUrl: string,
    fileName: string,
  ) {
    await this.ensureConnected();

    await axios.post(
      `${this.baseUrl}/message/sendMedia/${this.instance}`,
      {
        number: this.formatNumber(to),
        mediatype: 'document',
        media: documentUrl,
        fileName,
      },
      { headers: this.headers },
    );
  }

  async sendButtons(
    to: string,
    text: string,
    buttons: { id: string; text: string }[],
  ) {
    await this.ensureConnected();

    await axios.post(
      `${this.baseUrl}/message/sendButtons/${this.instance}`,
      {
        number: this.formatNumber(to),
        title: text,
        buttons,
      },
      { headers: this.headers },
    );
  }

  async sendList(
    to: string,
    title: string,
    description: string,
    sections: any[],
  ) {
    await this.ensureConnected();

    await axios.post(
      `${this.baseUrl}/message/sendList/${this.instance}`,
      {
        number: this.formatNumber(to),
        title,
        description,
        buttonText: 'Selecionar',
        sections,
      },
      { headers: this.headers },
    );
  }

  /* ------------------------------------------------ */
  /* UTILS                                            */
  /* ------------------------------------------------ */

  private formatNumber(number: string): string {
    return number
      .replace(/\D/g, '')
      .replace(/^55/, '') === number.replace(/\D/g, '')
      ? number.replace(/\D/g, '')
      : number.replace(/\D/g, '');
  }
}
