import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { MinioClientService } from './minio-client.service';
import * as crypto from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly documentBucket = process.env.MINIO_BUCKET_DOCUMENTS || 'documents';
  private readonly resultsBucket = process.env.MINIO_BUCKET_RESULTS || 'results';
  private readonly tempBucket = process.env.MINIO_BUCKET_TEMP || 'temp';

  constructor(private readonly minioClientService: MinioClientService) {
    this.initializeBuckets();
  }

  private async initializeBuckets(): Promise<void> {
    try {
      await this.minioClientService.ensureBucketExists(this.documentBucket);
      await this.minioClientService.ensureBucketExists(this.resultsBucket);
      await this.minioClientService.ensureBucketExists(this.tempBucket);
      this.logger.log('Storage buckets initialized');
    } catch (error: any) {
      this.logger.error('Failed to initialize storage buckets', error?.stack);
    }
  }

  async uploadDocument(
    userId: string,
    file: Express.Multer.File,
    subdirectory: string = '',
  ): Promise<{ path: string; size: number; mimeType: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validar tipos de archivo permitidos
    const allowedMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: PDF, PNG, JPEG, WEBP, DOC, DOCX, XLS, XLSX`,
      );
    }

    // Validar tamaño máximo (100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException(`File size exceeds maximum allowed size of 100MB`);
    }

    try {
      // Generar nombre único
      const timestamp = Date.now();
      const randomString = crypto.randomBytes(8).toString('hex');
      const fileExtension = file.originalname.split('.').pop();
      const sanitizedFileName = file.originalname
        .replace(/[^a-zA-Z0-9.-]/g, '_')
        .slice(0, 100);
      const objectName = `${subdirectory}${userId}/${timestamp}-${randomString}-${sanitizedFileName}`;

      // Subir a MinIO
      const path = await this.minioClientService.uploadFile(
        this.documentBucket,
        objectName,
        file.buffer,
        file.mimetype,
      );

      this.logger.log(`Document uploaded: ${path} (${file.size} bytes)`);

      return {
        path,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error: any) {
      this.logger.error(`Error uploading document: ${error?.message}`, error?.stack);
      throw new BadRequestException('Failed to upload document');
    }
  }

  async uploadSummary(userId: string, uploadId: string, summaryText: string, type: string = 'summary'): Promise<string> {
    try {
      let objectName: string;
      let fileName: string;

      if (type === 'transcription') {
        fileName = `${uploadId}-transcription.txt`;
        objectName = `audio/transcriptions/${userId}/${fileName}`;
      } else if (type === 'summary') {
        fileName = `${uploadId}-summary.txt`;
        objectName = `summaries/${userId}/${fileName}`;
      } else {
        fileName = `${uploadId}-${type}.txt`;
        objectName = `${type}/${userId}/${fileName}`;
      }

      const path = await this.minioClientService.uploadFile(
        this.resultsBucket,
        objectName,
        Buffer.from(summaryText, 'utf-8'),
        'text/plain',
      );

      this.logger.log(`${type === 'transcription' ? 'Transcription' : 'Summary'} uploaded: ${path} (${summaryText.length} bytes)`);
      return path;
    } catch (error: any) {
      this.logger.error(`Error uploading ${type}: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  async uploadAudioFile(userId: string, uploadId: string, fileBuffer: Buffer, fileName: string): Promise<string> {
    try {
      const audioFileName = `${uploadId}-${fileName}`;
      const objectName = `audio/files/${userId}/${audioFileName}`;

      const path = await this.minioClientService.uploadFile(
        this.resultsBucket,
        objectName,
        fileBuffer,
        'audio/wav',
      );

      this.logger.log(`Audio file uploaded: ${path} (${fileBuffer.length} bytes)`);
      return path;
    } catch (error: any) {
      this.logger.error(`Error uploading audio file: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  async uploadOcrResult(userId: string, uploadId: string, ocrText: string): Promise<string> {
    try {
      const ocrFileName = `${uploadId}-ocr.txt`;
      const objectName = `ocr/${userId}/${ocrFileName}`;

      const path = await this.minioClientService.uploadFile(
        this.resultsBucket,
        objectName,
        Buffer.from(ocrText, 'utf-8'),
        'text/plain',
      );

      this.logger.log(`OCR result uploaded: ${path} (${ocrText.length} bytes)`);
      return path;
    } catch (error: any) {
      this.logger.error(`Error uploading OCR result: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  async moveToTemp(sourcePath: string, fileName: string): Promise<string> {
    try {
      // Download from documents bucket
      const buffer = await this.minioClientService.downloadFile(
        this.documentBucket,
        sourcePath,
      );

      // Upload to temp bucket
      const tempObjectName = `failed/${fileName}-${Date.now()}`;
      const path = await this.minioClientService.uploadFile(
        this.tempBucket,
        tempObjectName,
        buffer,
        'application/octet-stream',
      );

      // Delete from documents bucket
      await this.minioClientService.deleteFile(this.documentBucket, sourcePath);

      this.logger.log(`File moved to temp: ${path}`);
      return path;
    } catch (error: any) {
      this.logger.error(`Error moving file to temp: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  async downloadDocument(userId: string, path: string): Promise<Buffer> {
    try {
      // Validar que el usuario puede acceder a este archivo
      if (!path.includes(userId)) {
        throw new BadRequestException('Unauthorized access to this document');
      }

      const buffer = await this.minioClientService.downloadFile(
        this.documentBucket,
        path,
      );

      this.logger.log(`Document downloaded: ${path}`);
      return buffer;
    } catch (error: any) {
      if (error?.code === 'NoSuchKey') {
        throw new NotFoundException('Document not found');
      }
      this.logger.error(`Error downloading document: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  async deleteDocument(userId: string, path: string): Promise<void> {
    try {
      // Validar que el usuario puede eliminar este archivo
      if (!path.includes(userId)) {
        throw new BadRequestException('Unauthorized access to this document');
      }

      await this.minioClientService.deleteFile(this.documentBucket, path);
      this.logger.log(`Document deleted: ${path}`);
    } catch (error: any) {
      if (error?.code === 'NoSuchKey') {
        throw new NotFoundException('Document not found');
      }
      this.logger.error(`Error deleting document: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  // Internal method for rollback - no authorization check
  async deleteDocumentInternal(path: string): Promise<void> {
    try {
      await this.minioClientService.deleteFile(this.documentBucket, path);
      this.logger.log(`Document deleted (internal): ${path}`);
    } catch (error: any) {
      // Log but don't throw - best effort cleanup
      if (error?.code !== 'NoSuchKey') {
        this.logger.warn(`Failed to delete document during rollback: ${path}`, error?.message);
      }
    }
  }

  async getDocumentUrl(userId: string, path: string, expiryHours: number = 24): Promise<string> {
    try {
      // Validar que el usuario puede acceder a este archivo
      if (!path.includes(userId)) {
        throw new BadRequestException('Unauthorized access to this document');
      }

      const url = await this.minioClientService.getFileUrl(
        this.documentBucket,
        path,
        expiryHours * 60 * 60,
      );

      return url;
    } catch (error: any) {
      this.logger.error(`Error generating document URL: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  async listUserDocuments(userId: string): Promise<any[]> {
    try {
      const files = await this.minioClientService.listFiles(
        this.documentBucket,
        userId,
      );

      return files.map((file) => ({
        name: file.name,
        size: file.size,
        lastModified: file.lastModified,
        etag: file.etag,
      }));
    } catch (error: any) {
      this.logger.error(`Error listing documents: ${error?.message}`, error?.stack);
      throw error;
    }
  }
}
