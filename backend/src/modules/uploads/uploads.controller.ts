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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody, ApiParam } from '@nestjs/swagger';
import { Response } from 'express';
import { UploadsService } from './uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('uploads')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

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
      const upload = await this.uploadsService.createFromFile(req.user.id, file);
      return {
        id: upload.id,
        fileName: upload.fileName,
        originalFileName: upload.originalFileName,
        fileSize: upload.fileSize,
        mimeType: upload.mimeType,
        status: upload.status,
        createdAt: upload.createdAt,
      };
    } catch (error: any) {
      throw new BadRequestException(error?.message || 'Failed to upload file');
    }
  }

  @Get()
  async getUserUploads(
    @Request() req: any,
    @Query('limit') limit: number = 20,
    @Query('offset') offset: number = 0,
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
        processedAt: upload.processedAt,
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
