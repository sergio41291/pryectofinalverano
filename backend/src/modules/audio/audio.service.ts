import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AudioResult, AudioResultStatus } from './entities/audio-result.entity';
import { CreateAudioResultDto } from './dto/create-audio-result.dto';

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);

  constructor(
    @InjectRepository(AudioResult)
    private readonly audioResultRepository: Repository<AudioResult>,
    @InjectQueue('audio')
    private readonly audioQueue: Queue,
  ) {}

  async initiateAudioProcessing(dto: CreateAudioResultDto): Promise<AudioResult> {
    try {
      // Crear registro de resultado de audio en base de datos
      const audioResult = this.audioResultRepository.create({
        uploadId: dto.uploadId,
        userId: dto.userId,
        language: dto.language || 'es',
        status: AudioResultStatus.PENDING,
      });

      const savedResult = await this.audioResultRepository.save(audioResult);

      // Encolar trabajo de procesamiento
      const job = await this.audioQueue.add(
        {
          uploadId: dto.uploadId,
          userId: dto.userId,
          audioResultId: savedResult.id,
          language: dto.language || null, // null para detección automática
        },
        {
          attempts: 1,
          removeOnComplete: false,
          removeOnFail: false,
        },
      );

      // Guardar jobId
      savedResult.jobId = job.id.toString();
      savedResult.status = AudioResultStatus.PROCESSING;
      await this.audioResultRepository.save(savedResult);

      this.logger.log(`Audio job initiated: ${job.id} for upload ${dto.uploadId}`);
      return savedResult;
    } catch (error: any) {
      this.logger.error(`Error initiating audio processing: ${error?.message}`, error?.stack);
      throw new BadRequestException('Failed to initiate audio processing');
    }
  }

  async getAudioResult(userId: string, uploadId: string): Promise<AudioResult> {
    try {
      const result = await this.audioResultRepository.findOne({
        where: {
          uploadId,
          userId,
        },
      });

      if (!result) {
        throw new NotFoundException('Audio result not found');
      }

      return result;
    } catch (error: any) {
      this.logger.error(`Error getting audio result: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  async getAudioResultById(id: string): Promise<AudioResult> {
    const result = await this.audioResultRepository.findOneBy({ id });
    if (!result) {
      throw new NotFoundException('Audio result not found');
    }
    return result;
  }

  async getAllAudioResults(userId: string): Promise<AudioResult[]> {
    return await this.audioResultRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async updateAudioResult(
    id: string,
    updates: Partial<AudioResult>,
  ): Promise<AudioResult> {
    await this.audioResultRepository.update(id, updates);
    return this.getAudioResultById(id);
  }

  async deleteAudioResult(id: string): Promise<void> {
    await this.audioResultRepository.delete(id);
  }
}
