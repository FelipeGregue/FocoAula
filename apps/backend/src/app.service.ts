import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  health() {
    return {
      app: 'FocoAula API',
      status: 'ok',
      version: '0.1.0',
      requirements: ['RF01-RF12', 'RNF01-RNF10'],
    };
  }
}
