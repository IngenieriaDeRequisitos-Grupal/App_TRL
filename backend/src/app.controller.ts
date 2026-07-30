import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Public } from './common/security/security.decorators';

@Controller()
export class AppController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('health')
  @Public()
  async health() {
    await this.dataSource.query('SELECT 1');
    return { status: 'ok' };
  }
}
