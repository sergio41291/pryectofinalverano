import { IsString, IsArray, IsOptional, IsEmail, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

class AnswerDto {
  @IsString()
  questionId: string;

  @IsNumber()
  selectedAnswer: number;
}

export class SubmitQuestionnaireResponseDto {
  @IsString()
  respondentName: string;

  @IsOptional()
  @IsEmail()
  respondentEmail?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];
}
