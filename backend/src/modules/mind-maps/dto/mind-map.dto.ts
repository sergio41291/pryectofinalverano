import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class GenerateMindMapDto {
  @IsString()
  @MinLength(50, { message: 'El texto debe tener al menos 50 caracteres para generar un mapa mental útil' })
  @MaxLength(10000, { message: 'El texto no debe exceder 10000 caracteres' })
  text: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  language?: string;
}

export class MindMapResponseDto {
  id: string;
  title: string;
  language: string;
  sourceCharCount: number;
  nodeCount: number;
  structure: {
    nodes: any[];
    edges: any[];
    metadata?: any;
  };
  createdAt: Date;
  updatedAt: Date;
}
