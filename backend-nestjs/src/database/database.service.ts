
import {
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;

  constructor(private readonly configService: ConfigService) {
    const connectionString =
      this.configService.get<string>('DATABASE_URL');

    if (!connectionString) {
      throw new Error('DATABASE_URL is missing from backend-nestjs/.env');
    }

    this.pool = new Pool({
      connectionString,
      ssl: connectionString.includes('render.com')
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }

  async onModuleInit() {
    await this.pool.query('SELECT 1');
    console.log('FeedbackIQ PostgreSQL connected successfully!');
  }

  async query(sql: string, params?: unknown[]) {
    return this.pool.query(sql, params);
  }

  async onModuleDestroy() {
    await this.pool.end();
  }
}
