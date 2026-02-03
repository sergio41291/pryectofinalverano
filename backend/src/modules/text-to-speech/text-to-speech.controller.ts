import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Logger,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { TextToSpeechService } from './text-to-speech.service';

@ApiTags('Text-to-Speech')
@ApiBearerAuth()
@Controller('text-to-speech')
@UseGuards(AuthGuard('jwt'))
export class TextToSpeechController {
  private readonly logger = new Logger(TextToSpeechController.name);

  constructor(private readonly ttsService: TextToSpeechService) {}

  /**
   * Get available voices
   * GET /api/text-to-speech/voices
   */
  @Get('voices')
  @ApiOperation({ summary: 'Get list of available TTS voices' })
  getVoices() {
    return {
      success: true,
      data: {
        voices: this.ttsService.getAvailableVoices(),
        isElevenLabsEnabled: this.ttsService.isElevenLabsEnabled(),
      },
    };
  }

  /**
   * Get voices by language
   * GET /api/text-to-speech/voices/:language
   */
  @Get('voices/:language')
  @ApiOperation({ summary: 'Get voices for specific language' })
  getVoicesByLanguage(@Body('language') language: string) {
    return {
      success: true,
      data: this.ttsService.getVoicesByLanguage(language),
    };
  }

  /**
   * Convert text to speech
   * POST /api/text-to-speech/convert
   */
  @Post('convert')
  @ApiOperation({ summary: 'Convert text to speech audio' })
  async convertToSpeech(
    @Body()
    body: {
      text: string;
      voiceId?: string;
      language?: string;
      modelId?: string;
      returnAudio?: boolean;
    },
    @Res() res: Response,
  ) {
    try {
      if (!body.text || body.text.trim().length === 0) {
        throw new BadRequestException('Text is required');
      }

      if (body.text.length > 5000) {
        throw new BadRequestException(
          'Text too long. Maximum 5000 characters allowed.',
        );
      }

      this.logger.log(`TTS conversion request for ${body.text.length} chars`);

      const result = await this.ttsService.convertTextToSpeech(body.text, {
        voiceId: body.voiceId,
        language: body.language || 'en',
        modelId: body.modelId,
      });

      // Si returnAudio es true, devolver el audio directamente
      if (body.returnAudio && result.audioBuffer) {
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader(
          'Content-Disposition',
          'attachment; filename="speech.mp3"',
        );
        res.setHeader('Content-Length', result.audioBuffer.length);
        return res.send(result.audioBuffer);
      }

      // Si no, devolver metadata
      return res.json({
        success: true,
        data: {
          provider: result.provider,
          format: result.format,
          charCount: result.charCount,
          duration: result.duration,
          audioSize: result.audioBuffer?.length || 0,
          // No incluir el buffer en la respuesta JSON
        },
      });
    } catch (error: any) {
      this.logger.error(`TTS conversion error: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Convert summary to speech
   * POST /api/text-to-speech/summary
   */
  @Post('summary')
  @ApiOperation({ summary: 'Convert summary text to speech' })
  async convertSummaryToSpeech(
    @Body() body: { summaryText: string; language?: string },
    @Res() res: Response,
  ) {
    try {
      if (!body.summaryText || body.summaryText.trim().length === 0) {
        throw new BadRequestException('Summary text is required');
      }

      this.logger.log(
        `TTS summary conversion for ${body.summaryText.length} chars`,
      );

      const result = await this.ttsService.convertSummaryToSpeech(
        body.summaryText,
        body.language || 'en',
      );

      // Devolver el audio directamente
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="summary-audio.mp3"',
      );
      res.setHeader('Content-Length', result.audioBuffer!.length);
      return res.send(result.audioBuffer);
    } catch (error: any) {
      this.logger.error(`TTS summary conversion error: ${error?.message}`);
      throw error;
    }
  }
}
