import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { OcrResult } from './entities/ocr-result.entity';
import { CreateOcrResultDto } from './dto/create-ocr-result.dto';

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(
    @InjectRepository(OcrResult)
    private readonly ocrResultRepository: Repository<OcrResult>,
    @InjectQueue('ocr')
    private readonly ocrQueue: Queue,
  ) {}

  async initiateOcrProcessing(dto: CreateOcrResultDto): Promise<OcrResult> {
    try {
      // Crear registro OCR en base de datos
      const ocrResult = this.ocrResultRepository.create({
        uploadId: dto.uploadId,
        userId: dto.userId,
        status: 'pending',
      });

      const savedResult = await this.ocrResultRepository.save(ocrResult);

      // Encolar trabajo de procesamiento
      const job = await this.ocrQueue.add(
        {
          uploadId: dto.uploadId,
          userId: dto.userId,
          ocrResultId: savedResult.id,
          language: dto.language || 'es',
        },
        {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: false,
          removeOnFail: false,
        },
      );

      // Guardar jobId
      savedResult.jobId = job.id.toString();
      savedResult.status = 'processing';
      await this.ocrResultRepository.save(savedResult);

      this.logger.log(`OCR job initiated: ${job.id} for upload ${dto.uploadId}`);
      return savedResult;
    } catch (error: any) {
      this.logger.error(`Error initiating OCR processing: ${error?.message}`, error?.stack);
      throw new BadRequestException('Failed to initiate OCR processing');
    }
  }

  async getOcrResult(userId: string, uploadId: string): Promise<OcrResult> {
    try {
      const result = await this.ocrResultRepository.findOne({
        where: {
          uploadId,
          userId,
        },
      });

      if (!result) {
        throw new NotFoundException('OCR result not found');
      }

      return result;
    } catch (error: any) {
      this.logger.error(`Error fetching OCR result: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  async getOcrResultById(id: string, userId: string): Promise<OcrResult> {
    try {
      const result = await this.ocrResultRepository.findOne({
        where: {
          id,
          userId,
        },
      });

      if (!result) {
        throw new NotFoundException('OCR result not found');
      }

      return result;
    } catch (error: any) {
      this.logger.error(`Error fetching OCR result by ID: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  async updateOcrResult(
    id: string,
    updates: Partial<OcrResult>,
  ): Promise<OcrResult> {
    try {
      await this.ocrResultRepository.update(id, updates);
      const updated = await this.ocrResultRepository.findOneBy({ id });

      if (!updated) {
        throw new NotFoundException('OCR result not found');
      }

      return updated;
    } catch (error: any) {
      this.logger.error(`Error updating OCR result: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  async listUserOcrResults(userId: string, limit: number = 20, offset: number = 0): Promise<{ results: OcrResult[]; total: number }> {
    try {
      const [results, total] = await this.ocrResultRepository.findAndCount({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: limit,
        skip: offset,
      });

      return { results, total };
    } catch (error: any) {
      this.logger.error(`Error listing OCR results: ${error?.message}`, error?.stack);
      throw error;
    }
  }
}
