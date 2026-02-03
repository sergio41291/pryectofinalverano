import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  BadRequestException,
  Logger,
  Param,
  Get,
  Delete,
  Query,
  StreamableFile,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AiService } from './ai.service';
import { AudioService } from '../audio/audio.service';
import { OcrService } from '../ocr/ocr.service';
import { CreateSummaryDto } from './dto/create-summary.dto';
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

  constructor(
    private readonly aiService: AiService,
    private readonly audioService: AudioService,
    private readonly ocrService: OcrService,
  ) {}

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

  /**
   * Generate summary for audio transcription
   * POST /api/processing/audio/:audioResultId/summary
   */
  @Post('audio/:audioResultId/summary')
  async generateAudioSummary(
    @Param('audioResultId') audioResultId: string,
    @Body() body: { language?: string; maxTokens?: number } = {},
    @Res() res: Response,
    @Req() req: AuthRequest,
  ) {
    try {
      // Get audio result and verify ownership
      const audioResult = await this.audioService.getAudioResultById(audioResultId);
      
      if (!audioResult || audioResult.userId !== req.user.id) {
        return res.status(403).json({
          error: 'Audio not found or access denied',
        });
      }

      if (!audioResult.transcription) {
        return res.status(400).json({
          error: 'Audio has no transcription yet',
        });
      }

      this.logger.log(
        `User ${req.user.id} requested summary for audio ${audioResultId}`,
      );

      // Set headers for Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');

      // Generate summary with streaming
      const generator = this.aiService.streamSummarize({
        text: audioResult.transcription,
        language: body.language || audioResult.language || 'es',
        maxTokens: body.maxTokens || 1024,
        style: 'bullet-points',
      });

      // Send each chunk as SSE data
      for await (const chunk of generator) {
        res.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
      }

      // Send completion signal
      res.write(`data: ${JSON.stringify({ complete: true })}\n\n`);
      res.end();
    } catch (error: any) {
      this.logger.error(`Audio summary error: ${error?.message}`);
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
   * Generate questionnaire for audio transcription
   * POST /api/processing/audio/:audioResultId/questionnaire
   */
  @Post('audio/:audioResultId/questionnaire')
  async generateAudioQuestionnaire(
    @Param('audioResultId') audioResultId: string,
    @Body()
    body: {
      difficulty?: 'easy' | 'medium' | 'hard';
      numQuestions?: number;
    } = {},
    @Req() req: AuthRequest,
  ) {
    try {
      // Get audio result and verify ownership
      const audioResult = await this.audioService.getAudioResultById(audioResultId);
      
      if (!audioResult || audioResult.userId !== req.user.id) {
        throw new BadRequestException('Audio not found or access denied');
      }

      if (!audioResult.transcription) {
        throw new BadRequestException('Audio has no transcription yet');
      }

      this.logger.log(
        `User ${req.user.id} requested questionnaire for audio ${audioResultId}`,
      );

      const questionnaire = await this.aiService.generateQuestionnaire(
        audioResult.transcription,
        audioResult.language || 'es',
        body.numQuestions || 5,
      );

      return {
        success: true,
        data: questionnaire,
      };
    } catch (error: any) {
      this.logger.error(`Audio questionnaire error: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Save a generated summary
   * POST /api/processing/summaries
   * Body: { title, sourceText, summaryContent, language, style, sourceFileName? }
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('summaries')
  async saveSummary(
    @Body() dto: CreateSummaryDto,
    @Req() req: AuthRequest,
  ) {
    try {
      const summary = await this.aiService.saveSummary(req.user.id, dto);
      return {
        success: true,
        data: summary,
      };
    } catch (error: any) {
      this.logger.error(`Save summary error: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Get all my summaries
   * GET /api/processing/summaries?page=1&limit=10
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('summaries')
  async getMySummaries(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Req() req: AuthRequest,
  ) {
    try {
      const result = await this.aiService.getMySummaries(req.user.id, page, limit);
      return {
        success: true,
        data: result.data,
        total: result.total,
        page,
        limit,
      };
    } catch (error: any) {
      this.logger.error(`Get summaries error: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Get a specific summary
   * GET /api/processing/summaries/:id
   */
  @UseGuards(AuthGuard('jwt'))
  @Get('summaries/:id')
  async getSummary(
    @Param('id') summaryId: string,
    @Req() req: AuthRequest,
  ) {
    try {
      const summary = await this.aiService.getSummary(summaryId, req.user.id);
      return {
        success: true,
        data: summary,
      };
    } catch (error: any) {
      this.logger.error(`Get summary error: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Download summary as text file
   * GET /api/processing/summaries/:id/download
   UseGuards(AuthGuard('jwt'))
  @*/
  @Get('summaries/:id/download')
  async downloadSummary(
    @Param('id') summaryId: string,
    @Req() req: AuthRequest,
    @Res() res: Response,
  ) {
    try {
      const { content, fileName } = await this.aiService.getSummaryContent(summaryId, req.user.id);

      res.set({
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Type': 'text/plain; charset=utf-8',
      });

      res.send(content);
    } catch (error: any) {
      this.logger.error(`Download summary error: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Delete a summary
   * DELETE /api/processing/summaries/:id
   */
  @UseGuards(AuthGuard('jwt'))
  @Delete('summaries/:id')
  async deleteSummary(
    @Param('id') summaryId: string,
    @Req() req: AuthRequest,
  ) {
    try {
      await this.aiService.deleteSummary(summaryId, req.user.id);
      return {
        success: true,
        message: 'Summary deleted',
      };
    } catch (error: any) {
      this.logger.error(`Delete summary error: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Share summary with group
   * POST /api/processing/summaries/:id/share-with-group/:groupId
   */
  @UseGuards(AuthGuard('jwt'))
  @Post('summaries/:id/share-with-group/:groupId')
  async shareWithGroup(
    @Param('id') summaryId: string,
    @Param('groupId') groupId: string,
    @Req() req: AuthRequest,
  ) {
    try {
      const summary = await this.aiService.shareWithGroup(summaryId, groupId, req.user.id);
      return {
        success: true,
        data: summary,
        message: 'Summary shared with group successfully',
      };
    } catch (error: any) {
      this.logger.error(`Share summary error: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Unshare summary from group
   * DELETE /api/processing/summaries/:id/unshare-from-group
   */
  @UseGuards(AuthGuard('jwt'))
  @Delete('summaries/:id/unshare-from-group')
  async unshareFromGroup(
    @Param('id') summaryId: string,
    @Req() req: AuthRequest,
  ) {
    try {
      const summary = await this.aiService.unshareFromGroup(summaryId, req.user.id);
      return {
        success: true,
        data: summary,
        message: 'Summary unshared from group successfully',
      };
    } catch (error: any) {
      this.logger.error(`Unshare summary error: ${error?.message}`);
      throw error;
    }
  }
}
