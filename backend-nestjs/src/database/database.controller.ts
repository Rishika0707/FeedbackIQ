
import { Controller, Get } from '@nestjs/common';
import { DatabaseService } from './database.service';

@Controller('api/database')
export class DatabaseController {
  constructor(private readonly database: DatabaseService) {}

  @Get('test')
  async testConnection() {
    const result = await this.database.query(
      'SELECT COUNT(*)::int AS total FROM feedback',
    );

    return {
      success: true,
      database: 'connected',
      totalFeedback: result.rows[0].total,
    };
  }
}
