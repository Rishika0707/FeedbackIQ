
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiService {
  private readonly genAI: GoogleGenerativeAI;

  constructor(private readonly config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');

    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is missing from .env');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async analyzeFeedback(message: string) {
    const modelName =
      this.config.get<string>('GEMINI_FALLBACK_MODEL') ||
      'gemini-2.5-flash';

    const model = this.genAI.getGenerativeModel({
      model: modelName,
    });

    const prompt = `
Analyze this customer feedback.

Feedback: "${message}"

Return ONLY valid JSON with these fields:
{
  "sentiment": "Positive, Negative, or Neutral",
  "topic": "Short topic name",
  "summary": "Short summary",
  "suggestedAction": "Recommended business action"
}
`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    const cleaned = response
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    const analysis = JSON.parse(cleaned);

    if (
      !['Positive', 'Negative', 'Neutral'].includes(
        analysis.sentiment,
      )
    ) {
      throw new Error('Gemini returned an invalid sentiment');
    }

    return {
      sentiment: analysis.sentiment,
      topic: analysis.topic,
      summary: analysis.summary,
      suggestedAction: analysis.suggestedAction,
      analysisSource: 'gemini',
    };
  }
}
