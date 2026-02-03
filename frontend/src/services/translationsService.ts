import api from './api';

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

export interface Translation {
  id: string;
  userId: string;
  title: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceFileName?: string;
  originalCharCount?: number;
  translatedCharCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SaveTranslationDto {
  title: string;
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  sourceFileName?: string;
}

export const translationsService = {
  /**
   * Get supported languages
   */
  async getSupportedLanguages(): Promise<SupportedLanguage[]> {
    const response = await api.get<{ success: boolean; data: SupportedLanguage[] }>(
      '/translations/languages',
    );
    return response.data.data;
  },

  /**
   * Translate text
   */
  async translateText(
    text: string,
    targetLanguage: string,
    sourceLanguage?: string,
  ): Promise<TranslationResult> {
    const response = await api.post<{ success: boolean; data: TranslationResult }>(
      '/translations/translate',
      { text, targetLanguage, sourceLanguage },
    );
    return response.data.data;
  },

  /**
   * Translate summary
   */
  async translateSummary(
    summaryText: string,
    targetLanguage: string,
  ): Promise<TranslationResult> {
    const response = await api.post<{ success: boolean; data: TranslationResult }>(
      '/translations/summary',
      { summaryText, targetLanguage },
    );
    return response.data.data;
  },

  /**
   * Translate questionnaire
   */
  async translateQuestionnaire(
    questionnaire: any,
    targetLanguage: string,
  ): Promise<any> {
    const response = await api.post<{ success: boolean; data: any }>(
      '/translations/questionnaire',
      { questionnaire, targetLanguage },
    );
    return response.data.data;
  },

  /**
   * Translate mind map
   */
  async translateMindMap(mindMap: any, targetLanguage: string): Promise<any> {
    const response = await api.post<{ success: boolean; data: any }>(
      '/translations/mind-map',
      { mindMap, targetLanguage },
    );
    return response.data.data;
  },

  /**
   * Save translation to user library
   */
  async saveTranslation(dto: SaveTranslationDto): Promise<Translation> {
    const response = await api.post<{ success: boolean; data: Translation }>(
      '/translations/save',
      dto,
    );
    return response.data.data;
  },

  /**
   * Get all user translations
   */
  async getUserTranslations(): Promise<Translation[]> {
    const response = await api.get<{ success: boolean; data: Translation[] }>(
      '/translations/my',
    );
    return response.data.data;
  },

  /**
   * Get single translation
   */
  async getTranslation(id: string): Promise<Translation> {
    const response = await api.get<{ success: boolean; data: Translation }>(
      `/translations/${id}`,
    );
    return response.data.data;
  },

  /**
   * Update translation title
   */
  async updateTranslation(id: string, title: string): Promise<Translation> {
    const response = await api.patch<{ success: boolean; data: Translation }>(
      `/translations/${id}`,
      { title },
    );
    return response.data.data;
  },

  /**
   * Delete translation
   */
  async deleteTranslation(id: string): Promise<void> {
    await api.delete(`/translations/${id}`);
  },
};

export default translationsService;
