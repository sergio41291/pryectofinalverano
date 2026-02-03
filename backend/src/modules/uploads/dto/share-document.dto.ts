import { IsEmail, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { SharePermission } from '../../../entities/document-share.entity';

export class ShareDocumentDto {
  @IsEmail()
  userEmail: string;

  @IsEnum(SharePermission)
  @IsOptional()
  permission?: SharePermission = SharePermission.VIEW;
}

export class UpdateSharePermissionDto {
  @IsEnum(SharePermission)
  permission: SharePermission;
}

export class DocumentShareResponseDto {
  id: string;
  uploadId: string;
  sharedByUserId: string;
  sharedWithUserId: string;
  permission: SharePermission;
  sharedAt: Date;
  sharedBy?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  sharedWith?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  upload?: {
    id: string;
    fileName: string;
    originalFileName: string;
    mimeType: string;
    fileSize: number;
    status: string;
  };
}
