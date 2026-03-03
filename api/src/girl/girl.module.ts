// src/girl/girl.module.ts

import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GirlResolveService } from './application/girl-resolve.service';

@Module({
  providers: [
    PrismaService,
    GirlResolveService,
  ],
  exports: [
    GirlResolveService,
  ],
})
export class GirlModule {}
