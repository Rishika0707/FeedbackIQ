
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';

import { DatabaseService } from '../database/database.service';
import { GeminiService } from './gemini.service';

@Injectable()
export class FeedbackService {
  constructor(
    private readonly database: DatabaseService,
    private readonly gemini: GeminiService,
  ) {}

  async findAll() {
    const result = await this.database.query(
      'SELECT * FROM feedback ORDER BY id DESC',
    );

    return {
      success: true,
      total: result.rows.length,
      feedback: result.rows,
    };
  }

  async findOne(id: number) {
    const result = await this.database.query(
      'SELECT * FROM feedback WHERE id = $1',
      [id],
    );

    return result.rows[0] || null;
  }

  async create(data: { customerName: string; message: string }) {
    const customerName = data.customerName?.trim();
    const message = data.message?.trim();

    if (!customerName || !message) {
      throw new BadRequestException(
        'Customer name and feedback message are required',
      );
    }

    try {
      const analysis = await this.gemini.analyzeFeedback(message);

      const result = await this.database.query(
        `INSERT INTO feedback
        (customer_name, message, sentiment, topic, summary,
        suggested_action, analysis_source)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [
          customerName,
          message,
          analysis.sentiment,
          analysis.topic,
          analysis.summary,
          analysis.suggestedAction,
          analysis.analysisSource,
        ],
      );

      return {
        success: true,
        message: 'Feedback analyzed and saved successfully',
        feedback: result.rows[0],
      };
    } catch (error) {
      console.error('Feedback creation error:', error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Unable to analyze or save feedback. Please check Gemini configuration and try again.',
      );
    }
  }

  async delete(id: number) {
    const result = await this.database.query(
      'DELETE FROM feedback WHERE id = $1 RETURNING id',
      [id],
    );

    return {
      success: result.rowCount !== 0,
      message:
        result.rowCount !== 0
          ? 'Feedback deleted successfully'
          : 'Feedback not found',
    };
  }
}
