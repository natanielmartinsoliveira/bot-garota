// src/test/test.module.ts
import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { OpenRouterService } from './openrouter.service';

@Module({
  controllers: [TestController],
  providers: [ OpenRouterService ],
})
export class TestModule {}
