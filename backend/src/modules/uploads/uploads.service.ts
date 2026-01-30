import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Upload } from './entities/upload.entity';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(Upload)
    private readonly uploadsRepository: Repository<Upload>,
    private readonly storageService: StorageService,
  ) {}

  async create(uploadData: Partial<Upload>): Promise<Upload> {
    const upload = this.uploadsRepository.create(uploadData);
    return this.uploadsRepository.save(upload);
  }

  async createFromFile(userId: string, file: Express.Multer.File): Promise<Upload> {
    // Create database record FIRST (without MinIO upload)
    const upload = this.uploadsRepository.create({
      userId,
      fileName: file.originalname.split('.')[0],
      originalFileName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      minioPath: '', // Will be set after successful OCR
      status: 'pending',
      fileBuffer: file.buffer, // Store temporarily for OCR processing
    });

    return this.uploadsRepository.save(upload);
  }

  async findById(id: string): Promise<Upload> {
    const upload = await this.uploadsRepository
      .createQueryBuilder('upload')
      .where('upload.id = :id', { id })
      .addSelect('upload.fileBuffer')
      .getOne();

    if (!upload) {
      throw new NotFoundException(`Upload with ID ${id} not found`);
    }

    return upload;
  }

  async findByUserIdAndUploadId(userId: string, uploadId: string): Promise<Upload> {
    const upload = await this.uploadsRepository.findOne({
      where: { id: uploadId, userId },
    });

    if (!upload) {
      throw new NotFoundException(`Upload not found`);
    }

    return upload;
  }

  async findByUserId(userId: string, limit: number = 20, offset: number = 0): Promise<[Upload[], number]> {
    return this.uploadsRepository.findAndCount({
      where: { userId },
      relations: ['ocrResults'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async update(id: string, updateData: Partial<Upload>): Promise<Upload> {
    await this.findById(id);
    await this.uploadsRepository.update(id, updateData);
    return this.findById(id);
  }

  async updateStatus(id: string, status: 'pending' | 'processing' | 'completed' | 'failed'): Promise<Upload> {
    const upload = await this.findById(id);
    upload.status = status;

    if (status === 'completed') {
      upload.processedAt = new Date();
    }

    return this.uploadsRepository.save(upload);
  }

  async delete(userId: string, id: string): Promise<void> {
    const upload = await this.findByUserIdAndUploadId(userId, id);

    // Delete from MinIO
    await this.storageService.deleteDocument(userId, upload.minioPath);

    // Delete from database
    const result = await this.uploadsRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Upload with ID ${id} not found`);
    }
  }

  async getDownloadUrl(userId: string, id: string): Promise<string> {
    const upload = await this.findByUserIdAndUploadId(userId, id);
    return this.storageService.getDocumentUrl(userId, upload.minioPath, 24);
  }

  async deleteUploadAndFile(uploadId: string): Promise<void> {
    const upload = await this.findById(uploadId);

    try {
      // Delete file from MinIO storage (best effort)
      if (upload.minioPath) {
        await this.storageService.deleteDocumentInternal(upload.minioPath);
      }
    } catch (error: any) {
      // Log but continue with database deletion
      console.error(`Failed to delete file from storage: ${error?.message}`);
    }

    // Delete database record and associated OCR results
    try {
      // Delete OCR results first (explicit deletion before Upload record)
      if (upload.ocrResults && upload.ocrResults.length > 0) {
        await this.uploadsRepository
          .createQueryBuilder()
          .delete()
          .from('ocr_results')
          .where('uploadId = :uploadId', { uploadId })
          .execute();
      }

      // Then delete the Upload record
      await this.uploadsRepository.delete(uploadId);
    } catch (error: any) {
      console.error(`Failed to delete upload record: ${error?.message}`);
      throw error;
    }
  }
}
