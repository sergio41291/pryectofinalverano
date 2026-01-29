import { Controller, Post, Get, UseGuards, Request, Param, Query, Body, BadRequestException, Logger } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { OcrService } from './ocr.service';
import { CreateOcrResultDto } from './dto/create-ocr-result.dto';
import { UploadsService } from '../uploads/uploads.service';

// Import JwtAuthGuard from auth module
import { AuthGuard } from '@nestjs/passport';

@ApiTags('OCR')
@ApiBearerAuth()
@Controller('ocr')
@UseGuards(AuthGuard('jwt'))
export class OcrController {
  private readonly logger = new Logger(OcrController.name);

  constructor(
    private readonly ocrService: OcrService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Post(':uploadId/process')
  @ApiOperation({ summary: 'Initiate OCR processing for an upload' })
  @ApiParam({ name: 'uploadId', description: 'Upload ID' })
  async initiateProcessing(
    @Param('uploadId') uploadId: string,
    @Request() req: any,
    @Body() body: { language?: string },
  ) {
    try {
      // Verificar que el archivo pertenece al usuario
      const upload = await this.uploadsService.findByUserIdAndUploadId(req.user.id, uploadId);

      if (!upload) {
        throw new BadRequestException('Upload not found');
      }

      // Iniciar procesamiento OCR
      const ocrResult = await this.ocrService.initiateOcrProcessing({
        uploadId,
        userId: req.user.id,
        language: body.language || 'es',
      });

      return {
        id: ocrResult.id,
        uploadId: ocrResult.uploadId,
        status: ocrResult.status,
        jobId: ocrResult.jobId,
        createdAt: ocrResult.createdAt,
      };
    } catch (error: any) {
      this.logger.error(`Error initiating OCR: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  @Get(':uploadId')
  @ApiOperation({ summary: 'Get OCR result for an upload' })
  @ApiParam({ name: 'uploadId', description: 'Upload ID' })
  async getOcrResult(
    @Param('uploadId') uploadId: string,
    @Request() req: any,
  ) {
    const result = await this.ocrService.getOcrResult(req.user.id, uploadId);

    return {
      id: result.id,
      uploadId: result.uploadId,
      status: result.status,
      extractedText: result.extractedText,
      metadata: result.metadata,
      pageResults: result.pageResults,
      errorMessage: result.errorMessage,
      createdAt: result.createdAt,
      completedAt: result.completedAt,
    };
  }

  @Get('results/:id')
  @ApiOperation({ summary: 'Get OCR result by ID' })
  @ApiParam({ name: 'id', description: 'OCR Result ID' })
  async getOcrResultById(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const result = await this.ocrService.getOcrResultById(id, req.user.id);

    return {
      id: result.id,
      uploadId: result.uploadId,
      status: result.status,
      extractedText: result.extractedText,
      metadata: result.metadata,
      pageResults: result.pageResults,
      errorMessage: result.errorMessage,
      createdAt: result.createdAt,
      completedAt: result.completedAt,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List OCR results for current user' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async listOcrResults(
    @Request() req: any,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
  ) {
    const { results, total } = await this.ocrService.listUserOcrResults(
      req.user.id,
      Math.min(limit, 100),
      offset,
    );

    return {
      results: results.map((r) => ({
        id: r.id,
        uploadId: r.uploadId,
        status: r.status,
        createdAt: r.createdAt,
        completedAt: r.completedAt,
      })),
      total,
      limit: Math.min(limit, 100),
      offset,
    };
  }
}
