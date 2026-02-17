import { Body, Controller, Get, Inject, Post } from '@nestjs/common';
import { WhatsappAdapter } from './adapters/whatsapp.adapter';

@Controller('whatsapp')
export class MessagingController {
  constructor(
    @Inject('MESSAGE_CHANNELS')
    private readonly channels: any[],
  ) {}

  @Get('qr')
  getQr() {
    const status = this.channels[0].getQrStatus();

    if (status.ready) {
      return {
        ready: true,
        message: 'WhatsApp já conectado',
      };
    }

    if (!status.qr) {
      return {
        ready: false,
        message: 'QR ainda não gerado, aguarde...',
      };
    }

    return {
      ready: false,
      qr: status.qr, // base64
    };
  }

  @Post('test-send')
  async testSend(
    @Body() body: { number: string; message: string },
  ) {
    const { number, message } = body;

    //for (const channel of this.channels) {
      try {
        await this.channels[1].send(number, message);
      } catch (error) {
        console.error(
          `Erro ao enviar com ${this.channels[1].constructor.name}`,
          error?.response?.data || error.message,
        );
      }
    //}

    return {
      status: 'processed',
      channels: this.channels.map(c => c.constructor.name),
    };
  }
  
}

