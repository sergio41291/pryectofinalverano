import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Anthropic from '@anthropic-ai/sdk';
import { Readable } from 'stream';
import { Summary } from '../../entities/summary.entity';
import { CreateSummaryDto, SummaryResponseDto } from './dto/create-summary.dto';

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

  constructor(
    @InjectRepository(Summary)
    private readonly summaryRepository: Repository<Summary>,
  ) {
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
        model: 'claude-haiku-4-5-20251001',
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
        model: 'claude-haiku-4-5-20251001',
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
IMPORTANT: Response MUST be ONLY valid JSON, no other text before or after.
Do NOT use markdown code blocks. Do NOT wrap in backticks.
Return ONLY the raw JSON object, nothing else.

JSON structure:
{
  "questions": [
    {
      "id": 1,
      "question": "Question text",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": "Option A",
      "explanation": "Why this is correct"
    }
  ]
}`;

    const userPrompt = `Create exactly ${numQuestions} multiple-choice questions based on this text in ${language}. 
Each question must have exactly 4 options.
Return ONLY the JSON object with no markdown, no code blocks, no extra text.

Text:
${text}`;

    this.logger.log(`Generating ${numQuestions} questions from ${text.length} chars`);

    try {
      const message = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
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
        let jsonString = response.trim();
        
        // Try multiple approaches to extract JSON
        
        // Approach 1: Remove markdown code blocks with flexible regex
        const jsonMatch = jsonString.match(/```[\s\S]*?\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          jsonString = jsonMatch[1].trim();
        } else {
          // Approach 2: Find the first { and last } and extract everything between
          const firstBrace = jsonString.indexOf('{');
          const lastBrace = jsonString.lastIndexOf('}');
          
          if (firstBrace !== -1 && lastBrace !== -1 && firstBrace < lastBrace) {
            jsonString = jsonString.substring(firstBrace, lastBrace + 1);
          }
        }
        
        // Final cleanup
        jsonString = jsonString.trim();
        
        this.logger.log(`Parsing questionnaire JSON. Input length: ${jsonString.length}, First 100 chars: ${jsonString.substring(0, 100)}`);
        
        const parsed = JSON.parse(jsonString);
        
        // Validate structure
        if (!parsed.questions || !Array.isArray(parsed.questions)) {
          throw new Error('Missing or invalid questions array');
        }
        
        if (parsed.questions.length === 0) {
          throw new Error('Questions array is empty');
        }
        
        // Validate each question has required fields
        for (const q of parsed.questions) {
          if (!q.question || !q.options || !Array.isArray(q.options) || q.options.length === 0) {
            throw new Error('Invalid question structure');
          }
        }
        
        this.logger.log(`Questionnaire generated with ${parsed.questions.length} questions`);
        return parsed;
      } catch (parseError) {
        this.logger.error(`Failed to parse questionnaire JSON`);
        this.logger.error(`Response length: ${response.length}, First 200 chars: ${response.substring(0, 200)}`);
        this.logger.error(`Response last 200 chars: ${response.substring(Math.max(0, response.length - 200))}`);
        this.logger.error(`Parse error details:`, (parseError as any)?.message);
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
        model: 'claude-haiku-4-5-20251001',
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

  /**
   * Save a summary to database
   */
  async saveSummary(userId: string, dto: CreateSummaryDto): Promise<SummaryResponseDto> {
    const summary = this.summaryRepository.create({
      userId,
      ...dto,
      sourceCharCount: dto.sourceText.length,
      summaryCharCount: dto.summaryContent.length,
    });

    const saved = await this.summaryRepository.save(summary);
    return this.mapToResponse(saved);
  }

  /**
   * Get all summaries for a user
   */
  async getMySummaries(userId: string, page = 1, limit = 10): Promise<{ data: SummaryResponseDto[]; total: number }> {
    const [summaries, total] = await this.summaryRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data: summaries.map(s => this.mapToResponse(s)),
      total,
    };
  }

  /**
   * Get a specific summary
   */
  async getSummary(summaryId: string, userId: string): Promise<SummaryResponseDto> {
    const summary = await this.summaryRepository.findOne({
      where: { id: summaryId, userId },
    });

    if (!summary) {
      throw new NotFoundException('Summary not found');
    }

    return this.mapToResponse(summary);
  }

  /**
   * Delete a summary
   */
  async deleteSummary(summaryId: string, userId: string): Promise<void> {
    const summary = await this.summaryRepository.findOne({
      where: { id: summaryId, userId },
    });

    if (!summary) {
      throw new NotFoundException('Summary not found');
    }

    await this.summaryRepository.delete(summaryId);
  }

  /**
   * Get or migrate summary from audio result
   * If audio already has a summary but it's not in the summaries table, migrate it
   */
  async getOrMigrateAudioSummary(audioResultId: string, userId: string, audioResult?: any): Promise<SummaryResponseDto | null> {
    // First check if there's already a summary in the summaries table
    const existing = await this.summaryRepository.findOne({
      where: {
        userId,
        sourceFileName: audioResult?.fileName || '',
      },
      order: { createdAt: 'DESC' },
    });

    if (existing) {
      return this.mapToResponse(existing);
    }

    // If audio result has a summary but it's not migrated, migrate it now
    if (audioResult?.summary && audioResult.summary.trim().length > 0) {
      this.logger.log(`Migrating audio summary for audioResultId ${audioResultId}`);
      
      const migratedSummary = this.summaryRepository.create({
        userId,
        title: (audioResult.fileName || `audio_${audioResultId}`).replace(/\.[^/.]+$/, ''),
        sourceText: audioResult.transcription || 'Audio transcription',
        summaryContent: audioResult.summary,
        language: audioResult.language || 'es',
        style: 'bullet-points',
        sourceFileName: audioResult.fileName || `audio_${audioResultId}`,
        sourceCharCount: (audioResult.transcription || '').length,
        summaryCharCount: audioResult.summary.length,
      });

      const saved = await this.summaryRepository.save(migratedSummary);
      this.logger.log(`Audio summary migrated successfully: ${saved.id}`);
      return this.mapToResponse(saved);
    }

    return null;
  }

  /**
   * Download summary content as text
   */
  async getSummaryContent(summaryId: string, userId: string): Promise<{ content: string; fileName: string }> {
    const summary = await this.getSummary(summaryId, userId);

    const fileName = `${summary.title.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.txt`;
    const content = `${summary.title}\n${'='.repeat(summary.title.length)}\n\nGenerated: ${summary.createdAt.toLocaleString()}\nLanguage: ${summary.language}\nStyle: ${summary.style}\n\n${summary.summaryCharCount ? summary.summaryContent : ''}`;

    return { content, fileName };
  }

  /**
   * Map Summary entity to response DTO
   */
  private mapToResponse(summary: Summary): SummaryResponseDto {
    return {
      id: summary.id,
      title: summary.title,
      language: summary.language,
      style: summary.style,
      sourceCharCount: summary.sourceCharCount || 0,
      summaryCharCount: summary.summaryCharCount || 0,
      sourceFileName: summary.sourceFileName || '',
      summaryContent: summary.summaryContent,
      createdAt: summary.createdAt,
      updatedAt: summary.updatedAt,
    };
  }
}
