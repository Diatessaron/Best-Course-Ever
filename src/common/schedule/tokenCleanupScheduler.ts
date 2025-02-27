import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DataSource } from 'typeorm';

@Injectable()
export class TokenCleanupService {
  constructor(private dataSource: DataSource) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTokenCleanup() {
    await this.dataSource.query('SELECT cleanup_expired_tokens()');
  }
}
