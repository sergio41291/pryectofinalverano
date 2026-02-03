import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets, In } from 'typeorm';
import { Upload } from './entities/upload.entity';
import { StorageService } from '../storage/storage.service';
import { SearchUploadsDto } from './dto/search-uploads.dto';
import { Category } from '../../entities/category.entity';
import { GroupMember } from '../../entities/group-member.entity';
import { DocumentShare } from '../../entities/document-share.entity';
import { User } from '../users/entities/user.entity';
import { ShareDocumentDto, DocumentShareResponseDto } from './dto/share-document.dto';

@Injectable()
export class UploadsService {
  constructor(
    @InjectRepository(Upload)
    private readonly uploadsRepository: Repository<Upload>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(DocumentShare)
    private readonly documentShareRepository: Repository<DocumentShare>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
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
    // Get user's groups to find shared categories
    const memberGroups = await this.groupMemberRepository.find({
      where: { userId },
      select: ['groupId'],
    });

    const groupIds = memberGroups.map((gm) => gm.groupId);

    // Get accessible category IDs (own + shared with user's groups)
    const accessibleCategories = await this.categoryRepository
      .createQueryBuilder('category')
      .where(
        new Brackets((qb) => {
          qb.where('category.userId = :userId', { userId });
          if (groupIds.length > 0) {
            qb.orWhere('category.sharedWithGroupId IN (:...groupIds)', { groupIds });
          }
        })
      )
      .select(['category.id'])
      .getMany();

    const accessibleCategoryIds = accessibleCategories.map((cat) => cat.id);

    // Build query to get own uploads + uploads in shared categories
    const queryBuilder = this.uploadsRepository
      .createQueryBuilder('upload')
      .leftJoinAndSelect('upload.ocrResults', 'ocrResults')
      .leftJoinAndSelect('upload.category', 'category')
      .where(
        new Brackets((qb) => {
          qb.where('upload.userId = :userId', { userId });
          // Include documents in shared categories
          if (accessibleCategoryIds.length > 0) {
            qb.orWhere('upload.categoryId IN (:...categoryIds)', { categoryIds: accessibleCategoryIds });
          }
        })
      )
      .orderBy('upload.createdAt', 'DESC')
      .take(limit)
      .skip(offset);

    return queryBuilder.getManyAndCount();
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

    try {
      // Delete file from MinIO storage (best effort)
      if (upload.minioPath) {
        await this.storageService.deleteDocument(userId, upload.minioPath);
      }
    } catch (error: any) {
      // Log but continue with database deletion
      console.error(`Failed to delete file from storage: ${error?.message}`);
    }

    // Delete from database (this will cascade delete OCR results automatically)
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

  /**
   * Advanced search with filters
   */
  async search(userId: string, dto: SearchUploadsDto): Promise<{ uploads: Upload[]; total: number; page: number; totalPages: number }> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    // Get user's groups to find shared categories
    const memberGroups = await this.groupMemberRepository.find({
      where: { userId },
      select: ['groupId'],
    });

    const groupIds = memberGroups.map((gm) => gm.groupId);

    // Get accessible category IDs (own + shared with user's groups)
    const accessibleCategories = await this.categoryRepository
      .createQueryBuilder('category')
      .where(
        new Brackets((qb) => {
          qb.where('category.userId = :userId', { userId });
          if (groupIds.length > 0) {
            qb.orWhere('category.sharedWithGroupId IN (:...groupIds)', { groupIds });
          }
        })
      )
      .select(['category.id'])
      .getMany();

    const accessibleCategoryIds = accessibleCategories.map((cat) => cat.id);

    const queryBuilder = this.uploadsRepository
      .createQueryBuilder('upload')
      .leftJoinAndSelect('upload.category', 'category')
      .where(
        new Brackets((qb) => {
          qb.where('upload.userId = :userId', { userId });
          // Include documents in shared categories
          if (accessibleCategoryIds.length > 0) {
            qb.orWhere('upload.categoryId IN (:...categoryIds)', { categoryIds: accessibleCategoryIds });
          }
        })
      );

    // Text search (full-text on fileName and extractedText)
    if (dto.query) {
      queryBuilder.andWhere(
        new Brackets((qb) => {
          qb.where("to_tsvector('spanish', upload.fileName) @@ plainto_tsquery('spanish', :query)", { query: dto.query })
            .orWhere("to_tsvector('spanish', COALESCE(upload.extractedText, '')) @@ plainto_tsquery('spanish', :query)", { query: dto.query })
            .orWhere('upload.fileName ILIKE :likeQuery', { likeQuery: `%${dto.query}%` });
        })
      );
    }

    // Category filter
    if (dto.categoryId) {
      queryBuilder.andWhere('upload.categoryId = :categoryId', { categoryId: dto.categoryId });
    }

    // Date range filters
    if (dto.dateFrom) {
      queryBuilder.andWhere('upload.createdAt >= :dateFrom', { dateFrom: dto.dateFrom });
    }
    if (dto.dateTo) {
      queryBuilder.andWhere('upload.createdAt <= :dateTo', { dateTo: dto.dateTo });
    }

    // Status filter
    if (dto.status) {
      queryBuilder.andWhere('upload.status = :status', { status: dto.status });
    }

    // MIME type filter
    if (dto.mimeType) {
      queryBuilder.andWhere('upload.mimeType LIKE :mimeType', { mimeType: `%${dto.mimeType}%` });
    }

    // Execute with pagination
    const [uploads, total] = await queryBuilder
      .orderBy('upload.createdAt', 'DESC')
      .take(limit)
      .skip(skip)
      .getManyAndCount();

    return {
      uploads,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Share document with another user
   */
  async shareDocument(uploadId: string, userId: string, dto: ShareDocumentDto): Promise<DocumentShareResponseDto> {
    // Verify document ownership
    const upload = await this.findByUserIdAndUploadId(userId, uploadId);

    // Find user to share with
    const sharedWithUser = await this.userRepository.findOne({
      where: { email: dto.userEmail },
    });

    if (!sharedWithUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (sharedWithUser.id === userId) {
      throw new BadRequestException('No puedes compartir un documento contigo mismo');
    }

    // Check if already shared
    const existingShare = await this.documentShareRepository.findOne({
      where: {
        uploadId,
        sharedWithUserId: sharedWithUser.id,
      },
    });

    if (existingShare) {
      throw new BadRequestException('Este documento ya está compartido con este usuario');
    }

    // Create share
    const share = this.documentShareRepository.create({
      uploadId,
      sharedByUserId: userId,
      sharedWithUserId: sharedWithUser.id,
      permission: dto.permission,
    });

    const saved = await this.documentShareRepository.save(share);

    // Return with relations
    return this.getShareWithRelations(saved.id);
  }

  /**
   * Remove document share
   */
  async unshareDocument(uploadId: string, userId: string, shareId: string): Promise<void> {
    const share = await this.documentShareRepository.findOne({
      where: { id: shareId, uploadId },
    });

    if (!share) {
      throw new NotFoundException('Compartición no encontrada');
    }

    // Only owner can unshare
    if (share.sharedByUserId !== userId) {
      throw new ForbiddenException('Solo el propietario puede dejar de compartir');
    }

    await this.documentShareRepository.delete(shareId);
  }

  /**
   * Get users with whom document is shared
   */
  async getDocumentShares(uploadId: string, userId: string): Promise<DocumentShareResponseDto[]> {
    // Verify document ownership
    await this.findByUserIdAndUploadId(userId, uploadId);

    const shares = await this.documentShareRepository.find({
      where: { uploadId },
      relations: ['sharedWith', 'sharedBy'],
      order: { sharedAt: 'DESC' },
    });

    return shares.map((share) => this.mapShareToDto(share));
  }

  /**
   * Get documents shared with me
   */
  async getSharedWithMe(userId: string, page: number = 1, limit: number = 20): Promise<{ uploads: Upload[]; total: number; page: number; totalPages: number }> {
    const skip = (page - 1) * limit;

    const [shares, total] = await this.documentShareRepository.findAndCount({
      where: { sharedWithUserId: userId },
      relations: ['upload', 'upload.category', 'sharedBy'],
      order: { sharedAt: 'DESC' },
      take: limit,
      skip,
    });

    const uploads = shares.map((share) => ({
      ...share.upload,
      sharedBy: share.sharedBy,
      sharedAt: share.sharedAt,
      sharePermission: share.permission,
    }));

    return {
      uploads,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Check if user has access to document (owner or shared)
   */
  async checkDocumentAccess(uploadId: string, userId: string): Promise<{ hasAccess: boolean; permission: 'owner' | 'view' | 'edit' }> {
    // Check if owner
    const upload = await this.uploadsRepository.findOne({
      where: { id: uploadId, userId },
    });

    if (upload) {
      return { hasAccess: true, permission: 'owner' };
    }

    // Check if shared
    const share = await this.documentShareRepository.findOne({
      where: { uploadId, sharedWithUserId: userId },
    });

    if (share) {
      return { hasAccess: true, permission: share.permission };
    }

    return { hasAccess: false, permission: 'view' };
  }

  private async getShareWithRelations(shareId: string): Promise<DocumentShareResponseDto> {
    const share = await this.documentShareRepository.findOne({
      where: { id: shareId },
      relations: ['sharedBy', 'sharedWith', 'upload'],
    });

    if (!share) {
      throw new NotFoundException('Compartición no encontrada');
    }

    return this.mapShareToDto(share);
  }

  private mapShareToDto(share: DocumentShare): DocumentShareResponseDto {
    return {
      id: share.id,
      uploadId: share.uploadId,
      sharedByUserId: share.sharedByUserId,
      sharedWithUserId: share.sharedWithUserId,
      permission: share.permission,
      sharedAt: share.sharedAt,
      sharedBy: share['sharedBy'] ? {
        id: share['sharedBy'].id,
        email: share['sharedBy'].email,
        firstName: share['sharedBy'].firstName,
        lastName: share['sharedBy'].lastName,
      } : undefined,
      sharedWith: share['sharedWith'] ? {
        id: share['sharedWith'].id,
        email: share['sharedWith'].email,
        firstName: share['sharedWith'].firstName,
        lastName: share['sharedWith'].lastName,
      } : undefined,
      upload: share['upload'] ? {
        id: share['upload'].id,
        fileName: share['upload'].fileName,
        originalFileName: share['upload'].originalFileName,
        mimeType: share['upload'].mimeType,
        fileSize: share['upload'].fileSize,
        status: share['upload'].status,
      } : undefined,
    };
  }
}
