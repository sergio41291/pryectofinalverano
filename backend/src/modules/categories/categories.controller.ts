import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CategoryResponseDto } from './dto/category-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';

@Controller('categories')
@UseGuards(JwtAuthGuard)
export class CategoriesController {
  private readonly logger = new Logger(CategoriesController.name);

  constructor(private readonly categoriesService: CategoriesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @GetUser('id') userId: string,
    @Body() dto: CreateCategoryDto,
  ): Promise<CategoryResponseDto> {
    this.logger.log(`Creating category for user ${userId}: ${dto.name}`);
    return this.categoriesService.create(userId, dto);
  }

  @Get()
  async findAll(@GetUser('id') userId: string): Promise<CategoryResponseDto[]> {
    return this.categoriesService.findAll(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @GetUser('id') userId: string): Promise<CategoryResponseDto> {
    return this.categoriesService.findOne(id, userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @GetUser('id') userId: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    this.logger.log(`Updating category ${id} for user ${userId}`);
    return this.categoriesService.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @GetUser('id') userId: string): Promise<void> {
    this.logger.log(`Deleting category ${id} for user ${userId}`);
    return this.categoriesService.remove(id, userId);
  }

  @Post(':categoryId/documents/:documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async assignDocument(
    @Param('categoryId') categoryId: string,
    @Param('documentId') documentId: string,
    @GetUser('id') userId: string,
  ): Promise<void> {
    return this.categoriesService.assignDocument(documentId, categoryId, userId);
  }

  @Delete('documents/:documentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeDocument(@Param('documentId') documentId: string, @GetUser('id') userId: string): Promise<void> {
    return this.categoriesService.removeDocument(documentId, userId);
  }

  @Post(':categoryId/share-with-group/:groupId')
  async shareWithGroup(
    @Param('categoryId') categoryId: string,
    @Param('groupId') groupId: string,
    @GetUser('id') userId: string,
  ) {
    this.logger.log(`Sharing category ${categoryId} with group ${groupId}`);
    return this.categoriesService.shareWithGroup(categoryId, groupId, userId);
  }

  @Delete(':categoryId/unshare-from-group')
  async unshareFromGroup(
    @Param('categoryId') categoryId: string,
    @GetUser('id') userId: string,
  ) {
    this.logger.log(`Unsharing category ${categoryId} from group`);
    return this.categoriesService.unshareFromGroup(categoryId, userId);
  }
}
