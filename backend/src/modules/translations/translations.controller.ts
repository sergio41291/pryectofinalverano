import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Logger,
  BadRequestException,
  Req,
  Delete,
  Param,
  Patch,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TranslationsService } from './translations.service';
import { Request } from 'express';

interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
  };
}

@ApiTags('Translations')
@ApiBearerAuth()
@Controller('translations')
@UseGuards(AuthGuard('jwt'))
export class TranslationsController {
  private readonly logger = new Logger(TranslationsController.name);

  constructor(private readonly translationsService: TranslationsService) {}

  /**
   * Get supported languages
   * GET /api/translations/languages
   */
  @Get('languages')
  @ApiOperation({ summary: 'Get list of supported languages' })
  getSupportedLanguages() {
    return {
      success: true,
      data: this.translationsService.getSupportedLanguages(),
    };
  }

  /**
   * Translate text
   * POST /api/translations/translate
   */
  @Post('translate')
  @ApiOperation({ summary: 'Translate text to target language' })
  async translateText(
    @Body()
    body: {
      text: string;
      targetLanguage: string;
      sourceLanguage?: string;
    },
  ) {
    try {
      if (!body.text || body.text.trim().length === 0) {
        throw new BadRequestException('Text is required');
      }

      if (!body.targetLanguage) {
        throw new BadRequestException('Target language is required');
      }

      this.logger.log(`Translation request to ${body.targetLanguage}`);

      const result = await this.translationsService.translateText(
        body.text,
        body.targetLanguage,
        body.sourceLanguage,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      this.logger.error(`Translation error: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Translate summary
   * POST /api/translations/summary
   */
  @Post('summary')
  @ApiOperation({ summary: 'Translate summary content' })
  async translateSummary(
    @Body() body: { summaryText: string; targetLanguage: string },
  ) {
    try {
      if (!body.summaryText || body.summaryText.trim().length === 0) {
        throw new BadRequestException('Summary text is required');
      }

      if (!body.targetLanguage) {
        throw new BadRequestException('Target language is required');
      }

      this.logger.log(`Summary translation request to ${body.targetLanguage}`);

      const result = await this.translationsService.translateSummary(
        body.summaryText,
        body.targetLanguage,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      this.logger.error(`Summary translation error: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Translate questionnaire
   * POST /api/translations/questionnaire
   */
  @Post('questionnaire')
  @ApiOperation({ summary: 'Translate questionnaire content' })
  async translateQuestionnaire(
    @Body() body: { questionnaire: any; targetLanguage: string },
  ) {
    try {
      if (!body.questionnaire) {
        throw new BadRequestException('Questionnaire is required');
      }

      if (!body.targetLanguage) {
        throw new BadRequestException('Target language is required');
      }

      this.logger.log(
        `Questionnaire translation request to ${body.targetLanguage}`,
      );

      const result = await this.translationsService.translateQuestionnaire(
        body.questionnaire,
        body.targetLanguage,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      this.logger.error(`Questionnaire translation error: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Translate mind map
   * POST /api/translations/mind-map
   */
  @Post('mind-map')
  @ApiOperation({ summary: 'Translate mind map content' })
  async translateMindMap(
    @Body() body: { mindMap: any; targetLanguage: string },
  ) {
    try {
      if (!body.mindMap) {
        throw new BadRequestException('Mind map is required');
      }

      if (!body.targetLanguage) {
        throw new BadRequestException('Target language is required');
      }

      this.logger.log(`Mind map translation request to ${body.targetLanguage}`);

      const result = await this.translationsService.translateMindMap(
        body.mindMap,
        body.targetLanguage,
      );

      return {
        success: true,
        data: result,
      };
    } catch (error: any) {
      this.logger.error(`Mind map translation error: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Save translation
   * POST /api/translations/save
   */
  @Post('save')
  @ApiOperation({ summary: 'Save translation to user library' })
  async saveTranslation(
    @Req() req: AuthRequest,
    @Body()
    body: {
      title: string;
      originalText: string;
      translatedText: string;
      sourceLanguage: string;
      targetLanguage: string;
      sourceFileName?: string;
    },
  ) {
    try {
      const translation = await this.translationsService.saveTranslation(req.user.id, {
        title: body.title,
        originalText: body.originalText,
        translatedText: body.translatedText,
        sourceLanguage: body.sourceLanguage,
        targetLanguage: body.targetLanguage,
        sourceFileName: body.sourceFileName,
      });

      return {
        success: true,
        data: translation,
      };
    } catch (error: any) {
      this.logger.error(`Save translation error: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Get user translations
   * GET /api/translations/my
   */
  @Get('my')
  @ApiOperation({ summary: 'Get all translations for current user' })
  async getUserTranslations(@Req() req: AuthRequest) {
    try {
      const translations = await this.translationsService.getUserTranslations(
        req.user.id,
      );

      return {
        success: true,
        data: translations,
      };
    } catch (error: any) {
      this.logger.error(`Get translations error: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Get single translation
   * GET /api/translations/:id
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get single translation by ID' })
  async getTranslation(@Req() req: AuthRequest, @Param('id') id: string) {
    try {
      const translation = await this.translationsService.getTranslation(
        id,
        req.user.id,
      );

      return {
        success: true,
        data: translation,
      };
    } catch (error: any) {
      this.logger.error(`Get translation error: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Update translation
   * PATCH /api/translations/:id
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update translation title' })
  async updateTranslation(
    @Req() req: AuthRequest,
    @Param('id') id: string,
    @Body() body: { title: string },
  ) {
    try {
      const translation = await this.translationsService.updateTranslation(
        id,
        req.user.id,
        body.title,
      );

      return {
        success: true,
        data: translation,
      };
    } catch (error: any) {
      this.logger.error(`Update translation error: ${error?.message}`);
      throw error;
    }
  }

  /**
   * Delete translation
   * DELETE /api/translations/:id
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete translation' })
  async deleteTranslation(@Req() req: AuthRequest, @Param('id') id: string) {
    try {
      await this.translationsService.deleteTranslation(id, req.user.id);

      return {
        success: true,
        message: 'Translation deleted successfully',
      };
    } catch (error: any) {
      this.logger.error(`Delete translation error: ${error?.message}`);
      throw error;
    }
  }
}
