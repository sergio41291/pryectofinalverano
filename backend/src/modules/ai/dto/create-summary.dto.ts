import { IsString, IsEnum, IsOptional, MinLength } from 'class-validator';

export class CreateSummaryDto {
  @IsString()
  @MinLength(1)
  title: string;

  @IsString()
  @MinLength(10)
  sourceText: string;

  @IsString()
  summaryContent: string;

  @IsString()
  language: string;

  @IsEnum(['bullet-points', 'paragraph', 'executive'])
  style: 'bullet-points' | 'paragraph' | 'executive';

  @IsOptional()
  @IsString()
  sourceFileName?: string;

  @IsOptional()
  sourceCharCount?: number;
}

export class SummaryResponseDto {
  id: string;
  title: string;
  language: string;
  style: string;
  sourceCharCount: number;
  summaryCharCount: number;
  sourceFileName: string;
  summaryContent: string;
  createdAt: Date;
  updatedAt: Date;
}
