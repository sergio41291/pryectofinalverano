import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../../entities/category.entity';
import { Upload } from '../uploads/entities/upload.entity';import { Group } from '../../entities/group.entity';
import { GroupMember } from '../../entities/group-member.entity';import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Upload)
    private readonly uploadRepository: Repository<Upload>,
    @InjectRepository(Group)
    private readonly groupRepository: Repository<Group>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
  ) {}

  /**
   * Create a new category
   */
  async create(userId: string, dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const category = this.categoryRepository.create({
      userId,
      name: dto.name,
      description: dto.description,
      color: dto.color || '#6366f1',
      icon: dto.icon,
    });

    const saved = await this.categoryRepository.save(category);
    this.logger.log(`Category created: ${saved.id} by user ${userId}`);

    return this.mapToResponseDto(saved);
  }

  /**
   * Get all categories for a user
   */
  async findAll(userId: string): Promise<CategoryResponseDto[]> {
    // Get user's own categories
    const ownCategories = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.uploads', 'upload')
      .leftJoinAndSelect('category.sharedWithGroup', 'group')
      .where('category.userId = :userId', { userId })
      .orderBy('category.createdAt', 'DESC')
      .getMany();

    // Get categories shared with groups where user is a member
    const memberGroups = await this.groupMemberRepository.find({
      where: { userId },
      select: ['groupId'],
    });

    const groupIds = memberGroups.map((gm: GroupMember) => gm.groupId);

    let sharedCategories: Category[] = [];
    if (groupIds.length > 0) {
      sharedCategories = await this.categoryRepository
        .createQueryBuilder('category')
        .leftJoinAndSelect('category.uploads', 'upload')
        .leftJoinAndSelect('category.sharedWithGroup', 'group')
        .where('category.sharedWithGroupId IN (:...groupIds)', { groupIds })
        .andWhere('category.userId != :userId', { userId })
        .orderBy('category.createdAt', 'DESC')
        .getMany();
    }

    const allCategories = [...ownCategories, ...sharedCategories];

    return allCategories.map((cat) => ({
      ...this.mapToResponseDto(cat),
      sharedWithGroupId: cat.sharedWithGroupId,
      sharedWithGroup: cat.sharedWithGroup ? {
        id: cat.sharedWithGroup.id,
        name: cat.sharedWithGroup.name,
      } : undefined,
      documentCount: cat.uploads?.length || 0,
    }));
  }

  /**
   * Get a single category by ID
   */
  async findOne(id: string, userId: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id, userId },
      relations: ['uploads'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      ...this.mapToResponseDto(category),
      documentCount: category.uploads?.length || 0,
    };
  }

  /**
   * Update a category
   */
  async update(id: string, userId: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    Object.assign(category, dto);
    const updated = await this.categoryRepository.save(category);

    this.logger.log(`Category updated: ${id} by user ${userId}`);
    return this.mapToResponseDto(updated);
  }

  /**
   * Delete a category
   */
  async remove(id: string, userId: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id, userId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Set categoryId to null for all uploads in this category
    await this.uploadRepository.update({ categoryId: id }, { categoryId: null });

    await this.categoryRepository.remove(category);
    this.logger.log(`Category deleted: ${id} by user ${userId}`);
  }

  /**
   * Assign a document to a category
   */
  async assignDocument(documentId: string, categoryId: string, userId: string): Promise<void> {
    // Verify category ownership
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, userId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Verify document ownership
    const upload = await this.uploadRepository.findOne({
      where: { id: documentId, userId },
    });

    if (!upload) {
      throw new NotFoundException('Document not found');
    }

    // Assign
    upload.categoryId = categoryId;
    await this.uploadRepository.save(upload);

    this.logger.log(`Document ${documentId} assigned to category ${categoryId}`);
  }

  /**
   * Remove document from category
   */
  async removeDocument(documentId: string, userId: string): Promise<void> {
    const upload = await this.uploadRepository.findOne({
      where: { id: documentId, userId },
    });

    if (!upload) {
      throw new NotFoundException('Document not found');
    }

    upload.categoryId = null;
    await this.uploadRepository.save(upload);

    this.logger.log(`Document ${documentId} removed from category`);
  }

  /**
   * Share category with a group
   */
  async shareWithGroup(categoryId: string, groupId: string, userId: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, userId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const group = await this.groupRepository.findOne({
      where: { id: groupId },
    });

    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Verify user is member of the group
    const isMember = await this.groupMemberRepository.findOne({
      where: { groupId, userId },
    });

    if (!isMember) {
      throw new ForbiddenException('You must be a member of the group to share with it');
    }

    category.sharedWithGroupId = groupId;
    await this.categoryRepository.save(category);

    const updated = await this.categoryRepository.findOne({
      where: { id: categoryId },
      relations: ['sharedWithGroup', 'uploads'],
    });

    if (!updated) {
      throw new NotFoundException('Category not found after update');
    }

    this.logger.log(`Category ${categoryId} shared with group ${groupId}`);

    return {
      ...this.mapToResponseDto(updated),
      sharedWithGroupId: updated.sharedWithGroupId || undefined,
      sharedWithGroup: updated.sharedWithGroup ? {
        id: updated.sharedWithGroup.id,
        name: updated.sharedWithGroup.name,
      } : undefined,
      documentCount: updated.uploads?.length || 0,
    };
  }

  /**
   * Unshare category from group
   */
  async unshareFromGroup(categoryId: string, userId: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId, userId },
      relations: ['uploads'],
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    category.sharedWithGroupId = null as any;
    await this.categoryRepository.save(category);

    this.logger.log(`Category ${categoryId} unshared from group`);

    return {
      ...this.mapToResponseDto(category),
      sharedWithGroupId: undefined,
      documentCount: category.uploads?.length || 0,
    };
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(category: Category): CategoryResponseDto {
    return {
      id: category.id,
      userId: category.userId,
      name: category.name,
      description: category.description,
      color: category.color,
      icon: category.icon,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
