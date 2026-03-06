import { Module } from '@nestjs/common';
import { MediaEngine } from './application/media.engine';
@Module({
  providers: [
    MediaEngine
  ],
  exports: [
    MediaEngine
  ]
})
export class MediaModule {}