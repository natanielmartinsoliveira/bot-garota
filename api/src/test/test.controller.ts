import { Controller, Get } from '@nestjs/common';
import { OpenRouterService } from './openrouter.service';

@Controller('openrouter')
export class TestController {
  constructor(private readonly service: OpenRouterService) {}

  @Get('test')
  async test() {
    return this.service.test();
  }
}
