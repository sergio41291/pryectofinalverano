import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
  Response,
} from '@nestjs/common';
import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { QuestionnairesService } from './questionnaires.service';
import { QuestionnaireExportService } from './questionnaire-export.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateQuestionnaireDto } from './dto/create-questionnaire.dto';
import { CreateQuestionnaireShareDto } from './dto/create-questionnaire-share.dto';
import { SubmitQuestionnaireResponseDto } from './dto/submit-questionnaire-response.dto';

@Controller('questionnaires')
export class QuestionnairesController {
  constructor(
    private questionnairesService: QuestionnairesService,
    private exportService: QuestionnaireExportService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: ExpressRequest & { user: any }, @Body() createQuestionnaireDto: CreateQuestionnaireDto) {
    return this.questionnairesService.create(req.user.id, createQuestionnaireDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Request() req: ExpressRequest & { user: any }) {
    return this.questionnairesService.findAllByUser(req.user.id);
  }

  // Routes with specific paths must come before :id parameter routes
  @Get('share/:shareToken')
  getSharedQuestionnaire(
    @Param('shareToken') shareToken: string,
    @Query('email') email?: string,
  ) {
    return this.questionnairesService.validateShareAccess(shareToken, email);
  }

  @Post('share/:shareToken/auth')
  authenticateShare(
    @Param('shareToken') shareToken: string,
    @Body() { password, email }: { password?: string; email?: string },
  ) {
    return this.questionnairesService.authenticateShare(shareToken, password, email);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/stats')
  getStats(@Request() req: ExpressRequest & { user: any }, @Param('id') id: string) {
    return this.questionnairesService.getStats(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/share')
  configureShare(
    @Request() req: ExpressRequest & { user: any },
    @Param('id') id: string,
    @Body() shareDto: CreateQuestionnaireShareDto,
  ) {
    return this.questionnairesService.configureShare(id, req.user.id, shareDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/share-config')
  getShareConfig(@Request() req: ExpressRequest & { user: any }, @Param('id') id: string) {
    return this.questionnairesService.getShareConfig(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/download/:format')
  async downloadQuestionnaire(
    @Request() req: ExpressRequest & { user: any },
    @Param('id') id: string,
    @Param('format') format: 'json' | 'pdf' | 'csv',
    @Response() res: ExpressResponse,
  ) {
    const questionnaire = await this.questionnairesService.findById(id);

    if (questionnaire.userId !== req.user.id) {
      throw new Error('Unauthorized');
    }

    let buffer: Buffer;
    let contentType: string;
    let filename: string;

    switch (format) {
      case 'json':
        buffer = this.exportService.exportToJSON(questionnaire);
        contentType = 'application/json';
        filename = `${questionnaire.name}.json`;
        break;
      case 'pdf':
        buffer = await this.exportService.exportToPDF(questionnaire);
        contentType = 'application/pdf';
        filename = `${questionnaire.name}.pdf`;
        break;
      case 'csv':
        buffer = await this.exportService.exportToCSV(questionnaire);
        contentType = 'text/csv';
        filename = `${questionnaire.name}.csv`;
        break;
      default:
        throw new Error('Invalid format');
    }

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.questionnairesService.findById(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Request() req: ExpressRequest & { user: any },
    @Param('id') id: string,
    @Body() updateQuestionnaireDto: Partial<CreateQuestionnaireDto>,
  ) {
    return this.questionnairesService.update(id, req.user.id, updateQuestionnaireDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  delete(@Request() req: ExpressRequest & { user: any }, @Param('id') id: string) {
    return this.questionnairesService.delete(id, req.user.id);
  }

  @Post(':id/responses')
  submitResponse(
    @Param('id') questionnaireId: string,
    @Body() submitDto: SubmitQuestionnaireResponseDto,
    @Query('shareToken') shareToken?: string,
    @Request() req?: ExpressRequest,
  ) {
    const ipAddress = req?.ip || 'unknown';
    const userAgent = req?.headers['user-agent'] as string || 'unknown';
    return this.questionnairesService.submitResponse(questionnaireId, submitDto, shareToken || null, ipAddress, userAgent);
  }
}
