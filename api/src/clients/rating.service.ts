import { Injectable } from '@nestjs/common';

@Injectable()
export class RatingService {
  async getRatingByPhone(phone: string) {
    // MVP: mockado | depois Postgres
    if (phone.endsWith('000')) {
      return {
        score: 1.5,
        flags: ['agressivo'],
        notes: 'cliente problemático',
      };
    }

    return {
      score: 4.3,
      flags: [],
      notes: 'educado, reincidente',
    };
  }
}