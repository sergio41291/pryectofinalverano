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
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
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

    // TODO: Save file to MinIO and create database record
    return {
      message: 'File upload endpoint ready',
      fileName: file.originalname,
    };
  }

  @Get()
  async getUserUploads(@Request() req: any, @Query('limit') limit: number = 20, @Query('offset') offset: number = 0) {
    const [uploads, total] = await this.uploadsService.findByUserId(req.user.id, limit, offset);
    return {
      data: uploads,
      total,
      limit,
      offset,
    };
  }

  @Get(':id')
  async getUpload(@Param('id') id: string) {
    return this.uploadsService.findById(id);
  }

  @Delete(':id')
  async deleteUpload(@Param('id') id: string) {
    await this.uploadsService.delete(id);
    return { message: 'Upload deleted successfully' };
  }
}
