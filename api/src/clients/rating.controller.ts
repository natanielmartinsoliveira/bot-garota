import { Controller, Get, Query } from '@nestjs/common';
import { RatingService } from './rating.service';

@Controller('clients')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Get('rating')
  getRating(@Query('phone') phone: string) {
    return this.ratingService.getRatingByPhone(phone);
  }
}