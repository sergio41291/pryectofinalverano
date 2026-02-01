import { IsString, IsOptional, IsArray, IsIn, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class QuestionDto {
  @IsString()
  id: string;

  @IsString()
  question: string;

  @IsArray()
  options: string[];

  @IsNumber()
  correctAnswer: number;

  @IsString()
  explanation: string;
}

export class CreateQuestionnaireDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionDto)
  questions: QuestionDto[];

  @IsIn(['draft', 'published', 'archived'])
  @IsOptional()
  status?: 'draft' | 'published' | 'archived';
}
