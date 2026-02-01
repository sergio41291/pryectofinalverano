import { IsString, IsOptional, IsArray, IsIn, IsDateString } from 'class-validator';

export class CreateQuestionnaireShareDto {
  @IsIn(['public', 'password', 'email', 'private'])
  shareType: 'public' | 'password' | 'email' | 'private';

  @IsString()
  @IsOptional()
  sharePassword?: string;

  @IsArray()
  @IsOptional()
  allowedEmails?: string[];

  @IsDateString()
  @IsOptional()
  validFrom?: string;

  @IsDateString()
  @IsOptional()
  validUntil?: string;
}
