import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Upload } from './entities/upload.entity';

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(Upload)
    private readonly uploadsRepository: Repository<Upload>,
  ) {}

  async create(uploadData: Partial<Upload>): Promise<Upload> {
    const upload = this.uploadsRepository.create(uploadData);
    return this.uploadsRepository.save(upload);
  }

  async findById(id: string): Promise<Upload> {
    const upload = await this.uploadsRepository.findOne({ where: { id } });

    if (!upload) {
      throw new NotFoundException(`Upload with ID ${id} not found`);
    }

    return upload;
  }

  async findByUserId(userId: string, limit: number = 20, offset: number = 0): Promise<[Upload[], number]> {
    return this.uploadsRepository.findAndCount({
      where: { userId },
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

  async delete(id: string): Promise<void> {
    const result = await this.uploadsRepository.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Upload with ID ${id} not found`);
    }
  }
}
