import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { User } from '../../modules/users/entities/user.entity';
import { Upload } from '../../modules/uploads/entities/upload.entity';
import { Group } from '../../entities/group.entity';
import { MindMap } from '../../entities/mind-map.entity';

export enum LimitType {
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  GROUP_CREATION = 'GROUP_CREATION',
  STORAGE_SIZE = 'STORAGE_SIZE',
  MIND_MAP_CREATION = 'MIND_MAP_CREATION',
}

export const SUBSCRIPTION_LIMITS = 'subscriptionLimits';

interface SubscriptionLimitMetadata {
  type: LimitType;
  resourceKey?: string; // Clave del body/params para validar tamaño
}

// Límites por tier
const TIER_LIMITS = {
  free: {
    maxDocumentsPerMonth: 5,
    maxStorageBytes: 10 * 1024 * 1024, // 10MB
    maxGroups: 0, // Sin grupos
    maxMindMaps: 5,
    maxFileSize: 10 * 1024 * 1024, // 10MB por archivo
  },
  pro: {
    maxDocumentsPerMonth: 100,
    maxStorageBytes: 5 * 1024 * 1024 * 1024, // 5GB
    maxGroups: 5,
    maxMindMaps: 100,
    maxFileSize: 100 * 1024 * 1024, // 100MB por archivo
  },
  business: {
    maxDocumentsPerMonth: Infinity, // Ilimitado
    maxStorageBytes: Infinity, // Ilimitado
    maxGroups: Infinity, // Ilimitado
    maxMindMaps: Infinity,
    maxFileSize: 500 * 1024 * 1024, // 500MB por archivo
  },
};

@Injectable()
export class SubscriptionLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Upload)
    private uploadRepository: Repository<Upload>,
    @InjectRepository(Group)
    private groupRepository: Repository<Group>,
    @InjectRepository(MindMap)
    private mindMapRepository: Repository<MindMap>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const limitMetadata = this.reflector.get<SubscriptionLimitMetadata>(
      SUBSCRIPTION_LIMITS,
      context.getHandler(),
    );

    if (!limitMetadata) {
      return true; // Sin metadatos = sin límites
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.userId && !user.id) {
      throw new ForbiddenException('Usuario no autenticado');
    }

    const userId = user.userId || user.id;

    // Obtener el usuario completo con subscriptionTier
    const fullUser = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!fullUser) {
      throw new ForbiddenException('Usuario no encontrado');
    }

    const tier = fullUser.subscriptionTier || 'free';
    const limits = TIER_LIMITS[tier];

    switch (limitMetadata.type) {
      case LimitType.DOCUMENT_UPLOAD:
        return this.checkDocumentUploadLimit(userId, limits, request);

      case LimitType.GROUP_CREATION:
        return this.checkGroupCreationLimit(userId, limits);

      case LimitType.STORAGE_SIZE:
        return this.checkStorageLimit(userId, limits, request);

      case LimitType.MIND_MAP_CREATION:
        return this.checkMindMapCreationLimit(userId, limits);

      default:
        return true;
    }
  }

  private async checkDocumentUploadLimit(
    userId: string,
    limits: any,
    request: any,
  ): Promise<boolean> {
    // Validar número de documentos en el mes actual
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const documentsThisMonth = await this.uploadRepository.count({
      where: {
        userId,
        createdAt: MoreThanOrEqual(currentMonth),
      },
    });

    if (documentsThisMonth >= limits.maxDocumentsPerMonth) {
      throw new ForbiddenException(
        `Has alcanzado el límite de ${limits.maxDocumentsPerMonth} documentos por mes. Actualiza tu suscripción para continuar.`,
      );
    }

    // Validar tamaño del archivo
    const fileSize = request.file?.size || 0;
    if (fileSize > limits.maxFileSize) {
      const maxMB = (limits.maxFileSize / (1024 * 1024)).toFixed(0);
      throw new BadRequestException(
        `El archivo excede el tamaño máximo de ${maxMB}MB para tu plan.`,
      );
    }

    return true;
  }

  private async checkGroupCreationLimit(userId: string, limits: any): Promise<boolean> {
    const currentGroups = await this.groupRepository.count({
      where: { ownerId: userId },
    });

    if (currentGroups >= limits.maxGroups) {
      if (limits.maxGroups === 0) {
        throw new ForbiddenException(
          'Tu plan gratuito no incluye grupos colaborativos. Actualiza a PRO o BUSINESS para crear grupos.',
        );
      }

      throw new ForbiddenException(
        `Has alcanzado el límite de ${limits.maxGroups} grupos. Actualiza tu suscripción para continuar.`,
      );
    }

    return true;
  }

  private async checkStorageLimit(userId: string, limits: any, request: any): Promise<boolean> {
    // Calcular almacenamiento total usado
    const uploads = await this.uploadRepository.find({
      where: { userId },
      select: ['fileSize'],
    });

    const totalStorage = uploads.reduce((sum, upload) => sum + (upload.fileSize || 0), 0);
    const newFileSize = request.file?.size || 0;

    if (totalStorage + newFileSize > limits.maxStorageBytes) {
      const maxGB = (limits.maxStorageBytes / (1024 * 1024 * 1024)).toFixed(2);
      throw new ForbiddenException(
        `Has alcanzado el límite de almacenamiento de ${maxGB}GB. Actualiza tu suscripción para continuar.`,
      );
    }

    return true;
  }

  private async checkMindMapCreationLimit(userId: string, limits: any): Promise<boolean> {
    const currentMindMaps = await this.mindMapRepository.count({
      where: { userId },
    });

    if (currentMindMaps >= limits.maxMindMaps) {
      throw new ForbiddenException(
        `Has alcanzado el límite de ${limits.maxMindMaps} mapas mentales. Actualiza tu suscripción para continuar.`,
      );
    }

    return true;
  }
}

// Decorador para aplicar el guard con facilidad
export const SubscriptionLimit = (type: LimitType, resourceKey?: string) =>
  Reflect.metadata(SUBSCRIPTION_LIMITS, { type, resourceKey });
