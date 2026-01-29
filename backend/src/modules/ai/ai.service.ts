import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { Readable } from 'stream';

interface SummarizeOptions {
  text: string;
  language?: string;
  maxTokens?: number;
  style?: 'bullet-points' | 'paragraph' | 'executive';
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly client: Anthropic;

  constructor() {
    if (!process.env.ANTHROPIC_API_KEY) {
      this.logger.warn('ANTHROPIC_API_KEY not set - AI features will be disabled');
    }

    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    });
  }

  /**
   * Generate a summary from extracted OCR text using Claude API with streaming
   * @param options Summary options including text, language, format
   * @returns ReadableStream for Server-Sent Events
   */
  async *streamSummarize(options: SummarizeOptions): AsyncGenerator<string> {
    const { text, language = 'es', maxTokens = 1024, style = 'bullet-points' } = options;

    if (!text || text.trim().length === 0) {
      throw new BadRequestException('Text content is required for summarization');
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new BadRequestException('AI service is not configured');
    }

    const systemPrompt = this.buildSystemPrompt(language, style);
    const userPrompt = this.buildUserPrompt(text, language, style);

    this.logger.log(
      `Starting summary generation for ${text.length} chars in ${language} (${style})`,
    );

    try {
      const stream = await this.client.messages.stream({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          yield chunk.delta.text;
        }
      }

      this.logger.log('Summary generation completed successfully');
    } catch (error: any) {
      this.logger.error(`Summary generation failed: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  /**
   * Generate summary (non-streaming, for API responses)
   */
  async summarize(options: SummarizeOptions): Promise<string> {
    const { text, language = 'es', maxTokens = 1024, style = 'bullet-points' } = options;

    if (!text || text.trim().length === 0) {
      throw new BadRequestException('Text content is required for summarization');
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new BadRequestException('AI service is not configured');
    }

    const systemPrompt = this.buildSystemPrompt(language, style);
    const userPrompt = this.buildUserPrompt(text, language, style);

    this.logger.log(`Generating summary for ${text.length} chars in ${language}`);

    try {
      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const summary = message.content
        .filter((block) => block.type === 'text')
        .map((block) => (block.type === 'text' ? block.text : ''))
        .join('\n');

      this.logger.log(`Summary generated: ${summary.length} chars`);
      return summary;
    } catch (error: any) {
      this.logger.error(`Summary generation failed: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  /**
   * Generate a questionnaire from OCR text
   */
  async generateQuestionnaire(
    text: string,
    language: string = 'es',
    numQuestions: number = 5,
  ): Promise<any> {
    if (!text || text.trim().length === 0) {
      throw new BadRequestException('Text content is required for questionnaire generation');
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new BadRequestException('AI service is not configured');
    }

    const systemPrompt = `You are an expert educator creating multiple-choice questions.
Generate exactly ${numQuestions} multiple-choice questions in ${language}.
Response MUST be valid JSON with this structure:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "explanation": "Why this is correct"
    }
  ]
}`;

    const userPrompt = `Create ${numQuestions} multiple-choice questions based on this text in ${language}:

${text}

Return ONLY valid JSON, no other text.`;

    this.logger.log(`Generating ${numQuestions} questions from ${text.length} chars`);

    try {
      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const response = message.content
        .filter((block) => block.type === 'text')
        .map((block) => (block.type === 'text' ? block.text : ''))
        .join('\n');

      try {
        // Try to extract JSON if wrapped in markdown code blocks
        const jsonMatch = response.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
        const jsonString = jsonMatch ? jsonMatch[1] : response;
        const parsed = JSON.parse(jsonString);
        this.logger.log(`Questionnaire generated with ${parsed.questions?.length || 0} questions`);
        return parsed;
      } catch (parseError) {
        this.logger.error(`Failed to parse questionnaire JSON: ${response.substring(0, 200)}`);
        throw new BadRequestException('Invalid questionnaire format generated');
      }
    } catch (error: any) {
      this.logger.error(`Questionnaire generation failed: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  /**
   * Translate text to another language
   */
  async translate(text: string, targetLanguage: string): Promise<string> {
    if (!text || text.trim().length === 0) {
      throw new BadRequestException('Text is required for translation');
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      throw new BadRequestException('AI service is not configured');
    }

    const systemPrompt = `You are a professional translator. Translate text to ${targetLanguage}.
Keep the tone and style. Return ONLY the translation, no explanations.`;

    const userPrompt = `Translate this text to ${targetLanguage}:\n\n${text}`;

    this.logger.log(`Translating ${text.length} chars to ${targetLanguage}`);

    try {
      const message = await this.client.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      });

      const translation = message.content
        .filter((block) => block.type === 'text')
        .map((block) => (block.type === 'text' ? block.text : ''))
        .join('\n');

      this.logger.log(`Translation completed: ${translation.length} chars`);
      return translation;
    } catch (error: any) {
      this.logger.error(`Translation failed: ${error?.message}`, error?.stack);
      throw error;
    }
  }

  /**
   * Build system prompt based on language and style
   */
  private buildSystemPrompt(
    language: string,
    style: 'bullet-points' | 'paragraph' | 'executive',
  ): string {
    const styleGuide: Record<string, string> = {
      'bullet-points': 'Use bullet points for clarity and organization.',
      paragraph: 'Write in paragraph format for flowing narrative.',
      executive: 'Write a concise executive summary (2-3 sentences).',
    };

    return `You are an expert summarizer. Create a clear, concise summary in ${language}.
${styleGuide[style] || styleGuide['bullet-points']}
Focus on key points and main ideas.
Be accurate and maintain the original meaning.`;
  }

  /**
   * Build user prompt for summarization
   */
  private buildUserPrompt(
    text: string,
    language: string,
    style: 'bullet-points' | 'paragraph' | 'executive',
  ): string {
    const styleRequest: Record<string, string> = {
      'bullet-points':
        'Format the summary as a bullet-point list of the main ideas.',
      paragraph: 'Write the summary as a coherent paragraph.',
      executive: 'Create a 2-3 sentence executive summary.',
    };

    return `Summarize this text in ${language}. ${styleRequest[style] || styleRequest['bullet-points']}\n\nText:\n${text}`;
  }
}
