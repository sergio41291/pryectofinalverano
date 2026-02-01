import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuestionnairesService } from './questionnaires.service';
import { QuestionnairesController } from './questionnaires.controller';
import { QuestionnaireExportService } from './questionnaire-export.service';
import { Questionnaire } from '../../entities/questionnaire.entity';
import { QuestionnaireResponse } from '../../entities/questionnaire-response.entity';
import { QuestionnaireShare } from '../../entities/questionnaire-share.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Questionnaire, QuestionnaireResponse, QuestionnaireShare])],
  controllers: [QuestionnairesController],
  providers: [QuestionnairesService, QuestionnaireExportService],
  exports: [QuestionnairesService, QuestionnaireExportService],
})
export class QuestionnairesModule {}
