import { IsString, IsOptional, Length, Matches } from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  @Length(1, 100)
  name: string;

  @IsString()
  @IsOptional()
  @Length(0, 500)
  description?: string;

  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'Color must be a valid hex color (e.g., #6366f1)' })
  color?: string;

  @IsString()
  @IsOptional()
  @Length(0, 50)
  icon?: string;
}
