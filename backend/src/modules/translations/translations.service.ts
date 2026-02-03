import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AiService } from '../ai/ai.service';
import { Translation } from '../../entities/translation.entity';

export interface TranslationResult {
  original: string;
  translated: string;
  sourceLanguage: string;
  targetLanguage: string;
  charCount: number;
}

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
}

export interface CreateTranslationDto {
  title: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceFileName?: string;
}

@Injectable()
export class TranslationsService {
  private readonly logger = new Logger(TranslationsService.name);

  // Idiomas soportados
  private readonly supportedLanguages: SupportedLanguage[] = [
    { code: 'es', name: 'Spanish', nativeName: 'Español' },
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'fr', name: 'French', nativeName: 'Français' },
    { code: 'de', name: 'German', nativeName: 'Deutsch' },
    { code: 'it', name: 'Italian', nativeName: 'Italiano' },
    { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский' },
    { code: 'zh', name: 'Chinese', nativeName: '中文' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語' },
    { code: 'ko', name: 'Korean', nativeName: '한국어' },
  ];

  constructor(
    private readonly aiService: AiService,
    @InjectRepository(Translation)
    private readonly translationRepository: Repository<Translation>,
  ) {}

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return this.supportedLanguages;
  }

  /**
   * Validate if language is supported
   */
  isLanguageSupported(languageCode: string): boolean {
    return this.supportedLanguages.some((lang) => lang.code === languageCode);
  }

  /**
   * Get language name by code
   */
  getLanguageName(code: string): string {
    const language = this.supportedLanguages.find((lang) => lang.code === code);
    return language ? language.nativeName : code.toUpperCase();
  }

  /**
   * Translate text to target language
   */
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string,
  ): Promise<TranslationResult> {
    if (!text || text.trim().length === 0) {
      throw new BadRequestException('Text is required for translation');
    }

    if (!this.isLanguageSupported(targetLanguage)) {
      throw new BadRequestException(
        `Language ${targetLanguage} is not supported. Supported languages: ${this.supportedLanguages.map((l) => l.code).join(', ')}`,
      );
    }

    const targetLangName = this.getLanguageName(targetLanguage);

    this.logger.log(
      `Translating ${text.length} chars to ${targetLanguage} (${targetLangName})`,
    );

    try {
      const translated = await this.aiService.translate(text, targetLangName);

      return {
        original: text,
        translated,
        sourceLanguage: sourceLanguage || 'auto',
        targetLanguage,
        charCount: translated.length,
      };
    } catch (error: any) {
      this.logger.error(
        `Translation failed: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Translate summary content
   */
  async translateSummary(
    summaryText: string,
    targetLanguage: string,
  ): Promise<TranslationResult> {
    return this.translateText(summaryText, targetLanguage);
  }

  /**
   * Translate questionnaire
   */
  async translateQuestionnaire(
    questionnaire: any,
    targetLanguage: string,
  ): Promise<any> {
    const targetLangName = this.getLanguageName(targetLanguage);

    this.logger.log(
      `Translating questionnaire with ${questionnaire.questions?.length || 0} questions to ${targetLanguage}`,
    );

    try {
      // Traducir título si existe
      let translatedTitle = questionnaire.title;
      if (questionnaire.title) {
        translatedTitle = await this.aiService.translate(
          questionnaire.title,
          targetLangName,
        );
      }

      // Traducir cada pregunta
      const translatedQuestions = await Promise.all(
        (questionnaire.questions || []).map(async (question: any) => {
          const translatedQuestion = await this.aiService.translate(
            question.question,
            targetLangName,
          );
          const translatedOptions = await Promise.all(
            question.options.map((opt: string) =>
              this.aiService.translate(opt, targetLangName),
            ),
          );
          const translatedExplanation = await this.aiService.translate(
            question.explanation,
            targetLangName,
          );

          return {
            ...question,
            question: translatedQuestion,
            options: translatedOptions,
            explanation: translatedExplanation,
          };
        }),
      );

      return {
        ...questionnaire,
        title: translatedTitle,
        questions: translatedQuestions,
        language: targetLanguage,
      };
    } catch (error: any) {
      this.logger.error(
        `Questionnaire translation failed: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Translate mind map
   */
  async translateMindMap(mindMap: any, targetLanguage: string): Promise<any> {
    const targetLangName = this.getLanguageName(targetLanguage);

    this.logger.log(
      `Translating mind map with ${mindMap.nodes?.length || 0} nodes to ${targetLanguage}`,
    );

    try {
      // Traducir título
      const translatedTitle = await this.aiService.translate(
        mindMap.title,
        targetLangName,
      );

      // Traducir nodos
      const translatedNodes = await Promise.all(
        (mindMap.nodes || []).map(async (node: any) => {
          const translatedLabel = await this.aiService.translate(
            node.label,
            targetLangName,
          );
          return {
            ...node,
            label: translatedLabel,
          };
        }),
      );

      return {
        ...mindMap,
        title: translatedTitle,
        nodes: translatedNodes,
        language: targetLanguage,
      };
    } catch (error: any) {
      this.logger.error(
        `Mind map translation failed: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Save translation to database
   */
  async saveTranslation(
    userId: string,
    dto: CreateTranslationDto,
  ): Promise<Translation> {
    try {
      const translation = this.translationRepository.create({
        userId,
        title: dto.title,
        originalText: dto.originalText,
        translatedText: dto.translatedText,
        sourceLanguage: dto.sourceLanguage,
        targetLanguage: dto.targetLanguage,
        sourceFileName: dto.sourceFileName,
        originalCharCount: dto.originalText.length,
        translatedCharCount: dto.translatedText.length,
      });

      const saved = await this.translationRepository.save(translation);
      this.logger.log(`Translation saved: ${saved.id}`);
      return saved;
    } catch (error: any) {
      this.logger.error(`Failed to save translation: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  /**
   * Get all translations for a user
   */
  async getUserTranslations(userId: string): Promise<Translation[]> {
    try {
      const translations = await this.translationRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
      });

      this.logger.log(`Retrieved ${translations.length} translations for user ${userId}`);
      return translations;
    } catch (error: any) {
      this.logger.error(
        `Failed to retrieve translations: ${error?.message}`,
        error?.stack,
      );
      throw error;
    }
  }

  /**
   * Get single translation by ID
   */
  async getTranslation(id: string, userId: string): Promise<Translation> {
    try {
      const translation = await this.translationRepository.findOne({
        where: { id, userId },
      });

      if (!translation) {
        throw new NotFoundException(`Translation ${id} not found`);
      }

      return translation;
    } catch (error: any) {
      this.logger.error(`Failed to get translation: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  /**
   * Delete translation
   */
  async deleteTranslation(id: string, userId: string): Promise<void> {
    try {
      const translation = await this.getTranslation(id, userId);
      await this.translationRepository.remove(translation);
      this.logger.log(`Translation ${id} deleted`);
    } catch (error: any) {
      this.logger.error(`Failed to delete translation: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  /**
   * Update translation title
   */
  async updateTranslation(
    id: string,
    userId: string,
    title: string,
  ): Promise<Translation> {
    try {
      const translation = await this.getTranslation(id, userId);
      translation.title = title;
      const updated = await this.translationRepository.save(translation);
      this.logger.log(`Translation ${id} updated`);
      return updated;
    } catch (error: any) {
      this.logger.error(`Failed to update translation: ${error?.message}`, error?.stack);
      throw error;
    }
  }
}
