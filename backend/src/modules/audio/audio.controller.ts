import {
  Controller,
  Post,
  Get,
  Param,
  UseGuards,
  Body,
  Logger,
  NotFoundException,
  Request,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AudioService } from './audio.service';
import { AudioResult } from './entities/audio-result.entity';
import { CreateAudioResultDto } from './dto/create-audio-result.dto';

@Controller('audio')
@UseGuards(AuthGuard('jwt'))
export class AudioController {
  private readonly logger = new Logger(AudioController.name);

  constructor(private readonly audioService: AudioService) {}

  @Get('status/:uploadId')
  async getAudioStatus(
    @Param('uploadId') uploadId: string,
    @Request() req: any,
  ): Promise<{ status: string; transcription?: string; summary?: string; extractedText?: string; error?: string }> {
    try {
      const result = await this.audioService.getAudioResult(req.user.id, uploadId);
      if (!result) {
        return { status: 'pending' };
      }
      return {
        status: result.status,
        transcription: result.transcription || undefined,
        summary: result.summary || undefined,
        extractedText: result.summary || result.transcription || undefined,
        error: result.errorMessage || undefined,
      };
    } catch (error: any) {
      this.logger.error(`Error getting audio status: ${error?.message}`);
      return { status: 'error', error: error?.message };
    }
  }

  @Post(':uploadId/process')
  async processAudio(
    @Param('uploadId') uploadId: string,
    @Request() req: any,
    @Body() body?: { language?: string },
  ): Promise<AudioResult> {
    try {
      const dto: CreateAudioResultDto = {
        uploadId,
        userId: req.user.id,
        language: body?.language,
      };

      const result = await this.audioService.initiateAudioProcessing(dto);
      return result;
    } catch (error: any) {
      this.logger.error(`Error processing audio: ${error?.message}`);
      throw error;
    }
  }

  @Get(':uploadId')
  async getAudioResult(
    @Param('uploadId') uploadId: string,
    @Request() req: any,
  ): Promise<AudioResult> {
    try {
      const result = await this.audioService.getAudioResult(req.user.id, uploadId);
      if (!result) {
        throw new NotFoundException('Audio result not found');
      }
      return result;
    } catch (error: any) {
      this.logger.error(`Error getting audio result: ${error?.message}`);
      throw error;
    }
  }

  @Get('results/:id')
  async getAudioResultById(@Param('id') id: string): Promise<AudioResult> {
    try {
      return await this.audioService.getAudioResultById(id);
    } catch (error: any) {
      this.logger.error(`Error getting audio result: ${error?.message}`);
      throw error;
    }
  }

  @Get()
  async getAllAudioResults(@Request() req: any): Promise<AudioResult[]> {
    try {
      return await this.audioService.getAllAudioResults(req.user.id);
    } catch (error: any) {
      this.logger.error(`Error getting audio results: ${error?.message}`);
      throw error;
    }
  }
}
