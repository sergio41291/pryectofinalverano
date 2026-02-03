import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TranslationsController } from './translations.controller';
import { TranslationsService } from './translations.service';
import { AiModule } from '../ai/ai.module';
import { Translation } from '../../entities/translation.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Translation]), AiModule],
  controllers: [TranslationsController],
  providers: [TranslationsService],
  exports: [TranslationsService],
})
export class TranslationsModule {}
