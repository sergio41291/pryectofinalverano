import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import { Response } from 'express';

interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@Controller('processing')
@UseGuards(AuthGuard('jwt'))
export class AiController {
  private readonly logger = new Logger(AiController.name);

  constructor(private readonly aiService: AiService) {}

  /**
   * Stream summary generation using Claude API
   * POST /api/processing/summarize
   * Body: { text, language?, maxTokens?, style? }
   */
  @Post('summarize')
  async summarizeStream(
    @Body()
    body: {
      text: string;
      language?: string;
      maxTokens?: number;
      style?: 'bullet-points' | 'paragraph' | 'executive';
    },
    @Res() res: Response,
    @Req() req: AuthRequest,
  ) {
    try {
      if (!body.text || body.text.trim().length === 0) {
        return res.status(400).json({
          error: 'Text is required',
        });
      }

      this.logger.log(`User ${req.user.id} requested summary for ${body.text.length} chars`);

      // Set headers for Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Generate summary with streaming
      const generator = this.aiService.streamSummarize({
        text: body.text,
        language: body.language || 'es',
        maxTokens: body.maxTokens || 1024,
        style: body.style || 'bullet-points',
      });

      // Send each chunk as SSE data
      for await (const chunk of generator) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      // Send completion signal
      res.write(`data: ${JSON.stringify({ complete: true })}\n\n`);
      res.end();
    } catch (error: any) {
      this.logger.error(`Summary error: ${error?.message}`);
      if (!res.headersSent) {
        res.status(500).json({
          error: 'Failed to generate summary',
          message: error?.message,
        });
      } else {
        res.write(`data: ${JSON.stringify({ error: error?.message })}\n\n`);
        res.end();
      }
    }
  }

  /**
   * Generate questionnaire from text
   * POST /api/processing/questionnaire
   * Body: { text, language?, numQuestions? }
   */
  @Post('questionnaire')
  async generateQuestionnaire(
    @Body()
    body: {
      text: string;
      language?: string;
      numQuestions?: number;
    },
    @Req() req: AuthRequest,
  ) {
    try {
      if (!body.text || body.text.trim().length === 0) {
        throw new BadRequestException('Text is required');
      }

      this.logger.log(
        `User ${req.user.id} requested questionnaire with ${body.numQuestions || 5} questions`,
      );

      const questionnaire = await this.aiService.generateQuestionnaire(
        body.text,
        body.language || 'es',
        body.numQuestions || 5,
      );

      return {
        success: true,
        data: questionnaire,
      };
    } catch (error: any) {
      this.logger.error(`Questionnaire error: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Translate text to another language
   * POST /api/processing/translate
   * Body: { text, targetLanguage }
   */
  @Post('translate')
  async translate(
    @Body() body: { text: string; targetLanguage: string },
    @Req() req: AuthRequest,
  ) {
    try {
      if (!body.text || body.text.trim().length === 0) {
        throw new BadRequestException('Text is required');
      }

      if (!body.targetLanguage) {
        throw new BadRequestException('Target language is required');
      }

      this.logger.log(
        `User ${req.user.id} requested translation to ${body.targetLanguage}`,
      );

      const translation = await this.aiService.translate(
        body.text,
        body.targetLanguage,
      );

      return {
        success: true,
        data: {
          original: body.text,
          translated: translation,
          targetLanguage: body.targetLanguage,
        },
      };
    } catch (error: any) {
      this.logger.error(`Translation error: ${error?.message}`);
      throw error;
    }
  }
}
