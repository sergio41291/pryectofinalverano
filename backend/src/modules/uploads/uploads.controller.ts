import {
  Controller,
  Post,
  Get,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Request,
  Query,
  Res,
  ParseIntPipe,
  DefaultValuePipe,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { UploadsService } from './uploads.service';
import { OcrService } from '../ocr/ocr.service';
import { AudioService } from '../audio/audio.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  private readonly logger = new Logger(UploadsController.name);

  constructor(
    private readonly uploadsService: UploadsService,
    private readonly ocrService: OcrService,
    private readonly audioService: AudioService,
  ) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      // Upload file and create upload record
      const upload = await this.uploadsService.createFromFile(req.user.id, file);

      // Detect file type and route to appropriate service
      const isAudio = this.isAudioFile(file.mimetype);
      const isImageOrPdf = this.isImageOrPdfFile(file.mimetype);

      this.logger.log(`File uploaded: ${file.originalname}, Type: ${isAudio ? 'AUDIO' : isImageOrPdf ? 'OCR' : 'UNKNOWN'}`);

      try {
        if (isAudio) {
          // Route to Audio Transcription Service
          this.logger.log(`Routing to Audio Service: ${upload.id}`);
          await this.audioService.initiateAudioProcessing({
            uploadId: upload.id,
            userId: req.user.id,
            language: 'es',
          });
        } else if (isImageOrPdf) {
          // Route to OCR Service
          this.logger.log(`Routing to OCR Service: ${upload.id}`);
          await this.ocrService.initiateOcrProcessing(
            {
              uploadId: upload.id,
              userId: req.user.id,
              language: 'es',
            },
            file.buffer,
          );
        } else {
          throw new BadRequestException(
            `Unsupported file type: ${file.mimetype}. Supported: Audio (mp3, wav, m4a, ogg) or Document (pdf, image)`,
          );
        }
      } catch (processingError: any) {
        // If processing fails, rollback the upload and delete the file from storage
        await this.uploadsService.deleteUploadAndFile(upload.id);
        throw new BadRequestException(
          `Processing failed: ${processingError?.message || 'Unknown error'}. File has been removed.`,
        );
      }

      return {
        id: upload.id,
        fileName: upload.fileName,
        originalFileName: upload.originalFileName,
        fileSize: upload.fileSize,
        mimeType: upload.mimeType,
        status: upload.status,
        fileType: isAudio ? 'audio' : 'document',
        processingType: isAudio ? 'transcription' : 'ocr',
        createdAt: upload.createdAt,
      };
    } catch (error: any) {
      throw new BadRequestException(error?.message || 'Failed to upload file');
    }
  }

  /**
   * Detect if file is audio format
   */
  private isAudioFile(mimeType: string): boolean {
    const audioMimeTypes = [
      'audio/mpeg',       // mp3
      'audio/wav',        // wav
      'audio/wave',       // wav alternative
      'audio/x-wav',      // wav alternative
      'audio/mp4',        // m4a
      'audio/x-m4a',      // m4a alternative
      'audio/ogg',        // ogg/opus
      'audio/opus',       // opus
      'audio/flac',       // flac
      'audio/aac',        // aac
      'audio/x-aac',      // aac alternative
      'audio/webm',       // webm audio
    ];
    return audioMimeTypes.includes(mimeType.toLowerCase());
  }

  /**
   * Detect if file is image or PDF (for OCR processing)
   */
  private isImageOrPdfFile(mimeType: string): boolean {
    const ocrMimeTypes = [
      'application/pdf',          // PDF
      'image/jpeg',               // JPG
      'image/jpg',                // JPG alternative
      'image/png',                // PNG
      'image/tiff',               // TIFF
      'image/x-tiff',             // TIFF alternative
      'image/webp',               // WEBP
      'image/bmp',                // BMP
      'image/gif',                // GIF (less common for OCR but supported)
    ];
    return ocrMimeTypes.includes(mimeType.toLowerCase());
  }

  @Get()
  async getUserUploads(
    @Request() req: any,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number = 20,
    @Query('offset', new DefaultValuePipe(0), ParseIntPipe) offset: number = 0,
  ) {
    const [uploads, total] = await this.uploadsService.findByUserId(
      req.user.id,
      limit,
      offset,
    );
    return {
      data: uploads.map((upload) => ({
        id: upload.id,
        fileName: upload.fileName,
        originalFileName: upload.originalFileName,
        fileSize: upload.fileSize,
        mimeType: upload.mimeType,
        status: upload.status,
        createdAt: upload.createdAt,
        updatedAt: upload.updatedAt,
        processedAt: upload.processedAt,
        extractedText: upload.ocrResults?.[0]?.extractedText || null,
      })),
      total,
      limit,
      offset,
    };
  }

  @Get(':id')
  @ApiParam({ name: 'id', description: 'Upload ID' })
  async getUpload(@Param('id') id: string, @Request() req: any) {
    const upload = await this.uploadsService.findByUserIdAndUploadId(req.user.id, id);
    return {
      id: upload.id,
      fileName: upload.fileName,
      originalFileName: upload.originalFileName,
      fileSize: upload.fileSize,
      mimeType: upload.mimeType,
      status: upload.status,
      createdAt: upload.createdAt,
      processedAt: upload.processedAt,
    };
  }

  @Get(':id/download')
  @ApiParam({ name: 'id', description: 'Upload ID' })
  async downloadUpload(
    @Param('id') id: string,
    @Request() req: any,
    @Res() res: Response,
  ) {
    const upload = await this.uploadsService.findByUserIdAndUploadId(req.user.id, id);
    const url = await this.uploadsService.getDownloadUrl(req.user.id, id);

    return res.redirect(url);
  }

  @Delete(':id')
  @ApiParam({ name: 'id', description: 'Upload ID' })
  async deleteUpload(@Param('id') id: string, @Request() req: any) {
    await this.uploadsService.delete(req.user.id, id);
    return { message: 'Upload deleted successfully' };
  }
}
