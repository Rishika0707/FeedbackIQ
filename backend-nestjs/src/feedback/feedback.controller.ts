
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  ParseIntPipe,
} from '@nestjs/common';

import { FeedbackService } from './feedback.service';

@Controller('api/feedback')
export class FeedbackController {
  constructor(
    private readonly feedbackService: FeedbackService,
  ) {}

  // Get all feedback
  @Get()
  async getAllFeedback() {
    return this.feedbackService.findAll();
  }

  // Submit feedback for Gemini AI analysis
  @Post()
  async createFeedback(
    @Body()
    body: {
      customerName: string;
      message: string;
    },
  ) {
    return this.feedbackService.create(body);
  }

  // Delete feedback
  @Delete(':id')
  async deleteFeedback(
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.feedbackService.delete(id);
  }
}