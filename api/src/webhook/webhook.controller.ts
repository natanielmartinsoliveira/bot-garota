import { Controller, Post, Body } from '@nestjs/common';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly service: WebhookService) {}

  @Post('whatsapp')
  async receive(@Body() body: any) {
    return this.service.handleWhatsapp(body);
  }

}
