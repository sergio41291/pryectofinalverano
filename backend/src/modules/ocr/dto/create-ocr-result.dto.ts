import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateOcrResultDto {
  @IsString()
  uploadId: string;

  @IsString()
  userId: string;

  @IsOptional()
  @IsString()
  language?: string;
}
