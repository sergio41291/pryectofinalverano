import api from './api';

export interface SummarizeRequest {
  text: string;
  language?: string;
  maxTokens?: number;
  style?: 'bullet-points' | 'paragraph' | 'executive';
}

export interface QuestionnaireRequest {
  text: string;
  language?: string;
  numQuestions?: number;
}

export interface TranslateRequest {
  text: string;
  targetLanguage: string;
}

export const aiService = {
  /**
   * Stream summary generation from Claude API
   * Yields chunks as they arrive
   */
  async *streamSummarize(request: SummarizeRequest): AsyncGenerator<string> {
    try {
      const response = await fetch(`${api.defaults.baseURL}/processing/summarize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');

        // Process complete lines
        for (let i = 0; i < lines.length - 1; i++) {
          const line = lines[i].trim();
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.substring(6));
            if (data.content) {
              yield data.content;
            }
            if (data.complete) {
              return;
            }
            if (data.error) {
              throw new Error(data.error);
            }
          }
        }

        // Keep incomplete line in buffer
        buffer = lines[lines.length - 1];
      }
    } catch (error: any) {
      console.error('Stream error:', error);
      throw error;
    }
  },

  /**
   * Generate summary (non-streaming)
   */
  async summarize(request: SummarizeRequest): Promise<string> {
    const response = await api.post<{ content: string }>(
      '/processing/summarize',
      request,
    );
    return response.data.content;
  },

  /**
   * Generate questionnaire
   */
  async generateQuestionnaire(
    request: QuestionnaireRequest,
  ): Promise<{
    success: boolean;
    data: {
      questions: Array<{
        id: number;
        question: string;
        options: string[];
        correctAnswer: string;
        explanation: string;
      }>;
    };
  }> {
    const response = await api.post(
      '/processing/questionnaire',
      request,
    );
    return response.data;
  },

  /**
   * Translate text
   */
  async translate(request: TranslateRequest): Promise<{
    success: boolean;
    data: {
      original: string;
      translated: string;
      targetLanguage: string;
    };
  }> {
    const response = await api.post(
      '/processing/translate',
      request,
    );
    return response.data;
  },
};

export default aiService;
